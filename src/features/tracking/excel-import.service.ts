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
        // Parse Excel
        const workbook = XLSX.read(file.buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        // Get raw data (array of arrays)
        const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Extract tracking codes from the first column (A)
        // We skip empty rows and potentially skip the header row if it contains keywords
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
            const item = itemMap.get(code);

            if (!item) {
                errors.push({ code, reason: 'NOT_FOUND' });
                continue;
            }

            // Check if already at same or later status
            if (STATUS_ORDER[item.currentStatus] >= STATUS_ORDER[targetStatus]) {
                skipped.push({ code, reason: `ALREADY_AT_STATUS_${item.currentStatus}` });
                continue;
            }

            // Branch validation for ARRIVED_BRANCH
            // Note: If we need branchId from Excel in the future, we can add it back
            // focusing on a specific column (e.g. column B)
            if (targetStatus === TrackingStatus.ARRIVED_BRANCH) {
                // For now, if user only provides codes in A1, we skip branch matching
            }

            const prevStatus = item.currentStatus;
            item.currentStatus = targetStatus;

            // Sync dates based on status
            if (targetStatus === TrackingStatus.ARRIVED_CHINA_WAREHOUSE) item.chinaArrivalDate = new Date();
            if (targetStatus === TrackingStatus.ARRIVED_BRANCH) item.aicargoArrivalDate = new Date();
            if (targetStatus === TrackingStatus.PICKED_UP) item.deliveryDate = new Date();

            await this.trackingRepo.save(item);

            // Update master list (ImportedTrackEntity)
            let masterTrack = await this.importedTrackRepo.findOne({ where: { trackingCode: code } });
            if (!masterTrack) {
                masterTrack = this.importedTrackRepo.create({ trackingCode: code });
            }
            if (targetStatus === TrackingStatus.ARRIVED_CHINA_WAREHOUSE) masterTrack.chinaArrivalDate = new Date();
            if (targetStatus === TrackingStatus.ARRIVED_BRANCH) masterTrack.aicargoArrivalDate = new Date();
            if (targetStatus === TrackingStatus.PICKED_UP) masterTrack.deliveryDate = new Date();
            await this.importedTrackRepo.save(masterTrack);

            await this.statusHistoryRepo.save({
                trackingItemId: item.id,
                previousStatus: prevStatus,
                newStatus: targetStatus,
                changedByUserId: userId,
                source: StatusSource.EXCEL_IMPORT,
            });

            success.push(code);
        }

        // Final step: Handle codes NOT found in TrackingItemEntity but present in Excel
        // These should still be added to the master list (ImportedTrackEntity)
        const missingCodes = uniqueCodes.filter(c => !itemMap.has(c));
        for (const code of missingCodes) {
            let masterTrack = await this.importedTrackRepo.findOne({ where: { trackingCode: code } });
            if (!masterTrack) {
                masterTrack = this.importedTrackRepo.create({ trackingCode: code });
            }
            if (targetStatus === TrackingStatus.ARRIVED_CHINA_WAREHOUSE) masterTrack.chinaArrivalDate = new Date();
            if (targetStatus === TrackingStatus.ARRIVED_BRANCH) masterTrack.aicargoArrivalDate = new Date();
            if (targetStatus === TrackingStatus.PICKED_UP) masterTrack.deliveryDate = new Date();
            await this.importedTrackRepo.save(masterTrack);
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

    async getImportLogs(page = 1, limit = 20) {
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

    async findMasterItems(page = 1, limit = 20) {
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
            where: { trackingCode: In([trackingCode]) }, // Using exact match for now, can be ILIKE
        });
    }

    async updateMasterStatus(trackingCode: string, targetStatus: TrackingStatus, userId?: number) {
        let masterTrack = await this.importedTrackRepo.findOne({ where: { trackingCode } });
        if (!masterTrack) {
            masterTrack = this.importedTrackRepo.create({ trackingCode });
        }

        if (targetStatus === TrackingStatus.ARRIVED_CHINA_WAREHOUSE) masterTrack.chinaArrivalDate = new Date();
        if (targetStatus === TrackingStatus.ARRIVED_BRANCH) masterTrack.aicargoArrivalDate = new Date();
        if (targetStatus === TrackingStatus.PICKED_UP) masterTrack.deliveryDate = new Date();

        await this.importedTrackRepo.save(masterTrack);

        // Also update existing user items
        const userItems = await this.trackingRepo.find({ where: { trackingCode } });
        for (const item of userItems) {
            const prevStatus = item.currentStatus;
            item.currentStatus = targetStatus;
            if (targetStatus === TrackingStatus.ARRIVED_CHINA_WAREHOUSE) item.chinaArrivalDate = masterTrack.chinaArrivalDate;
            if (targetStatus === TrackingStatus.ARRIVED_BRANCH) item.aicargoArrivalDate = masterTrack.aicargoArrivalDate;
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
