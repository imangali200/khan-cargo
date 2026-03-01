import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Not, Repository } from "typeorm";
import { UserEntity } from "src/core/db/entities/user.entity";
import { PostEntity } from "src/core/db/entities/post.entity";
import { PostLikeEntity } from "src/core/db/entities/post-like.entity";
import { TrackingItemEntity } from "src/core/db/entities/tracking-item.entity";
import { BranchEntity } from "src/core/db/entities/branch.entity";
import { UpdateProfileDto } from "./dto/update-profile.dto";

@Injectable()
export class ProfileService {
    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        @InjectRepository(PostEntity)
        private readonly postRepo: Repository<PostEntity>,
        @InjectRepository(PostLikeEntity)
        private readonly likeRepo: Repository<PostLikeEntity>,
        @InjectRepository(TrackingItemEntity)
        private readonly trackingRepo: Repository<TrackingItemEntity>,
        @InjectRepository(BranchEntity)
        private readonly branchRepo: Repository<BranchEntity>,
    ) { }

    async getProfile(userId: number) {
        const user = await this.userRepo.findOne({
            where: { id: userId },
            relations: ['branch'],
        });
        if (!user) throw new NotFoundException('Пользователь не найден');

        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    async updateProfile(userId: number, dto: UpdateProfileDto) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('Пользователь не найден');

        if (dto.branchId) {
            const branch = await this.branchRepo.findOne({ where: { id: dto.branchId } });
            if (!branch) throw new NotFoundException('Склад не найден');
        }

        const merged = this.userRepo.merge(user, dto);
        const saved = await this.userRepo.save(merged);
        const { password, ...result } = saved;
        return result;
    }

    async getMyPosts(userId: number, page: number, limit: number) {
        const [data, total] = await this.postRepo.findAndCount({
            where: { authorId: userId },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { data, meta: { page, limit, total, lastPage: Math.ceil(total / limit) } };
    }

    async getLikedPosts(userId: number, page: number, limit: number) {
        const qb = this.postRepo.createQueryBuilder('post')
            .innerJoin('post_like', 'like', 'like.postId = post.id AND like.userId = :userId', { userId })
            .leftJoinAndSelect('post.author', 'author')
            .orderBy('like.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        const [data, total] = await qb.getManyAndCount();
        return { data, meta: { page, limit, total, lastPage: Math.ceil(total / limit) } };
    }

    async getMyTrackingItems(userId: number, page: number, limit: number) {
        const [data, total] = await this.trackingRepo.findAndCount({
            where: { createdByUserId: userId },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { data, meta: { page, limit, total, lastPage: Math.ceil(total / limit) } };
    }
    async getMyArchiveTracking(userId: number, page: number, limit: number) {
        const [data, total] = await this.trackingRepo.findAndCount({
            where: {
                createdByUserId: userId,
                deletedAt: Not(IsNull())
            },
            withDeleted: true,
            order: { deletedAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { data, meta: { page, limit, total, lastPage: Math.ceil(total / limit) } };
    }
}
