import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { firstValueFrom } from 'rxjs';
import { forwardAuthorization } from '../http/internal-headers';
import { proxyDownstream } from '../http/proxy-downstream';
import { resolveNotificationServiceUrl } from '../http/service-urls';

@Injectable()
export class NotificationsGatewayService {
  private readonly notificationServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    configService: ConfigService,
  ) {
    this.notificationServiceUrl = resolveNotificationServiceUrl(configService);
  }

  getAll(request: Request) {
    return proxyDownstream(async () => {
      const response = await firstValueFrom(
        this.httpService.get(`${this.notificationServiceUrl}/api/notifications`, {
          headers: forwardAuthorization(request),
        }),
      );
      return response.data;
    });
  }
}
