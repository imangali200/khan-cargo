import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TrackingItemEntity } from "src/core/db/entities/tracking-item.entity";
import { UserEntity } from "src/core/db/entities/user.entity";
import { BranchEntity } from "src/core/db/entities/branch.entity";
import { SettingsEntity } from "src/core/db/entities/settings.entity";
import { TelegramService } from "./telegram.service";

@Module({
    imports: [TypeOrmModule.forFeature([TrackingItemEntity, UserEntity, BranchEntity, SettingsEntity])],
    providers: [TelegramService],
    exports: [TelegramService],
})
export class TelegramModule { }
