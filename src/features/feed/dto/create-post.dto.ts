import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class CreatePostDto {
    @IsString()
    @ApiProperty({ example: 'Новая партия товаров прибыла!' })
    content: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false, example: 'https://storage.example.com/image.jpg' })
    imageUrl?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    imagePublicId?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false, example: 'https://example.com/product' })
    externalLink?: string;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    @ApiProperty({ required: false, example: 2000 })
    price?: number;
}
