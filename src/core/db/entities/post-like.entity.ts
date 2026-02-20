import { BaseCustomEntity } from "src/core/base/entity/base.entity";
import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from "typeorm";
import { PostEntity } from "./post.entity";
import { UserEntity } from "./user.entity";

@Entity('post_like')
@Unique(['postId', 'userId'])
export class PostLikeEntity extends BaseCustomEntity {
    @Column()
    @Index()
    postId: number;

    @ManyToOne(() => PostEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'postId' })
    post: PostEntity;

    @Column()
    @Index()
    userId: number;

    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: 'userId' })
    user: UserEntity;
}
