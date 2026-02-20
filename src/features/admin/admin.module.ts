import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AuthModule } from '../auth/auth.module';
import { UserService } from '../auth/services/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/core/db/entities/user.entity';
import { SettingsEntity } from 'src/core/db/entities/settings.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, SettingsEntity]), AuthModule],
  controllers: [AdminController],
  providers: [AdminService, UserService],
})
export class AdminModule { }
