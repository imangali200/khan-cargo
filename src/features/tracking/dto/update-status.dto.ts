import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { TrackingStatus } from "src/core/db/enums/tracking-status.enum";

export class UpdateStatusDto {
    @IsEnum(TrackingStatus)
    @ApiProperty({ enum: TrackingStatus, example: TrackingStatus.PICKED_UP })
    status: TrackingStatus;

    @IsNumber()
    @IsOptional()
    @ApiProperty({ example: 2.5, required: false })
    weight?: number;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: 'Позвонили клиенту', required: false })
    note?: string;
}
