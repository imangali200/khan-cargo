import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class UpdateProfileDto {
    @IsString()
    @IsOptional()
    @ApiProperty({ example: 'Imangali', required: false })
    name?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: 'Zhaksylyk', required: false })
    lastName?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: '123456789', required: false, description: 'Telegram chat ID for direct messages' })
    telegramChatId?: string;

    @IsNumber()
    @IsOptional()
    @ApiProperty({ example: 1, required: false })
    branchId?: number;
}
