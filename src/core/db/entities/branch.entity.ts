import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";
import { BaseCustomEntity } from "src/core/base/entity/base.entity";
import { Column, DeleteDateColumn, Entity, OneToOne, JoinColumn, OneToMany, UpdateDateColumn } from "typeorm";
import { UserEntity } from "./user.entity";

@Entity('branch')
export class BranchEntity extends BaseCustomEntity {
    @Column({ length: 100, unique: true })
    @ApiProperty({ example: 'Taraz' })
    @IsString()
    name: string;

    @Column({ default: true })
    @ApiProperty({ example: true })
    @IsBoolean()
    isActive: boolean;

    @Column({ nullable: true })
    @ApiProperty({ example: 1, required: false })
    adminId?: number;

    @OneToOne(() => UserEntity, { nullable: true })
    @JoinColumn({ name: 'adminId' })
    admin?: UserEntity;

    @Column({ nullable: true })
    @ApiProperty({ example: 123, required: false })
    @IsNumber()
    @IsOptional()
    telegramThreadId?: number;

    @DeleteDateColumn()
    deletedAt?: Date;
}
