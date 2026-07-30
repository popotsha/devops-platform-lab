import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AppLogger } from '../logging/app-logger.service';
import { NotificationsGatewayService } from './notifications-gateway.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsGatewayService,
    private readonly logger: AppLogger,
  ) {}

  @Get()
  @Roles('manager')
  getAll(@Req() request: Request) {
    this.logger.info('Listing notifications ...');
    return this.notificationsService.getAll(request);
  }
}
