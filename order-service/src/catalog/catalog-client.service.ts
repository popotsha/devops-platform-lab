import { HttpService } from '@nestjs/axios';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface CatalogProduct {
  id: number;
  name: string;
  description?: string;
  price: number;
}

@Injectable()
export class CatalogClientService {
  private readonly baseUrl: string;

  constructor(
    private readonly http: HttpService,
    configService: ConfigService,
  ) {
    this.baseUrl =
      configService.get<string>('CATALOG_SERVICE_URL') ?? 'http://catalog-service:4000';
  }

  async getProduct(id: number): Promise<CatalogProduct> {
    try {
      const response = await firstValueFrom(
        this.http.get<CatalogProduct>(`${this.baseUrl}/api/products/${id}`),
      );
      return response.data;
    } catch {
      throw new NotFoundException(`Product ${id} not found`);
    }
  }
}
