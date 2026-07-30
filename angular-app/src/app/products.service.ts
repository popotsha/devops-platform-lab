import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CreateProductInput, Product, UpdateProductInput } from './models';
import { getRuntimeConfig } from './runtime-config';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);

  private get apiBaseUrl(): string {
    return getRuntimeConfig().apiGatewayUrl;
  }

  listProducts() {
    return firstValueFrom(this.http.get<Product[]>(`${this.apiBaseUrl}/products`));
  }

  createProduct(input: CreateProductInput) {
    return firstValueFrom(
      this.http.post<Product>(`${this.apiBaseUrl}/products`, input),
    );
  }

  updateProduct(id: number, input: UpdateProductInput) {
    return firstValueFrom(
      this.http.patch<Product>(`${this.apiBaseUrl}/products/${id}`, input),
    );
  }

  deleteProduct(id: number) {
    return firstValueFrom(
      this.http.delete<void>(`${this.apiBaseUrl}/products/${id}`),
    );
  }
}
