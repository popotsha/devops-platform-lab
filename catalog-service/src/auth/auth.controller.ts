import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SessionCacheService } from '../cache/session-cache.service';
import { AppLogger } from '../logging/app-logger.service';

@ApiTags('auth')
@ApiBearerAuth('access-token')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly sessionCache: SessionCacheService,
    private readonly logger: AppLogger,
  ) {}

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke the current JWT (Redis blacklist)' })
  async logout(@Headers('authorization') authorization?: string) {
    this.logger.info('Logging out user ...');

    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice(7)
      : undefined;

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    await this.sessionCache.blacklistToken(token);
  }
}
