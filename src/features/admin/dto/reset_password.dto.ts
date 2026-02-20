import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class ResetPasswordDto{
    @IsString()
    @ApiProperty()
    @MinLength(4)
    newPassword:string
}