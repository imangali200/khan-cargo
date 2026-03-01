import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, } from "class-validator";

export class SettingsAdminDto {
    

    @IsNumber()
    @ApiProperty()
    @IsOptional()
    pricePerKg?: number

    @IsNumber()
    @ApiProperty()
    @IsOptional()
    courseUSD?: number
}