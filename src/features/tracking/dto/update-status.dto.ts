import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { TrackingStatus } from "src/core/db/enums/tracking-status.enum";

export class UpdateStatusDto {
    @IsEnum(TrackingStatus)
    @ApiProperty({ enum: TrackingStatus, example: TrackingStatus.READY_FOR_PICKUP })
    status: TrackingStatus;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: 'Позвонили клиенту', required: false })
    note?: string;
}
