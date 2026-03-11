import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Repository } from 'typeorm';
import { TrackingItemEntity } from '../core/db/entities/tracking-item.entity';
import { StatusHistoryEntity } from '../core/db/entities/status-history.entity';
import { TrackingStatus } from '../core/db/enums/tracking-status.enum';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const trackingRepo = app.get<Repository<TrackingItemEntity>>('TrackingItemEntityRepository');
    const historyRepo = app.get<Repository<StatusHistoryEntity>>('StatusHistoryEntityRepository');

    console.log('Fetching tracking items without dates...');
    const items = await trackingRepo.find();
    let updatedCount = 0;

    for (const item of items) {
        let changed = false;

        // Fast lookups if dates are missing
        if (!item.chinaArrivalDate || !item.khanCargoArrivalDate || !item.deliveryDate) {
            const history = await historyRepo.find({
                where: { trackingItemId: item.id },
                order: { createdAt: 'ASC' }
            });

            for (const h of history) {
                if (h.newStatus === TrackingStatus.ARRIVED_CHINA_WAREHOUSE && !item.chinaArrivalDate) {
                    item.chinaArrivalDate = h.createdAt;
                    changed = true;
                }
                if (h.newStatus === TrackingStatus.ARRIVED_BRANCH && !item.khanCargoArrivalDate) {
                    item.khanCargoArrivalDate = h.createdAt;
                    changed = true;
                }
                if (h.newStatus === TrackingStatus.PICKED_UP && !item.deliveryDate) {
                    item.deliveryDate = h.createdAt;
                    changed = true;
                }
            }
        }

        if (changed) {
            await trackingRepo.save(item);
            updatedCount++;
        }
    }

    console.log(`Updated ${updatedCount} items with dates from history`);
    await app.close();
    process.exit(0);
}

bootstrap().catch(err => {
    console.error(err);
    process.exit(1);
});
