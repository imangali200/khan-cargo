import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";

export class UpdateBranchDto {
    @IsString()
    @IsOptional()
    @ApiProperty({ example: 'Almaty-Central', required: false })
    name?: string;

    @IsBoolean()
    @IsOptional()
    @ApiProperty({ example: true, required: false })
    isActive?: boolean;

    @IsNumber()
    @IsOptional()
    @ApiProperty({ example: 1, required: false })
    adminId?: number;

    @IsNumber()
    @IsOptional()
    @ApiProperty({ example: 123, required: false })
    telegramThreadId?: number;
}
