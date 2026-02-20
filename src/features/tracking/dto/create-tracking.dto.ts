import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class CreateTrackingDto {
    @IsString()
    @ApiProperty({ example: 'KH-20260219-001' })
    trackingCode: string;

    @IsString()
    @ApiProperty({ example: 'Товар из Урумчи' })
    description: string;
}
