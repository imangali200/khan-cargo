import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { UserRoles } from "src/core/db/enums/user_roles";

export class UpdateUserDto {
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
    @ApiProperty({ example: '87087563192', required: false })
    phoneNumber?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: 'Khan-123', required: false })
    userCode?: string;

    @IsEnum(UserRoles)
    @IsOptional()
    @ApiProperty({ example: UserRoles.USER, enum: UserRoles, required: false })
    role?: UserRoles;

    @IsNumber()
    @IsOptional()
    @ApiProperty({ example: 1, required: false })
    branchId?: number;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: 'user@example.com', required: false })
    email?: string;
}