import { ConfigService } from '@nestjs/config';

export function resolveCatalogServiceUrl(config: ConfigService): string {
  return (
    config.get<string>('CATALOG_SERVICE_URL') ??
    config.get<string>('PRODUCT_SERVICE_URL') ??
    'http://localhost:4000'
  );
}

export function resolveOrderServiceUrl(config: ConfigService): string {
  return config.get<string>('ORDER_SERVICE_URL') ?? 'http://localhost:4001';
}

export function resolveNotificationServiceUrl(config: ConfigService): string {
  return config.get<string>('NOTIFICATION_SERVICE_URL') ?? 'http://localhost:4002';
}
