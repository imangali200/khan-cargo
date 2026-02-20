import { ApiProperty } from "@nestjs/swagger";
import { BaseCustomEntity } from "src/core/base/entity/base.entity";
import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { TrackingStatus } from "../enums/tracking-status.enum";
import { StatusSource } from "../enums/status-source.enum";
import { TrackingItemEntity } from "./tracking-item.entity";
import { UserEntity } from "./user.entity";
import { ImportLogEntity } from "./import-log.entity";

@Entity('status_history')
export class StatusHistoryEntity extends BaseCustomEntity {
    @Column()
    @Index()
    trackingItemId: number;

    @ManyToOne(() => TrackingItemEntity, (ti) => ti.statusHistory)
    @JoinColumn({ name: 'trackingItemId' })
    trackingItem: TrackingItemEntity;

    @Column({ type: 'enum', enum: TrackingStatus, nullable: true })
    @ApiProperty({ enum: TrackingStatus, required: false })
    previousStatus?: TrackingStatus;

    @Column({ type: 'enum', enum: TrackingStatus })
    @ApiProperty({ enum: TrackingStatus })
    newStatus: TrackingStatus;

    @Column()
    changedByUserId: number;

    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: 'changedByUserId' })
    changedBy: UserEntity;

    @Column({ type: 'enum', enum: StatusSource })
    @ApiProperty({ enum: StatusSource })
    source: StatusSource;

    @Column({ nullable: true })
    importLogId?: number;

    @ManyToOne(() => ImportLogEntity, { nullable: true })
    @JoinColumn({ name: 'importLogId' })
    importLog?: ImportLogEntity;

    @Column('text', { nullable: true })
    @ApiProperty({ required: false })
    note?: string;
}
