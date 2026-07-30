import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator';
import { AppLogger } from '../logging/app-logger.service';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth('access-token')
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly logger: AppLogger,
  ) {}

  @Get()
  @Roles('manager')
  @ApiOperation({ summary: 'List notification delivery log (manager view)' })
  findAll() {
    this.logger.info('Listing email notifications ...');
    return this.notificationsService.findAll();
  }
}
