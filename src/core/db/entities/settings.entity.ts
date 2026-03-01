import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";
import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity('settings')
export class SettingsEntity {
    @PrimaryGeneratedColumn()
    id: number

    @PrimaryColumn()
    @ApiProperty({ example: 'PRICE_PER_KG' })
    @IsNumber()
    pricePerKg: number;

    @Column()
    @ApiProperty({ example: 'Price per kg in USD', required: false })
    courseUSD?: number;
}
