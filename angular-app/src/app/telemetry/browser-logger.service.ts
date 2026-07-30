import { Injectable, inject } from '@angular/core';
import { logs } from '@opentelemetry/api-logs';
import { AuthService } from '../auth.service';
import { getBrowserLogSeverity } from './browser-otel';

type LogLevel = 'info' | 'warn' | 'error';
type LogMeta = Record<string, string | number | boolean>;

@Injectable({ providedIn: 'root' })
export class BrowserLoggerService {
  private readonly auth = inject(AuthService);
  private readonly logger = logs.getLogger('angular-app');

  info(message: string, meta?: LogMeta): void {
    this.emit('info', message, meta);
  }

  warn(message: string, meta?: LogMeta): void {
    this.emit('warn', message, meta);
  }

  error(message: string, meta?: LogMeta): void {
    this.emit('error', message, meta);
  }

  private emit(level: LogLevel, message: string, meta?: LogMeta): void {
    const profile = this.auth.userProfile();

    this.logger.emit({
      severityNumber: getBrowserLogSeverity(level),
      severityText: level.toUpperCase(),
      body: message,
      attributes: {
        ...meta,
        ...(profile?.username ? { username: profile.username } : {}),
      },
    });
  }
}
