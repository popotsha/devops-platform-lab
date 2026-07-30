import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from './auth/public.decorator';
import { AppLogger } from './logging/app-logger.service';

@SkipThrottle()
@Controller()
export class HealthController {
  constructor(private readonly logger: AppLogger) {}

  /** Public liveness probe — used by Docker/K8s healthchecks (no auth). */
  @Public()
  @Get('health')
  health() {
    this.logger.info('Checking service health ...');
    return { status: 'ok' };
  }
}
