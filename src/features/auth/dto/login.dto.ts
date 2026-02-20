import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class LoginDto {
    @IsString()
    @ApiProperty({ example: '87000010101' })
    phoneNumber: string

    @IsString()
    @ApiProperty({ example: '123456' })
    password: string
}