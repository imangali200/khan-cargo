import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { BaseCustomEntity } from "src/core/base/entity/base.entity";
import { Column, DeleteDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { TrackingStatus } from "../enums/tracking-status.enum";
import { BranchEntity } from "./branch.entity";
import { UserEntity } from "./user.entity";
import { StatusHistoryEntity } from "./status-history.entity";

@Entity('tracking_item')
export class TrackingItemEntity extends BaseCustomEntity {
    @Column({ length: 100, unique: true })
    @ApiProperty({ example: 'KH-20260219-001' })
    @IsString()
    @Index()
    trackingCode: string;

    @Column('text')
    @ApiProperty({ example: 'Товар из Урумчи' })
    @IsString()
    description: string;

    @Column({ nullable: true })
    @ApiProperty({ example: 1, required: false })
    @IsNumber()
    @IsOptional()
    @Index()
    branchId: number;

    @ManyToOne(() => BranchEntity)
    @JoinColumn({ name: 'branchId' })
    branch: BranchEntity;

    @Column()
    @ApiProperty({ example: 1 })
    @IsNumber()
    createdByUserId: number;

    @ManyToOne(() => UserEntity, (u) => u.trackingItems)
    @JoinColumn({ name: 'createdByUserId' })
    createdBy: UserEntity;

    @Column({ type: 'enum', enum: TrackingStatus, default: TrackingStatus.REGISTERED })
    @ApiProperty({ enum: TrackingStatus, example: TrackingStatus.REGISTERED })
    @IsEnum(TrackingStatus)
    @Index()
    currentStatus: TrackingStatus;

    @Column('decimal', { precision: 10, scale: 2, nullable: true })
    @ApiProperty({ example: 2.5, required: false })
    @IsOptional()
    weight?: number;

    @Column('decimal', { precision: 12, scale: 2, nullable: true })
    @ApiProperty({ example: 15000, required: false })
    @IsOptional()
    declaredValue?: number;

    @Column({ type: 'timestamptz', nullable: true })
    @ApiProperty({ required: false })
    @IsOptional()
    chinaArrivalDate?: Date;

    @Column({ type: 'timestamptz', nullable: true })
    @ApiProperty({ required: false })
    @IsOptional()
    khanCargoArrivalDate?: Date;

    @Column({ type: 'timestamptz', nullable: true })
    @ApiProperty({ required: false })
    @IsOptional()
    deliveryDate?: Date;

    @Column({ default: false })
    @ApiProperty({ example: false })
    isTelegramNotified: boolean;

    @OneToMany(() => StatusHistoryEntity, (sh) => sh.trackingItem)
    statusHistory: StatusHistoryEntity[];

    @DeleteDateColumn()
    deletedAt?: Date;
}
