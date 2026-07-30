import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class ResponseCacheService {
  private readonly defaultTtl: number;

  constructor(
    private readonly redis: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.defaultTtl = Number(
      this.configService.get<string>('CACHE_API_TTL_SECONDS', '60'),
    );
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(`api:${key}`);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.redis.set(
      `api:${key}`,
      JSON.stringify(value),
      ttlSeconds ?? this.defaultTtl,
    );
  }

  async invalidate(key: string): Promise<void> {
    await this.redis.del(`api:${key}`);
  }
}
