import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmailNotification } from './notifications/entities/email-notification.entity';
import { NotificationsModule } from './notifications/notifications.module';
import { MessagingModule } from './messaging/messaging.module';
import { LoggingModule } from './logging/logging.module';
import { RateLimitModule } from './rate-limit/rate-limit.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RedisModule,
    LoggingModule,
    AuthModule,
    RateLimitModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'postgres',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'postgres',
      database: process.env.DB_NAME ?? 'notification_db',
      entities: [EmailNotification],
      // Community Edition: schema auto-sync for local demos. Set TYPEORM_SYNCHRONIZE=false when using migrations.
      synchronize: process.env.TYPEORM_SYNCHRONIZE !== 'false',
      autoLoadEntities: true,
      extra: {
        connectionTimeoutMillis: 5_000,
      },
    }),
    NotificationsModule,
    MessagingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
