import { ApiProperty } from "@nestjs/swagger";
import { Exclude } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { BaseCustomEntity } from "src/core/base/entity/base.entity";
import { Column, DeleteDateColumn, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { UserRoles } from "../enums/user_roles";
import { BranchEntity } from "./branch.entity";
import { TrackingItemEntity } from "./tracking-item.entity";
import { OneToMany } from "typeorm";

@Entity('user')
export class UserEntity extends BaseCustomEntity {
    @Column({ length: 100, nullable: true })
    @ApiProperty({ example: 'Imangali', required: false })
    @IsString()
    @IsOptional()
    name: string;

    @Column({ length: 100, nullable: true })
    @ApiProperty({ example: 'Zhaksylyk', required: false })
    @IsString()
    @IsOptional()
    lastName: string;

    @Column({ length: 255, nullable: true, unique: true })
    @ApiProperty({ example: 'user@example.com', required: false })
    @IsString()
    @IsOptional()
    email?: string;

    @Column({ length: 20, unique: true, nullable: true })
    @ApiProperty({ example: '87087563192', required: false })
    @IsString()
    @IsOptional()
    phoneNumber: string;

    @Column({ length: 50, unique: true, nullable: true })
    @ApiProperty({ example: 'Khan-123', required: false })
    @IsString()
    @IsOptional()
    userCode: string;

    @Column()
    @Exclude({ toPlainOnly: true })
    @IsString()
    password: string;

    @Column({ type: 'enum', enum: UserRoles, default: UserRoles.SUPERADMIN })
    @ApiProperty({ enum: UserRoles, example: UserRoles.ADMIN })
    @IsEnum(UserRoles)
    role: UserRoles;

    @Column({ nullable: true })
    @ApiProperty({ example: 1 })
    @IsNumber()
    @Index()
    branchId: number;

    @ManyToOne(() => BranchEntity, { eager: false })
    @JoinColumn({ name: 'branchId' })
    branch: BranchEntity;

    @Column({ default: false })
    @ApiProperty({ example: false })
    isActive: boolean;

    @DeleteDateColumn()
    deletedAt?: Date;

    @OneToMany(() => TrackingItemEntity, (ti) => ti.createdBy)
    trackingItems: TrackingItemEntity[];
}