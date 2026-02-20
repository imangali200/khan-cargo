import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { TrackingStatus } from "src/core/db/enums/tracking-status.enum";

export class TrackingFilterDto {
    @IsString()
    @IsOptional()
    @ApiProperty({ required: false, example: 'KH-001' })
    trackingCode?: string;

    @IsEnum(TrackingStatus)
    @IsOptional()
    @ApiProperty({ required: false, enum: TrackingStatus })
    status?: TrackingStatus;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false, example: '87051112233' })
    clientPhone?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false, example: 'Асет' })
    clientName?: string;

    @IsOptional()
    @ApiProperty({ required: false, example: 1 })
    page?: number;

    @IsOptional()
    @ApiProperty({ required: false, example: 20 })
    limit?: number;
}
