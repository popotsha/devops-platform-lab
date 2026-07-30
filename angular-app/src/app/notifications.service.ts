import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { EmailNotification } from './models';
import { getRuntimeConfig } from './runtime-config';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly http = inject(HttpClient);

  private get apiBaseUrl(): string {
    return getRuntimeConfig().apiGatewayUrl;
  }

  getAll() {
    return firstValueFrom(
      this.http.get<EmailNotification[]>(`${this.apiBaseUrl}/notifications`),
    );
  }
}
