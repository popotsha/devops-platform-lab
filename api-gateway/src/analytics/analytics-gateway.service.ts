import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { firstValueFrom } from 'rxjs';
import { forwardAuthorization } from '../http/internal-headers';
import { resolveCatalogServiceUrl } from '../http/service-urls';

@Injectable()
export class AnalyticsGatewayService {
  private readonly catalogServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    configService: ConfigService,
  ) {
    this.catalogServiceUrl = resolveCatalogServiceUrl(configService);
  }

  getSummary(request: Request) {
    return firstValueFrom(
      this.httpService.get(`${this.catalogServiceUrl}/api/analytics/summary`, {
        headers: forwardAuthorization(request),
      }),
    ).then((response) => response.data);
  }
}
