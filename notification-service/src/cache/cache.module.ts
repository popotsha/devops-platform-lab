import { Module } from '@nestjs/common';
import { ResponseCacheService } from './response-cache.service';
import { SessionCacheService } from './session-cache.service';

@Module({
  providers: [SessionCacheService, ResponseCacheService],
  exports: [SessionCacheService, ResponseCacheService],
})
export class CacheModule {}
