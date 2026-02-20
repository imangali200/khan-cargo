import { ApiProperty } from "@nestjs/swagger";
import { BaseCustomEntity } from "src/core/base/entity/base.entity";
import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { UserEntity } from "./user.entity";

@Entity('audit_log')
export class AuditLogEntity extends BaseCustomEntity {
    @Column()
    @Index()
    userId: number;

    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: 'userId' })
    user: UserEntity;

    @Column({ length: 100 })
    @ApiProperty({ example: 'STATUS_UPDATE' })
    action: string;

    @Column({ length: 50 })
    @ApiProperty({ example: 'tracking_item' })
    @Index()
    entity: string;

    @Column({ nullable: true })
    entityId?: number;

    @Column('jsonb', { nullable: true })
    metadata?: any;
}
