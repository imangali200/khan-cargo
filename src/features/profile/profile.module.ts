import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserEntity } from "src/core/db/entities/user.entity";
import { PostEntity } from "src/core/db/entities/post.entity";
import { PostLikeEntity } from "src/core/db/entities/post-like.entity";
import { TrackingItemEntity } from "src/core/db/entities/tracking-item.entity";
import { BranchEntity } from "src/core/db/entities/branch.entity";
import { ProfileService } from "./profile.service";
import { ProfileController } from "./profile.controller";

@Module({
    imports: [TypeOrmModule.forFeature([UserEntity, PostEntity, PostLikeEntity, TrackingItemEntity, BranchEntity])],
    controllers: [ProfileController],
    providers: [ProfileService],
})
export class ProfileModule { }
