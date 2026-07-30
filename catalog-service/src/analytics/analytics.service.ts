import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { ResponseCacheService } from '../cache/response-cache.service';
import { Product } from '../products/entities/product.entity';

interface OrderStats {
  orderCount: number;
  confirmedOrders: number;
}

@Injectable()
export class AnalyticsService {
  private readonly cacheKey = 'analytics:summary';
  private readonly orderServiceUrl: string;

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly responseCache: ResponseCacheService,
    private readonly http: HttpService,
    configService: ConfigService,
  ) {
    this.orderServiceUrl =
      configService.get<string>('ORDER_SERVICE_URL') ?? 'http://order-service:4001';
  }

  async getSummary() {
    const cached = await this.responseCache.get<Record<string, number>>(this.cacheKey);
    if (cached) {
      return cached;
    }

    const [products, orderStats] = await Promise.all([
      this.productRepository.find(),
      this.fetchOrderStats(),
    ]);

    const inventoryValue = products.reduce(
      (sum, product) => sum + Number(product.price),
      0,
    );

    const summary = {
      productCount: products.length,
      inventoryValue,
      orderCount: orderStats.orderCount,
      confirmedOrders: orderStats.confirmedOrders,
    };

    await this.responseCache.set(this.cacheKey, summary);
    return summary;
  }

  private async fetchOrderStats(): Promise<OrderStats> {
    try {
      const response = await firstValueFrom(
        this.http.get<OrderStats>(`${this.orderServiceUrl}/api/orders/stats`),
      );
      return response.data;
    } catch {
      return { orderCount: 0, confirmedOrders: 0 };
    }
  }
}
