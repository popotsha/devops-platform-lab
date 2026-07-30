import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { firstValueFrom } from 'rxjs';
import { forwardAuthorization } from '../http/internal-headers';
import { proxyDownstream } from '../http/proxy-downstream';
import { resolveCatalogServiceUrl } from '../http/service-urls';
import { CreateProductDto } from './create-product.dto';
import { UpdateProductDto } from './update-product.dto';

@Injectable()
export class ProductsGatewayService {
  private readonly catalogServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    configService: ConfigService,
  ) {
    this.catalogServiceUrl = resolveCatalogServiceUrl(configService);
  }

  getProducts() {
    return proxyDownstream(async () => {
      const response = await firstValueFrom(
        this.httpService.get(`${this.catalogServiceUrl}/api/products`),
      );
      return response.data;
    });
  }

  getProduct(id: number) {
    return proxyDownstream(async () => {
      const response = await firstValueFrom(
        this.httpService.get(`${this.catalogServiceUrl}/api/products/${id}`),
      );
      return response.data;
    });
  }

  createProduct(dto: CreateProductDto, request: Request) {
    return proxyDownstream(async () => {
      const response = await firstValueFrom(
        this.httpService.post(`${this.catalogServiceUrl}/api/products`, dto, {
          headers: forwardAuthorization(request),
        }),
      );
      return response.data;
    });
  }

  updateProduct(id: number, dto: UpdateProductDto, request: Request) {
    return proxyDownstream(async () => {
      const response = await firstValueFrom(
        this.httpService.patch(`${this.catalogServiceUrl}/api/products/${id}`, dto, {
          headers: forwardAuthorization(request),
        }),
      );
      return response.data;
    });
  }

  deleteProduct(id: number, request: Request) {
    return proxyDownstream(async () => {
      const response = await firstValueFrom(
        this.httpService.delete(`${this.catalogServiceUrl}/api/products/${id}`, {
          headers: forwardAuthorization(request),
        }),
      );
      return response.data;
    });
  }
}
