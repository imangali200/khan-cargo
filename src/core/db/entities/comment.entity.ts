import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";
import { BaseCustomEntity } from "src/core/base/entity/base.entity";
import { Column, DeleteDateColumn, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { PostEntity } from "./post.entity";
import { UserEntity } from "./user.entity";

@Entity('comment')
export class CommentEntity extends BaseCustomEntity {
    @Column()
    @Index()
    postId: number;

    @ManyToOne(() => PostEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'postId' })
    post: PostEntity;

    @Column()
    @Index()
    authorId: number;

    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: 'authorId' })
    author: UserEntity;

    @Column('text')
    @ApiProperty({ example: 'Отлично, спасибо за информацию!' })
    @IsString()
    content: string;

    @Column({ default: false })
    isHidden: boolean;

    @DeleteDateColumn()
    deletedAt?: Date;
}
