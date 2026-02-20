import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TrackingItemEntity } from "src/core/db/entities/tracking-item.entity";
import { TrackingStatus } from "src/core/db/enums/tracking-status.enum";
import { UserEntity } from "src/core/db/entities/user.entity";
import { BranchEntity } from "src/core/db/entities/branch.entity";
import { SettingsEntity } from "src/core/db/entities/settings.entity";

@Injectable()
export class TelegramService {
    private readonly logger = new Logger(TelegramService.name);

    constructor(
        private readonly configService: ConfigService,
        @InjectRepository(TrackingItemEntity)
        private readonly trackingRepo: Repository<TrackingItemEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        @InjectRepository(BranchEntity)
        private readonly branchRepo: Repository<BranchEntity>,
        @InjectRepository(SettingsEntity)
        private readonly settingsRepo: Repository<SettingsEntity>,
    ) { }

    private get botToken(): string {
        return this.configService.getOrThrow('TELEGRAM_BOT_TOKEN');
    }

    async sendMessage(chatId: string, text: string, threadId?: number): Promise<boolean> {
        try {
            const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
            const payload: any = {
                chat_id: chatId,
                text,
                parse_mode: 'HTML',
            };

            if (threadId) {
                payload.message_thread_id = threadId;
            }

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!data.ok) {
                this.logger.warn(`Telegram API error: ${JSON.stringify(data)}`);
                return false;
            }
            return true;
        } catch (err) {
            this.logger.error(`Failed to send Telegram message: ${err.message}`);
            return false;
        }
    }

    async getSettings(): Promise<{ pricePerKg: number; dollarRate: number }> {
        const priceSetting = await this.settingsRepo.findOne({ where: { key: 'PRICE_PER_KG' } });
        const rateSetting = await this.settingsRepo.findOne({ where: { key: 'DOLLAR_RATE' } });

        return {
            pricePerKg: priceSetting ? parseFloat(priceSetting.value) : 4,
            dollarRate: rateSetting ? parseFloat(rateSetting.value) : 500,
        };
    }

    async notifyAllBranchArrivals(branchId: number): Promise<{ usersNotified: number; itemsNotified: number }> {
        const branch = await this.branchRepo.findOne({ where: { id: branchId } });
        if (!branch) {
            this.logger.warn(`Branch ${branchId} not found`);
            return { usersNotified: 0, itemsNotified: 0 };
        }

        const globalChatId = this.configService.getOrThrow('TELEGRAM_CHAT_ID');

        // Find all items that need notification (Arrived at branch AND not yet notified)
        const items = await this.trackingRepo.find({
            where: {
                branchId: branchId,
                currentStatus: TrackingStatus.ARRIVED_BRANCH,
                isTelegramNotified: false,
            },
        });

        if (items.length === 0) return { usersNotified: 0, itemsNotified: 0 };

        // Group by user
        const userGroups = new Map<number, TrackingItemEntity[]>();
        items.forEach(item => {
            const list = userGroups.get(item.createdByUserId) || [];
            list.push(item);
            userGroups.set(item.createdByUserId, list);
        });

        const { pricePerKg, dollarRate } = await this.getSettings();
        let usersNotified = 0;
        let itemsNotified = 0;

        for (const [userId, userItems] of userGroups.entries()) {
            const user = await this.userRepo.findOne({ where: { id: userId } });
            if (!user) continue;

            const message = this.buildInvoiceMessage(user, userItems, branch, pricePerKg, dollarRate);
            const success = await this.sendMessage(globalChatId, message, branch.telegramThreadId);

            if (success) {
                // Mark items as notified
                await this.trackingRepo.update(
                    userItems.map(i => i.id),
                    { isTelegramNotified: true }
                );
                usersNotified++;
                itemsNotified += userItems.length;
            }
        }

        return { usersNotified, itemsNotified };
    }

    private buildInvoiceMessage(
        user: UserEntity,
        items: TrackingItemEntity[],
        branch: BranchEntity,
        pricePerKg: number,
        dollarRate: number,
    ): string {
        const userName = user.name || 'Клиент';
        const userCode = user.userCode || `ID:${user.id}`;
        const mention = user.telegramUsername ? (user.telegramUsername.startsWith('@') ? user.telegramUsername : `@${user.telegramUsername}`) : `<b>${userName}</b>`;

        let totalWeight = 0;
        const lines: string[] = [];

        items.forEach((item, idx) => {
            const w = item.weight ? Number(item.weight) : 0;
            totalWeight += w;
            const weightStr = w > 0 ? `${w} кг` : 'салмағы белгісіз';
            lines.push(`${idx + 1}. <b>${item.trackingCode}</b> — ${item.description} — ${weightStr}`);
        });

        const costUsd = (totalWeight * pricePerKg).toFixed(1);
        const costTenge = Math.round(totalWeight * pricePerKg * dollarRate);

        return [
            `📦 ${mention} (${userCode})`,
            ``,
            `Сіздің тауарларыңыз филиалға жетті:`,
            ``,
            ...lines,
            ``,
            `📊 Жалпы: <b>${items.length}</b> тауар, <b>${totalWeight.toFixed(1)}</b> кг`,
            `💰 Құны: ${totalWeight.toFixed(1)} × $${pricePerKg} = <b>$${costUsd}</b> (≈ ${costTenge.toLocaleString()} ₸)`,
            ``,
            `📍 ${branch.name}`,
        ].join('\n');
    }
}
