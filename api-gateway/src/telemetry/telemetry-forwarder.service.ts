import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { resolveOtlpHeaders } from './otlp-headers';

type OtlpSignal = 'traces' | 'logs';

@Injectable()
export class TelemetryForwarderService {
  private readonly log = new Logger(TelemetryForwarderService.name);
  private readonly telemetryEnabled: boolean;
  private readonly otlpBase: string | undefined;
  private readonly headers: Record<string, string>;
  private skipReasonLogged = false;

  constructor(config: ConfigService) {
    this.telemetryEnabled = config.get<string>('OTEL_ENABLED') === 'true';
    this.otlpBase = config
      .get<string>('OTEL_EXPORTER_OTLP_ENDPOINT')
      ?.replace(/\/$/, '');
    this.headers = resolveOtlpHeaders(process.env) ?? {};
  }

  async forward(
    signal: OtlpSignal,
    body: Buffer,
    contentType?: string | string[],
  ): Promise<void> {
    if (!this.telemetryEnabled || !this.otlpBase || !this.headers.Authorization) {
      if (!this.skipReasonLogged) {
        this.log.warn(
          'OTLP forward disabled or not configured; telemetry payloads will be dropped',
        );
        this.skipReasonLogged = true;
      }
      return;
    }

    if (!body.length) {
      return;
    }

    const ct = Array.isArray(contentType) ? contentType[0] : contentType;
    const response = await fetch(`${this.otlpBase}/v1/${signal}`, {
      method: 'POST',
      headers: {
        'Content-Type': ct ?? 'application/x-protobuf',
        ...this.headers,
      },
      body: new Uint8Array(body),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      this.log.warn(
        `OTLP ${signal} forward failed: ${response.status} ${detail.slice(0, 200)}`,
      );
      return;
    }
  }
}
