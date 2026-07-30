import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AppLogger } from '../logging/app-logger.service';
import { AnalyticsGatewayService } from './analytics-gateway.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsGatewayService,
    private readonly logger: AppLogger,
  ) {}

  @Get('summary')
  @Roles('manager')
  getSummary(@Req() request: Request) {
    this.logger.info('Fetching analytics summary ...');
    return this.analyticsService.getSummary(request);
  }
}
