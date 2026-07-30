import {
  Body,
  Controller,
  HttpCode,
  Post,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';
import { AppLogger } from '../logging/app-logger.service';
import { ClientLogDto } from './client-log.dto';
import { TelemetryForwarderService } from './telemetry-forwarder.service';

function resolveRawBody(req: RawBodyRequest<Request>): Buffer {
  if (req.rawBody?.length) {
    return req.rawBody;
  }

  if (req.body === undefined || req.body === null) {
    return Buffer.alloc(0);
  }

  if (Buffer.isBuffer(req.body)) {
    return req.body;
  }

  if (typeof req.body === 'string') {
    return Buffer.from(req.body);
  }

  return Buffer.from(JSON.stringify(req.body));
}

@SkipThrottle()
@Controller('telemetry')
@UseGuards(JwtAuthGuard)
export class TelemetryController {
  constructor(
    private readonly logger: AppLogger,
    private readonly forwarder: TelemetryForwarderService,
  ) {}

  /** Legacy JSON log ingest — prefer browser OTLP via POST /telemetry/v1/logs. */
  @Public()
  @Post('logs')
  @HttpCode(204)
  ingestClientLog(@Body() dto: ClientLogDto): void {
    const level = dto.level ?? 'info';
    const meta = {
      event: dto.event ?? 'client.log',
      clientSource: 'angular-app',
      'service.name': 'angular-app',
      ...dto.meta,
    };

    switch (level) {
      case 'error':
        this.logger.error(dto.message, meta);
        break;
      case 'warn':
        this.logger.warn(dto.message, meta);
        break;
      default:
        this.logger.info(dto.message, meta);
    }
  }

  @Public()
  @Post('v1/traces')
  @HttpCode(204)
  async forwardTraces(@Req() req: RawBodyRequest<Request>): Promise<void> {
    await this.forwarder.forward(
      'traces',
      resolveRawBody(req),
      req.headers['content-type'],
    );
  }

  @Public()
  @Post('v1/logs')
  @HttpCode(204)
  async forwardLogs(@Req() req: RawBodyRequest<Request>): Promise<void> {
    await this.forwarder.forward(
      'logs',
      resolveRawBody(req),
      req.headers['content-type'],
    );
  }
}
