import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";
import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity('settings')
export class SettingsEntity {
    @PrimaryColumn({ length: 50 })
    @ApiProperty({ example: 'PRICE_PER_KG' })
    @IsString()
    key: string;

    @Column({ length: 255 })
    @ApiProperty({ example: '4' })
    @IsString()
    value: string;

    @Column({ length: 255, nullable: true })
    @ApiProperty({ example: 'Price per kg in USD', required: false })
    description?: string;
}
