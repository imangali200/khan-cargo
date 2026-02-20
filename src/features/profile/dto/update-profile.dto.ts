import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNumber, IsOptional, IsString } from "class-validator";

export class UpdateProfileDto {
    @IsString()
    @IsOptional()
    @ApiProperty({ example: 'Imangali', required: false })
    name?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: 'Zhaksylyk', required: false })
    lastName?: string;

    @IsEmail()
    @IsOptional()
    @ApiProperty({ example: 'user@example.com', required: false })
    email?: string;

    @IsNumber()
    @IsOptional()
    @ApiProperty({ example: 1, required: false })
    branchId?: number;
}
