import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class CreateCommentDto {
    @IsString()
    @ApiProperty({ example: 'Отлично, спасибо за информацию!' })
    content: string;
}
