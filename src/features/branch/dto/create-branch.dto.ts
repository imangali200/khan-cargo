import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class CreateBranchDto {
    @IsString()
    @ApiProperty({ example: 'Almaty-Central' })
    name: string;


    @IsNumber()
    @IsOptional()
    @ApiProperty({ example: 1, required: false })
    adminId?: number;

    @IsNumber()
    @IsOptional()
    @ApiProperty({ example: 123, required: false })
    telegramThreadId?: number;
}
