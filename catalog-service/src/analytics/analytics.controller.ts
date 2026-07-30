import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator';
import { AppLogger } from '../logging/app-logger.service';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiBearerAuth('access-token')
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly logger: AppLogger,
  ) {}

  @Get('summary')
  @Roles('manager')
  @ApiOperation({ summary: 'Dashboard analytics summary' })
  getSummary() {
    this.logger.info('Fetching analytics summary ...');
    return this.analyticsService.getSummary();
  }
}
