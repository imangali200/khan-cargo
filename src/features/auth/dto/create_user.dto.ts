import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class CreateUserDto {
    @IsString()
    @ApiProperty({ example: 'Imangali' })
    name: string;

    @IsString()
    @ApiProperty({ example: 'Zhaksylyk' })
    lastName: string;

    @IsString()
    @ApiProperty({ example: '87000010101' })
    phoneNumber: string;

    @IsString()
    @ApiProperty({ example: 'Khan-123' })
    userCode: string;

    @IsNumber()
    @IsOptional()
    @ApiProperty({ example: 1, required: false })
    branchId?: number;

    @IsString()
    @ApiProperty({ example: '123456' })
    password: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: '@username', required: false, description: 'Telegram nickname starting with @' })
    telegramUsername?: string;
}