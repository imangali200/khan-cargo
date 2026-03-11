import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { UserRoles } from "src/core/db/enums/user_roles";

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
    @ApiProperty({ example: '123456789', required: false, description: 'Telegram chat ID for direct messages' })
    telegramChatId?: string;

    @IsEnum(UserRoles)
    @IsOptional()
    @ApiProperty({ enum: UserRoles, example: UserRoles.USER, required: false })
    role?: UserRoles;
}