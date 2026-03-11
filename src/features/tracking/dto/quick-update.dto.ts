import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";
import { Type, Expose } from "class-transformer";

export class QuickUpdateDto {
    @Expose()
    @IsString()
    @ApiProperty({ example: 'KH-20260219-001' })
    trackingCode: string;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    @ApiProperty({ example: 2.5, required: false })
    weight?: number;
}
