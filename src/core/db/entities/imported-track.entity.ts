import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { BaseCustomEntity } from "src/core/base/entity/base.entity";
import { Column, Entity, Index } from "typeorm";

@Entity('imported_track')
export class ImportedTrackEntity extends BaseCustomEntity {
    @Column({ length: 100, unique: true })
    @ApiProperty({ example: 'KH-20260219-001' })
    @IsString()
    @Index()
    trackingCode: string;

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
}
