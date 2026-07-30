import { ConfigService } from '@nestjs/config';

function isTruthy(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === 'true';
}

/** SMTP delivery is active only when explicitly enabled and host is configured. */
export function isSmtpEnabled(configService: ConfigService): boolean {
  if (!isTruthy(configService.get<string>('SMTP_ENABLED'))) {
    return false;
  }

  return Boolean(configService.get<string>('SMTP_HOST')?.trim());
}

export function getSmtpDisabledMessage(configService: ConfigService): string {
  if (!isTruthy(configService.get<string>('SMTP_ENABLED'))) {
    return 'SMTP delivery is disabled (set SMTP_ENABLED=true in root .env)';
  }

  return 'SMTP is enabled but SMTP_HOST is not configured';
}
