import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TrackingItemEntity } from "src/core/db/entities/tracking-item.entity";
import { StatusHistoryEntity } from "src/core/db/entities/status-history.entity";
import { ImportLogEntity } from "src/core/db/entities/import-log.entity";
import { ImportedTrackEntity } from "src/core/db/entities/imported-track.entity";
import { TrackingService } from "./tracking.service";
import { ExcelImportService } from "./excel-import.service";
import { TrackingController } from "./tracking.controller";
import { TelegramModule } from "../telegram/telegram.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([TrackingItemEntity, StatusHistoryEntity, ImportLogEntity, ImportedTrackEntity]),
        TelegramModule
    ],
    controllers: [TrackingController],
    providers: [TrackingService, ExcelImportService],
    exports: [TrackingService],
})
export class TrackingModule { }
