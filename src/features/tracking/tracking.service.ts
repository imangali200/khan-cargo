import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TrackingItemEntity } from "src/core/db/entities/tracking-item.entity";
import { StatusHistoryEntity } from "src/core/db/entities/status-history.entity";
import { ImportedTrackEntity } from "src/core/db/entities/imported-track.entity";
import { ADMIN_ALLOWED_STATUSES, STATUS_ORDER, TrackingStatus } from "src/core/db/enums/tracking-status.enum";
import { StatusSource } from "src/core/db/enums/status-source.enum";
import { UserRoles } from "src/core/db/enums/user_roles";
import { CreateTrackingDto } from "./dto/create-tracking.dto";
import { UpdateStatusDto } from "./dto/update-status.dto";
import { TrackingFilterDto } from "./dto/tracking-filter.dto";
import { QuickUpdateDto } from "./dto/quick-update.dto";
import { TelegramService } from "../telegram/telegram.service";

@Injectable()
export class TrackingService {
    constructor(
        @InjectRepository(TrackingItemEntity)
        private readonly trackingRepo: Repository<TrackingItemEntity>,
        @InjectRepository(StatusHistoryEntity)
        private readonly statusHistoryRepo: Repository<StatusHistoryEntity>,
        @InjectRepository(ImportedTrackEntity)
        private readonly importedTrackRepo: Repository<ImportedTrackEntity>,
        private readonly telegramService: TelegramService,
    ) { }

    async create(dto: CreateTrackingDto, user: any): Promise<TrackingItemEntity> {
        // Automatically take branchId from user profile
        const userBranchId = user.branchId;

        const exists = await this.trackingRepo.findOne({ where: { trackingCode: dto.trackingCode } });
        if (exists) throw new ConflictException('Tracking code already exists');

        // Check master list for existing data
        const masterTrack = await this.importedTrackRepo.findOne({ where: { trackingCode: dto.trackingCode } });

        let initialStatus = TrackingStatus.REGISTERED;
        if (masterTrack) {
            if (masterTrack.deliveryDate) initialStatus = TrackingStatus.PICKED_UP;
            else if (masterTrack.aicargoArrivalDate) initialStatus = TrackingStatus.ARRIVED_BRANCH;
            else if (masterTrack.chinaArrivalDate) initialStatus = TrackingStatus.ARRIVED_CHINA_WAREHOUSE;
        }

        const item = this.trackingRepo.create({
            ...dto,
            branchId: userBranchId,
            createdByUserId: user.sub,
            currentStatus: initialStatus,
            chinaArrivalDate: masterTrack?.chinaArrivalDate,
            aicargoArrivalDate: masterTrack?.aicargoArrivalDate,
            deliveryDate: masterTrack?.deliveryDate,
        });
        const saved = await this.trackingRepo.save(item);

        await this.statusHistoryRepo.save({
            trackingItemId: saved.id,
            previousStatus: undefined,
            newStatus: initialStatus,
            changedByUserId: user.sub,
            source: StatusSource.MANUAL,
        });

        return saved;
    }

    async findAll(filter: TrackingFilterDto, branchId?: number) {
        const page = filter.page ? Number(filter.page) : 1;
        const limit = filter.limit ? Number(filter.limit) : 20;

        const qb = this.trackingRepo.createQueryBuilder('item')
            .leftJoinAndSelect('item.branch', 'branch')
            .leftJoinAndSelect('item.createdBy', 'createdBy');

        if (branchId) {
            qb.andWhere('item.branchId = :branchId', { branchId });
        }
        if (filter.trackingCode) {
            qb.andWhere('item.trackingCode ILIKE :code', { code: `%${filter.trackingCode}%` });
        }
        if (filter.status) {
            qb.andWhere('item.currentStatus = :status', { status: filter.status });
        }
        if (filter.clientPhone) {
            qb.andWhere('item.clientPhone ILIKE :phone', { phone: `%${filter.clientPhone}%` });
        }
        if (filter.clientName) {
            qb.andWhere('item.clientName ILIKE :name', { name: `%${filter.clientName}%` });
        }

        qb.orderBy('item.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        const [data, total] = await qb.getManyAndCount();
        return {
            data,
            meta: { page, limit, total, lastPage: Math.ceil(total / limit) },
        };
    }

    async findOne(id: number, branchId?: number): Promise<TrackingItemEntity> {
        const qb = this.trackingRepo.createQueryBuilder('item')
            .leftJoinAndSelect('item.branch', 'branch')
            .leftJoinAndSelect('item.createdBy', 'createdBy')
            .leftJoinAndSelect('item.statusHistory', 'statusHistory')
            .where('item.id = :id', { id });

        if (branchId) {
            qb.andWhere('item.branchId = :branchId', { branchId });
        }

        const item = await qb.getOne();
        if (!item) throw new NotFoundException('Tracking item not found');
        return item;
    }

    async searchByCode(trackingCode: string): Promise<TrackingItemEntity> {
        const item = await this.trackingRepo.findOne({
            where: { trackingCode },
            relations: ['branch', 'statusHistory'],
        });
        if (!item) throw new NotFoundException('Tracking item not found');
        return item;
    }

    async updateStatus(id: number, dto: UpdateStatusDto, user: any, branchId?: number): Promise<TrackingItemEntity> {
        const item = await this.findOne(id, branchId);

        // ADMIN can only set READY_FOR_PICKUP or PICKED_UP
        if (user.role === UserRoles.ADMIN && !ADMIN_ALLOWED_STATUSES.includes(dto.status)) {
            throw new ForbiddenException(`Admin can only set status to: ${ADMIN_ALLOWED_STATUSES.join(', ')}`);
        }

        // Prevent backward transitions
        if (STATUS_ORDER[dto.status] <= STATUS_ORDER[item.currentStatus]) {
            throw new BadRequestException(`Cannot change status from ${item.currentStatus} to ${dto.status} (backward transition)`);
        }

        const prevStatus = item.currentStatus;
        item.currentStatus = dto.status;
        await this.trackingRepo.save(item);

        await this.statusHistoryRepo.save({
            trackingItemId: item.id,
            previousStatus: prevStatus,
            newStatus: dto.status,
            changedByUserId: user.sub,
            source: StatusSource.MANUAL,
            note: dto.note,
        });

        return item;
    }

    async getDashboard(branchId?: number) {
        const qb = this.trackingRepo.createQueryBuilder('item')
            .select('item.currentStatus', 'status')
            .addSelect('COUNT(*)', 'count')
            .groupBy('item.currentStatus');

        if (branchId) {
            qb.where('item.branchId = :branchId', { branchId });
        }

        const result = await qb.getRawMany();
        return result.map(r => ({ status: r.status, count: Number(r.count) }));
    }

    async syncAllWithMaster() {
        const masterTracks = await this.importedTrackRepo.find();
        let updatedCount = 0;

        for (const master of masterTracks) {
            const items = await this.trackingRepo.find({ where: { trackingCode: master.trackingCode } });
            for (const item of items) {
                let changed = false;
                if (master.chinaArrivalDate && !item.chinaArrivalDate) {
                    item.chinaArrivalDate = master.chinaArrivalDate;
                    changed = true;
                }
                if (master.aicargoArrivalDate && !item.aicargoArrivalDate) {
                    item.aicargoArrivalDate = master.aicargoArrivalDate;
                    changed = true;
                }
                if (master.deliveryDate && !item.deliveryDate) {
                    item.deliveryDate = master.deliveryDate;
                    changed = true;
                }

                if (changed) {
                    await this.trackingRepo.save(item);
                    updatedCount++;
                }
            }
        }
        return { message: `Synced ${updatedCount} tracking items` };
    }

    async quickUpdateByCode(dto: QuickUpdateDto, user: any): Promise<TrackingItemEntity> {
        const item = await this.trackingRepo.findOne({
            where: { trackingCode: dto.trackingCode },
            relations: ['branch']
        });

        if (!item) throw new NotFoundException(`Tracking item with code ${dto.trackingCode} is not found`);

        let prevStatus = item.currentStatus;
        const targetStatus = dto.status || TrackingStatus.ARRIVED_BRANCH;

        if (dto.weight !== undefined) {
            item.weight = dto.weight;
        }

        // Only update status if it's a forward transition
        if (STATUS_ORDER[targetStatus] > STATUS_ORDER[item.currentStatus]) {
            item.currentStatus = targetStatus;
        }

        // If item doesn't have a branch, assign it to the admin's branch
        if (!item.branchId && user.branchId) {
            item.branchId = user.branchId;
        }

        const saved = await this.trackingRepo.save(item);

        if (item.currentStatus !== prevStatus) {
            await this.statusHistoryRepo.save({
                trackingItemId: saved.id,
                previousStatus: prevStatus,
                newStatus: item.currentStatus,
                changedByUserId: user.sub,
                source: StatusSource.MANUAL,
                note: 'Quick update by admin (Scan)',
            });

            return saved;
        }
        return item;
    }

    async sendBranchNotifications(user: any) {
        if (!user.branchId) {
            throw new BadRequestException('Admin is not assigned to any branch');
        }
        return this.telegramService.notifyAllBranchArrivals(user.branchId);
    }
}
