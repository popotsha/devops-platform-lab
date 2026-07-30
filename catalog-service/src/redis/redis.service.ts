import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.enabled = this.configService.get<string>('REDIS_ENABLED', 'true') !== 'false';
    if (this.enabled) {
      this.connect();
    }
  }

  private connect() {
    const host = this.configService.get<string>('REDIS_HOST', 'redis');
    const port = Number(this.configService.get<string>('REDIS_PORT', '6379'));
    const password = this.configService.get<string>('REDIS_PASSWORD');

    this.client = new Redis({
      host,
      port,
      password: password || undefined,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
    });

    this.client.on('error', (err) => {
      this.logger.warn(`Redis error: ${err.message}`);
    });

    this.client.connect().catch((err) => {
      this.logger.warn(`Redis unavailable: ${err.message}`);
    });
  }

  isReady(): boolean {
    return this.client?.status === 'ready';
  }

  async get(key: string): Promise<string | null> {
    if (!this.isReady()) return null;
    return this.client!.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.isReady()) return;
    if (ttlSeconds) {
      await this.client!.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client!.set(key, value);
    }
  }

  async del(...keys: string[]): Promise<void> {
    if (!this.isReady() || keys.length === 0) return;
    await this.client!.del(...keys);
  }

  async incr(key: string): Promise<number | null> {
    if (!this.isReady()) return null;
    return this.client!.incr(key);
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    if (!this.isReady()) return;
    await this.client!.expire(key, ttlSeconds);
  }

  async ttl(key: string): Promise<number | null> {
    if (!this.isReady()) return null;
    return this.client!.ttl(key);
  }

  onModuleDestroy() {
    this.client?.disconnect();
  }
}
