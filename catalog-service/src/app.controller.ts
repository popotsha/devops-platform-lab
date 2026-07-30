import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from './auth/public.decorator';
import { AppLogger } from './logging/app-logger.service';
import { AppService, HealthStatus } from './app.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly logger: AppLogger,
  ) {}

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Service health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy.' })
  @ApiResponse({ status: 503, description: 'Service is degraded (e.g. database unreachable).' })
  async getHealth(): Promise<HealthStatus> {
    this.logger.info('Checking service health ...');
    const health = await this.appService.getHealth();

    if (health.status !== 'ok') {
      throw new ServiceUnavailableException(health);
    }

    return health;
  }
}
