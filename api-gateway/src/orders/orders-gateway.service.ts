import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { firstValueFrom } from 'rxjs';
import { forwardAuthorization } from '../http/internal-headers';
import { resolveOrderServiceUrl } from '../http/service-urls';
import { CreateOrderDto, UpdateOrderStatusDto } from './create-order.dto';

@Injectable()
export class OrdersGatewayService {
  private readonly orderServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    configService: ConfigService,
  ) {
    this.orderServiceUrl = resolveOrderServiceUrl(configService);
  }

  createOrder(dto: CreateOrderDto, request: Request) {
    return firstValueFrom(
      this.httpService.post(`${this.orderServiceUrl}/api/orders`, dto, {
        headers: forwardAuthorization(request),
      }),
    ).then((response) => response.data);
  }

  getMyOrders(request: Request) {
    return firstValueFrom(
      this.httpService.get(`${this.orderServiceUrl}/api/orders/mine`, {
        headers: forwardAuthorization(request),
      }),
    ).then((response) => response.data);
  }

  getAllOrders(request: Request) {
    return firstValueFrom(
      this.httpService.get(`${this.orderServiceUrl}/api/orders`, {
        headers: forwardAuthorization(request),
      }),
    ).then((response) => response.data);
  }

  updateOrderStatus(id: number, dto: UpdateOrderStatusDto, request: Request) {
    return firstValueFrom(
      this.httpService.patch(
        `${this.orderServiceUrl}/api/orders/${id}/status`,
        dto,
        { headers: forwardAuthorization(request) },
      ),
    ).then((response) => response.data);
  }
}
