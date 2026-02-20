import { Module } from '@nestjs/common';
import { DatabaseModule } from './database.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './features/auth/auth.module';
import { AdminModule } from './features/admin/admin.module';
import { BranchModule } from './features/branch/branch.module';
import { TrackingModule } from './features/tracking/tracking.module';
import { FeedModule } from './features/feed/feed.module';
import { ProfileModule } from './features/profile/profile.module';
import { TelegramModule } from './features/telegram/telegram.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    AdminModule,
    BranchModule,
    TrackingModule,
    FeedModule,
    ProfileModule,
    TelegramModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
