import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { ImportedTrackEntity } from "src/core/db/entities/imported-track.entity";
import * as XLSX from 'xlsx';
import { TrackingItemEntity } from "src/core/db/entities/tracking-item.entity";
import { StatusHistoryEntity } from "src/core/db/entities/status-history.entity";
import { ImportLogEntity } from "src/core/db/entities/import-log.entity";
import { STATUS_ORDER, TrackingStatus } from "src/core/db/enums/tracking-status.enum";
import { StatusSource } from "src/core/db/enums/status-source.enum";

interface ImportRow {
    trackingCode: string;
    branchId?: number;
}

interface ImportResult {
    importLogId: number;
    totalRows: number;
    successCount: number;
    errorCount: number;
    skippedCount: number;
    success: string[];
    errors: { code: string; reason: string }[];
    skipped: { code: string; reason: string }[];
}

@Injectable()
export class ExcelImportService {
    private readonly logger = new Logger(ExcelImportService.name);

    constructor(
        @InjectRepository(TrackingItemEntity)
        private readonly trackingRepo: Repository<TrackingItemEntity>,
        @InjectRepository(StatusHistoryEntity)
        private readonly statusHistoryRepo: Repository<StatusHistoryEntity>,
        @InjectRepository(ImportLogEntity)
        private readonly importLogRepo: Repository<ImportLogEntity>,
        @InjectRepository(ImportedTrackEntity)
        private readonly importedTrackRepo: Repository<ImportedTrackEntity>,
    ) { }

    async processImport(
        file: Express.Multer.File,
        targetStatus: TrackingStatus,
        userId: number,
    ): Promise<ImportResult> {
        const workbook = XLSX.read(file.buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        const uniqueCodes = [...new Set(
            rawRows
                .map(row => (row && row.length > 0 ? String(row[0]).trim() : ''))
                .filter(c => {
                    const low = c.toLowerCase();
                    return c.length > 0 &&
                        low !== 'trackingcode' &&
                        low !== 'tracking code' &&
                        low !== 'номер' &&
                        low !== 'трек';
                })
        )];

        // Fetch all matching items in one query (avoid N+1)
        const items = uniqueCodes.length > 0
            ? await this.trackingRepo.find({ where: { trackingCode: In(uniqueCodes) } })
            : [];
        const itemMap = new Map<string, TrackingItemEntity>(items.map(i => [i.trackingCode, i]));

        const success: string[] = [];
        const errors: { code: string; reason: string }[] = [];
        const skipped: { code: string; reason: string }[] = [];

        for (const code of uniqueCodes) {
            try {
                // 1. Update/Create Master List (ImportedTrackEntity)
                let masterTrack = await this.importedTrackRepo.findOne({ where: { trackingCode: code } });
                if (!masterTrack) {
                    masterTrack = this.importedTrackRepo.create({ trackingCode: code });
                }

                // Sync dates based on target status for master track
                if (targetStatus === TrackingStatus.ARRIVED_CHINA_WAREHOUSE) masterTrack.chinaArrivalDate = new Date();
                if (targetStatus === TrackingStatus.ARRIVED_BRANCH) masterTrack.khanCargoArrivalDate = new Date();
                if (targetStatus === TrackingStatus.PICKED_UP) masterTrack.deliveryDate = new Date();

                await this.importedTrackRepo.save(masterTrack);

                // 2. Update existing Registered Item (TrackingItemEntity) if found
                const item = itemMap.get(code);
                if (item) {
                    // Check if already at same or later status
                    if (STATUS_ORDER[item.currentStatus] >= STATUS_ORDER[targetStatus]) {
                        skipped.push({ code, reason: `ALREADY_AT_STATUS_${item.currentStatus}` });
                        // We still count it as master-success, but skip the item update
                    } else {
                        const prevStatus = item.currentStatus;
                        item.currentStatus = targetStatus;

                        // Sync dates from master track
                        if (targetStatus === TrackingStatus.ARRIVED_CHINA_WAREHOUSE) item.chinaArrivalDate = masterTrack.chinaArrivalDate;
                        if (targetStatus === TrackingStatus.ARRIVED_BRANCH) item.khanCargoArrivalDate = masterTrack.khanCargoArrivalDate;
                        if (targetStatus === TrackingStatus.PICKED_UP) item.deliveryDate = masterTrack.deliveryDate;

                        await this.trackingRepo.save(item);

                        await this.statusHistoryRepo.save({
                            trackingItemId: item.id,
                            previousStatus: prevStatus,
                            newStatus: targetStatus,
                            changedByUserId: userId,
                            source: StatusSource.EXCEL_IMPORT,
                        });
                    }
                }

                success.push(code);
            } catch (err) {
                this.logger.error(`Error processing code ${code}: ${err.message}`);
                errors.push({ code, reason: 'INTERNAL_ERROR' });
            }
        }

        // Save import log
        const log = await this.importLogRepo.save({
            fileName: file.originalname,
            uploadedByUserId: userId,
            targetStatus,
            totalRows: uniqueCodes.length,
            successCount: success.length,
            errorCount: errors.length,
            skippedCount: skipped.length,
            errorDetails: { errors, skipped },
        });

        this.logger.log(`Import complete: ${success.length} success, ${errors.length} errors, ${skipped.length} skipped`);

        return {
            importLogId: log.id,
            totalRows: uniqueCodes.length,
            successCount: success.length,
            errorCount: errors.length,
            skippedCount: skipped.length,
            success,
            errors,
            skipped,
        };
    }

    async getImportLogs(page: number, limit: number) {
        const [data, total] = await this.importLogRepo.findAndCount({
            relations: ['uploadedBy'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return {
            data,
            meta: { page, limit, total, lastPage: Math.ceil(total / limit) },
        };
    }

    async findMasterItems(page:number, limit:number) {
        const [data, total] = await this.importedTrackRepo.findAndCount({
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return {
            data,
            meta: { page, limit, total, lastPage: Math.ceil(total / limit) },
        };
    }

    async searchMasterItems(trackingCode: string) {
        return this.importedTrackRepo.find({
            where: { trackingCode: In([trackingCode]) },
        });
    }

    async updateMasterStatus(trackingCode: string, targetStatus: TrackingStatus, userId?: number) {
        let masterTrack = await this.importedTrackRepo.findOne({ where: { trackingCode } });
        if (!masterTrack) {
            masterTrack = this.importedTrackRepo.create({ trackingCode });
        }

        if (targetStatus === TrackingStatus.ARRIVED_CHINA_WAREHOUSE) masterTrack.chinaArrivalDate = new Date();
        if (targetStatus === TrackingStatus.ARRIVED_BRANCH) masterTrack.khanCargoArrivalDate = new Date();
        if (targetStatus === TrackingStatus.PICKED_UP) masterTrack.deliveryDate = new Date();

        await this.importedTrackRepo.save(masterTrack);

        const userItems = await this.trackingRepo.find({ where: { trackingCode } });
        for (const item of userItems) {
            const prevStatus = item.currentStatus;
            item.currentStatus = targetStatus;
            if (targetStatus === TrackingStatus.ARRIVED_CHINA_WAREHOUSE) item.chinaArrivalDate = masterTrack.chinaArrivalDate;
            if (targetStatus === TrackingStatus.ARRIVED_BRANCH) item.khanCargoArrivalDate = masterTrack.khanCargoArrivalDate;
            if (targetStatus === TrackingStatus.PICKED_UP) item.deliveryDate = masterTrack.deliveryDate;
            await this.trackingRepo.save(item);

            if (userId) {
                await this.statusHistoryRepo.save({
                    trackingItemId: item.id,
                    previousStatus: prevStatus,
                    newStatus: targetStatus,
                    changedByUserId: userId,
                    source: StatusSource.MANUAL,
                });
            }
        }

        return { message: 'Master status updated and synced' };
    }
}
