import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly windowSeconds: number;
  private readonly maxRequests: number;

  constructor(
    private readonly redis: RedisService,
    private readonly configService: ConfigService,
  ) {
    const ttlMs = Number(this.configService.get<string>('RATE_LIMIT_TTL_MS', '60000'));
    this.windowSeconds = Math.max(Math.ceil(ttlMs / 1000), 1);
    this.maxRequests = Number(this.configService.get<string>('RATE_LIMIT_MAX', '100'));
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const identifier = this.resolveIdentifier(request);
    const windowStart = Math.floor(Date.now() / 1000 / this.windowSeconds);
    const key = `ratelimit:${identifier}:${windowStart}`;

    const count = await this.redis.incr(key);
    // Fail open when Redis is unavailable so local demos keep working.
    if (count === null) {
      return true;
    }

    if (count === 1) {
      await this.redis.expire(key, this.windowSeconds);
    }

    if (count > this.maxRequests) {
      throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }

  private resolveIdentifier(request: {
    ip?: string;
    user?: { sub?: string };
    headers?: Record<string, string | string[] | undefined>;
  }): string {
    if (request.user?.sub) {
      return `user:${request.user.sub}`;
    }

    const apiKey = request.headers?.['x-api-key'];
    if (typeof apiKey === 'string' && apiKey) {
      return `apikey:${apiKey}`;
    }

    const forwarded = request.headers?.['x-forwarded-for'];
    const ip =
      (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : undefined) ||
      request.ip ||
      'unknown';

    return `ip:${ip}`;
  }
}
