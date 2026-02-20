import { ApiProperty } from "@nestjs/swagger";
import { BaseEntity, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export abstract class BaseCustomEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    @ApiProperty()
    id: number;

    @CreateDateColumn({ type: 'timestamptz' })
    @ApiProperty()
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    @ApiProperty()
    updatedAt: Date;
}