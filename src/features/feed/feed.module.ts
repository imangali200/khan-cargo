import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PostEntity } from "src/core/db/entities/post.entity";
import { PostLikeEntity } from "src/core/db/entities/post-like.entity";
import { CommentEntity } from "src/core/db/entities/comment.entity";
import { UploadModule } from "../upload/upload.module";
import { FeedService } from "./feed.service";
import { FeedController } from "./feed.controller";

@Module({
    imports: [
        TypeOrmModule.forFeature([PostEntity, PostLikeEntity, CommentEntity]),
        UploadModule,
    ],
    controllers: [FeedController],
    providers: [FeedService],
    exports: [FeedService],
})
export class FeedModule { }
