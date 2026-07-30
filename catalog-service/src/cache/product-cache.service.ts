import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Product } from '../products/entities/product.entity';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class ProductCacheService {
  private readonly ttl: number;
  private readonly allKey = 'products:all';

  constructor(
    private readonly redis: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.ttl = Number(
      this.configService.get<string>('CACHE_PRODUCT_TTL_SECONDS', '300'),
    );
  }

  private itemKey(id: number): string {
    return `products:id:${id}`;
  }

  async getAll(): Promise<Product[] | null> {
    const raw = await this.redis.get(this.allKey);
    return raw ? (JSON.parse(raw) as Product[]) : null;
  }

  async setAll(products: Product[]): Promise<void> {
    await this.redis.set(this.allKey, JSON.stringify(products), this.ttl);
  }

  async getOne(id: number): Promise<Product | null> {
    const raw = await this.redis.get(this.itemKey(id));
    return raw ? (JSON.parse(raw) as Product) : null;
  }

  async setOne(product: Product): Promise<void> {
    await this.redis.set(this.itemKey(product.id), JSON.stringify(product), this.ttl);
  }

  async invalidateAll(): Promise<void> {
    await this.redis.del(this.allKey);
  }

  async invalidateOne(id: number): Promise<void> {
    await this.redis.del(this.itemKey(id), this.allKey);
  }
}
