import { Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/core/db/entities/user.entity';
import { BranchEntity } from 'src/core/db/entities/branch.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TokenService } from './services/token.service';
import { UserService } from './services/user.service';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategies';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, BranchEntity]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET')
      })
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService, UserService, JwtStrategy],
  exports: [UserService, AuthService]
})
export class AuthModule { }
