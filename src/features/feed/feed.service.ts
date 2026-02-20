import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PostEntity } from "src/core/db/entities/post.entity";
import { PostLikeEntity } from "src/core/db/entities/post-like.entity";
import { CommentEntity } from "src/core/db/entities/comment.entity";
import { UserRoles } from "src/core/db/enums/user_roles";
import { CreatePostDto } from "./dto/create-post.dto";
import { CreateCommentDto } from "./dto/create-comment.dto";

@Injectable()
export class FeedService {
    constructor(
        @InjectRepository(PostEntity)
        private readonly postRepo: Repository<PostEntity>,
        @InjectRepository(PostLikeEntity)
        private readonly likeRepo: Repository<PostLikeEntity>,
        @InjectRepository(CommentEntity)
        private readonly commentRepo: Repository<CommentEntity>,
    ) { }

    async getFeed(user: any, page = 1, limit = 20) {
        const qb = this.postRepo.createQueryBuilder('post')
            .leftJoinAndSelect('post.author', 'author')
            .leftJoinAndSelect('post.branch', 'branch')
            .where('post.isHidden = false');

        // SUPERADMIN sees all, others see own branch only
        if (user.role !== UserRoles.SUPERADMIN) {
            qb.andWhere('post.branchId = :branchId', { branchId: user.branchId });
        }

        qb.orderBy('post.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        const [data, total] = await qb.getManyAndCount();
        return {
            data,
            meta: { page, limit, total, lastPage: Math.ceil(total / limit) },
        };
    }

    async createPost(dto: CreatePostDto, user: any): Promise<PostEntity> {
        const post = this.postRepo.create({
            ...dto,
            authorId: user.sub,
            branchId: user.branchId,
        });
        return this.postRepo.save(post);
    }

    async getPost(id: number): Promise<PostEntity> {
        const post = await this.postRepo.findOne({
            where: { id },
            relations: ['author', 'branch'],
        });
        if (!post) throw new NotFoundException('Post not found');
        return post;
    }

    async deletePost(id: number, user: any) {
        const post = await this.getPost(id);

        // Only author, ADMIN of same branch, or SUPERADMIN can delete
        const isAuthor = post.authorId === user.sub;
        const isBranchAdmin = user.role === UserRoles.ADMIN && post.branchId === user.branchId;
        const isSuperAdmin = user.role === UserRoles.SUPERADMIN;

        if (!isAuthor && !isBranchAdmin && !isSuperAdmin) {
            throw new ForbiddenException('You cannot delete this post');
        }

        return this.postRepo.softDelete(id);
    }

    async toggleLike(postId: number, userId: number) {
        const post = await this.getPost(postId);
        const existing = await this.likeRepo.findOne({ where: { postId, userId } });

        if (existing) {
            await this.likeRepo.remove(existing);
            post.likesCount = Math.max(0, post.likesCount - 1);
            await this.postRepo.save(post);
            return { liked: false, likesCount: post.likesCount };
        } else {
            await this.likeRepo.save({ postId, userId });
            post.likesCount += 1;
            await this.postRepo.save(post);
            return { liked: true, likesCount: post.likesCount };
        }
    }

    async hidePost(postId: number, user: any) {
        const post = await this.getPost(postId);

        const isBranchAdmin = user.role === UserRoles.ADMIN && post.branchId === user.branchId;
        const isSuperAdmin = user.role === UserRoles.SUPERADMIN;

        if (!isBranchAdmin && !isSuperAdmin) {
            throw new ForbiddenException('Only branch admin or superadmin can moderate posts');
        }

        post.isHidden = !post.isHidden;
        return this.postRepo.save(post);
    }

    // --- Comments ---

    async getComments(postId: number, page = 1, limit = 20) {
        const [data, total] = await this.commentRepo.findAndCount({
            where: { postId, isHidden: false },
            relations: ['author'],
            order: { createdAt: 'ASC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return {
            data,
            meta: { page, limit, total, lastPage: Math.ceil(total / limit) },
        };
    }

    async createComment(postId: number, dto: CreateCommentDto, user: any): Promise<CommentEntity> {
        await this.getPost(postId); // Verify post exists

        const comment = this.commentRepo.create({
            postId,
            authorId: user.sub,
            content: dto.content,
        });
        const saved = await this.commentRepo.save(comment);

        // Increment counter
        await this.postRepo.increment({ id: postId }, 'commentsCount', 1);

        return saved;
    }

    async deleteComment(commentId: number, user: any) {
        const comment = await this.commentRepo.findOne({
            where: { id: commentId },
            relations: ['post'],
        });
        if (!comment) throw new NotFoundException('Comment not found');

        const isAuthor = comment.authorId === user.sub;
        const isBranchAdmin = user.role === UserRoles.ADMIN && comment.post.branchId === user.branchId;
        const isSuperAdmin = user.role === UserRoles.SUPERADMIN;

        if (!isAuthor && !isBranchAdmin && !isSuperAdmin) {
            throw new ForbiddenException('You cannot delete this comment');
        }

        await this.commentRepo.softDelete(commentId);
        await this.postRepo.decrement({ id: comment.postId }, 'commentsCount', 1);

        return { message: 'Comment deleted' };
    }
}
