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
    @ApiProperty({ example: '87087563192' })
    phoneNumber: string;

    @IsString()
    @ApiProperty({ example: 'Khan-123' })
    userCode: string;

    @IsString()
    @ApiProperty({ example: '123456' })
    password: string;

    @IsEnum(UserRoles)
    @ApiProperty({ example: UserRoles.USER, enum: UserRoles })
    role: UserRoles;

    @IsNumber()
    @IsOptional()
    @ApiProperty({ example: 1, required: false })
    branchId?: number;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: '@username', required: false })
    telegramUsername?: string;
}