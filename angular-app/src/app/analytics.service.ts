import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AnalyticsSummary } from './models';
import { getRuntimeConfig } from './runtime-config';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http = inject(HttpClient);

  private get apiBaseUrl(): string {
    return getRuntimeConfig().apiGatewayUrl;
  }

  getSummary() {
    return firstValueFrom(
      this.http.get<AnalyticsSummary>(`${this.apiBaseUrl}/analytics/summary`),
    );
  }
}
