import { ApiProperty } from "@nestjs/swagger";
import { BaseCustomEntity } from "src/core/base/entity/base.entity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { TrackingStatus } from "../enums/tracking-status.enum";
import { UserEntity } from "./user.entity";

@Entity('import_log')
export class ImportLogEntity extends BaseCustomEntity {
    @Column({ length: 255 })
    @ApiProperty({ example: 'import_2026-02-19.xlsx' })
    fileName: string;

    @Column()
    uploadedByUserId: number;

    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: 'uploadedByUserId' })
    uploadedBy: UserEntity;

    @Column({ type: 'enum', enum: TrackingStatus })
    @ApiProperty({ enum: TrackingStatus })
    targetStatus: TrackingStatus;

    @Column()
    @ApiProperty({ example: 100 })
    totalRows: number;

    @Column()
    @ApiProperty({ example: 90 })
    successCount: number;

    @Column()
    @ApiProperty({ example: 5 })
    errorCount: number;

    @Column()
    @ApiProperty({ example: 5 })
    skippedCount: number;

    @Column('jsonb', { nullable: true })
    @ApiProperty({ required: false })
    errorDetails?: any;
}
