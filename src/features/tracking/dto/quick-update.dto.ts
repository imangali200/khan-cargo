import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { TrackingStatus } from "src/core/db/enums/tracking-status.enum";

export class QuickUpdateDto {
    @IsString()
    @ApiProperty({ example: 'KH-20260219-001' })
    trackingCode: string;

    @IsEnum(TrackingStatus)
    @IsOptional()
    @ApiProperty({ enum: TrackingStatus, required: false })
    status?: TrackingStatus;

    @IsNumber()
    @IsOptional()
    @ApiProperty({ example: 2.5, required: false })
    weight?: number;
}
