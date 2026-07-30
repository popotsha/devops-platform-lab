import { Module } from '@nestjs/common';
import { ProductCacheService } from './product-cache.service';
import { ResponseCacheService } from './response-cache.service';
import { SessionCacheService } from './session-cache.service';

@Module({
  providers: [SessionCacheService, ProductCacheService, ResponseCacheService],
  exports: [SessionCacheService, ProductCacheService, ResponseCacheService],
})
export class CacheModule {}
