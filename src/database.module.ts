import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                type: 'postgres',
                host: config.get<string>('DATABASE_HOST'),
                port: Number(config.get<string>('DATABASE_PORT') ?? 5432),
                database: config.get<string>('DATABASE_NAME'),
                username: config.get<string>('DATABASE_USERNAME'),
                password: config.get<string>('DATABASE_PASSWORD'),
                synchronize: true,
                entities: [__dirname + '/core/db/entities/*.entity{.ts,.js}'],
                ssl: {
                    rejectUnauthorized: false
                },
                autoLoadEntities: true
            })
        })
    ]
})
export class DatabaseModule { }