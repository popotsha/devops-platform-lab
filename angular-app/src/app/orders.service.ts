import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Order } from './models';
import { getRuntimeConfig } from './runtime-config';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);

  private get apiBaseUrl(): string {
    return getRuntimeConfig().apiGatewayUrl;
  }

  getMyOrders() {
    return firstValueFrom(this.http.get<Order[]>(`${this.apiBaseUrl}/orders/mine`));
  }

  getAllOrders() {
    return firstValueFrom(this.http.get<Order[]>(`${this.apiBaseUrl}/orders`));
  }

  updateOrderStatus(id: number, status: Order['status']) {
    return firstValueFrom(
      this.http.patch<Order>(`${this.apiBaseUrl}/orders/${id}/status`, { status }),
    );
  }
}
