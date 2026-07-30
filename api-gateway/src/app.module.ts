import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AnalyticsController } from './analytics/analytics.controller';
import { AnalyticsGatewayService } from './analytics/analytics-gateway.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { OrdersController } from './orders/orders.controller';
import { OrdersGatewayService } from './orders/orders-gateway.service';
import { ProductsController } from './products/products.controller';
import { ProductsGatewayService } from './products/products-gateway.service';
import { NotificationsController } from './notifications/notifications.controller';
import { NotificationsGatewayService } from './notifications/notifications-gateway.service';
import { HealthController } from './health.controller';
import { LoggingModule } from './logging/logging.module';
import { TelemetryController } from './telemetry/telemetry.controller';
import { TelemetryForwarderService } from './telemetry/telemetry-forwarder.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggingModule,
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL_MS') ?? 60_000,
          limit: config.get<number>('THROTTLE_LIMIT') ?? 100,
        },
      ],
    }),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 0,
    }),
  ],
  controllers: [
    HealthController,
    ProductsController,
    OrdersController,
    AnalyticsController,
    NotificationsController,
    TelemetryController,
  ],
  providers: [
    ProductsGatewayService,
    OrdersGatewayService,
    AnalyticsGatewayService,
    NotificationsGatewayService,
    JwtAuthGuard,
    RolesGuard,
    TelemetryForwarderService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
