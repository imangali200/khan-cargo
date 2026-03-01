import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class UpdateTrackDto {
    @IsString()
    @ApiProperty({ example: 'KH-20260219-001' })
    @IsOptional()
    trackingCode?: string;

    @IsString()
    @ApiProperty({ example: 'Товар из Урумчи' })
    @IsOptional()
    description?: string;
}