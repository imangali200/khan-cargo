import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";
import { BaseCustomEntity } from "src/core/base/entity/base.entity";
import { Column, DeleteDateColumn, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { UserEntity } from "./user.entity";
import { BranchEntity } from "./branch.entity";

@Entity('post')
export class PostEntity extends BaseCustomEntity {
    @Column()
    @Index()
    authorId: number;

    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: 'authorId' })
    author: UserEntity;

    @Column('text')
    @ApiProperty({ example: 'Новая партия товаров прибыла!' })
    @IsString()
    content: string;

    @Column({ length: 500, nullable: true })
    @ApiProperty({ required: false })
    imageUrl?: string;

    @Column({ length: 255, nullable: true })
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    imagePublicId?: string;

    @Column({ length: 500, nullable: true })
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    externalLink?: string;

    @Column('decimal', { precision: 12, scale: 2, nullable: true })
    @ApiProperty({ required: false, example: 2000 })
    @IsNumber()
    @IsOptional()
    price?: number;

    @Column({ default: 0 })
    @ApiProperty({ example: 0 })
    likesCount: number;

    @Column({ default: 0 })
    @ApiProperty({ example: 0 })
    commentsCount: number;

    @DeleteDateColumn()
    deletedAt?: Date;
}
