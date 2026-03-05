import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, In, Repository } from "typeorm";
import { PostEntity } from "src/core/db/entities/post.entity";
import { PostLikeEntity } from "src/core/db/entities/post-like.entity";
import { CommentEntity } from "src/core/db/entities/comment.entity";
import { UserRoles } from "src/core/db/enums/user_roles";
import { CreatePostDto } from "./dto/create-post.dto";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { UploadService } from "../upload/upload.service";

@Injectable()
export class FeedService {
    constructor(
        @InjectRepository(PostEntity)
        private readonly postRepo: Repository<PostEntity>,
        @InjectRepository(PostLikeEntity)
        private readonly likeRepo: Repository<PostLikeEntity>,
        @InjectRepository(CommentEntity)
        private readonly commentRepo: Repository<CommentEntity>,
        private readonly uploadService: UploadService,
    ) { }

    async getFeed(user: any, page: number, limit: number) {
        const qb = this.postRepo.createQueryBuilder('post')
            .leftJoinAndSelect('post.author', 'author')
            .orderBy('post.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        const [data, total] = await qb.getManyAndCount();

        if (user?.sub) {
            await this.populateLikes(data, user.sub);
        }

        return {
            data,
            meta: { page, limit, total, lastPage: Math.ceil(total / limit) },
        };
    }

    async createPost(dto: CreatePostDto, user: any): Promise<PostEntity> {
        const post = this.postRepo.create({
            ...dto,
            authorId: user.sub,
        });
        return this.postRepo.save(post);
    }

    async searchPosts(search: string, userId?: number) {
        const [data, total] = await this.postRepo.findAndCount({
            where: { content: ILike(`%${search}%`) },
            relations: ['author', 'author.branch'],
            order: { createdAt: 'DESC' },
        });

        if (userId) {
            await this.populateLikes(data, userId);
        }

        return {
            data,
            meta: { page: 1, limit: total, total, lastPage: 1 },
        };
    }

    async searchPostById(id: number): Promise<PostEntity> {
        const post = await this.postRepo.findOne({ where: { id }, relations: ['author'] })
        if (!post) throw new NotFoundException('Пост не найден')
        return post
    }

    async deletePost(id: number, user: any) {
        const post = await this.searchPostById(id)

        const isAuthor = post.authorId === user.sub;
        const isSuperAdmin = user.role === UserRoles.SUPERADMIN;

        if (!isAuthor && !isSuperAdmin) {
            throw new ForbiddenException('Вы не можете удалить этот пост');
        }

        // Delete image from Cloudinary if exists
        // Wait, FeedService doesn't have UploadService injected yet.
        // I will update the constructor first.
        return this.postRepo.softDelete(id);
    }

    async toggleLike(postId: number, userId: number) {
        const post = await this.searchPostById(postId);
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

    async getComments(postId: number, page: number, limit: number) {
        const [data, total] = await this.commentRepo.findAndCount({
            where: { postId },
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
        await this.searchPostById(postId);

        const comment = this.commentRepo.create({
            postId,
            authorId: user.sub,
            content: dto.content,
        });
        const saved = await this.commentRepo.save(comment);

        await this.postRepo.increment({ id: postId }, 'commentsCount', 1);

        return saved;
    }

    async deleteComment(commentId: number, user: any) {
        const comment = await this.commentRepo.findOne({
            where: { id: commentId },
            relations: ['post'],
        });
        if (!comment) throw new NotFoundException('Комментарий не найден');

        const isAuthor = comment.authorId === user.sub;
        const isSuperAdmin = user.role === UserRoles.SUPERADMIN;

        if (!isAuthor && !isSuperAdmin) {
            throw new ForbiddenException('Вы не можете удалить этот комментарий');
        }

        await this.commentRepo.softDelete(commentId);
        await this.postRepo.decrement({ id: comment.postId }, 'commentsCount', 1);

        return { message: 'Comment deleted' };
    }

    private async populateLikes(posts: PostEntity[], userId: number) {
        if (!posts.length) return;

        const postIds = posts.map(p => p.id);
        const userLikes = await this.likeRepo.find({
            where: {
                userId,
                postId: In(postIds)
            }
        });

        const likedPostIds = new Set(userLikes.map(l => l.postId));
        posts.forEach(p => {
            (p as any).isLikedByMe = likedPostIds.has(p.id);
        });
    }
}
