import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { decodeJwt } from 'jose';
import { RedisService } from '../redis/redis.service';

export interface CachedUser {
  sub: string;
  email?: string;
  preferredUsername?: string;
  roles: string[];
}

@Injectable()
export class SessionCacheService {
  private readonly sessionTtl: number;

  constructor(
    private readonly redis: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.sessionTtl = Number(
      this.configService.get<string>('CACHE_SESSION_TTL_SECONDS', '300'),
    );
  }

  tokenKey(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private blacklistKey(tokenHash: string): string {
    return `session:blacklist:${tokenHash}`;
  }

  private sessionKey(tokenHash: string): string {
    return `session:user:${tokenHash}`;
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const value = await this.redis.get(this.blacklistKey(this.tokenKey(token)));
    return value === '1';
  }

  async blacklistToken(token: string): Promise<void> {
    const hash = this.tokenKey(token);
    const ttl = this.remainingTokenTtl(token) ?? this.sessionTtl;
    await this.redis.set(this.blacklistKey(hash), '1', ttl);
    await this.redis.del(this.sessionKey(hash));
  }

  async getSession(token: string): Promise<CachedUser | null> {
    const raw = await this.redis.get(this.sessionKey(this.tokenKey(token)));
    if (!raw) return null;
    return JSON.parse(raw) as CachedUser;
  }

  async setSession(token: string, user: CachedUser): Promise<void> {
    const hash = this.tokenKey(token);
    const ttl = Math.min(
      this.remainingTokenTtl(token) ?? this.sessionTtl,
      this.sessionTtl,
    );
    await this.redis.set(this.sessionKey(hash), JSON.stringify(user), ttl);
  }

  private remainingTokenTtl(token: string): number | null {
    try {
      const { exp } = decodeJwt(token);
      if (!exp) return null;
      return Math.max(exp - Math.floor(Date.now() / 1000), 1);
    } catch {
      return null;
    }
  }
}
