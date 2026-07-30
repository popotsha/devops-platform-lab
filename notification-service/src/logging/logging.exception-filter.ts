import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AppLogger } from './app-logger.service';

@Catch()
export class LoggingExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<{ status: (code: number) => { json: (body: unknown) => void } }>();
    const request = ctx.getRequest<{
      method?: string;
      originalUrl?: string;
      url?: string;
      user?: { sub?: string };
    }>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const message =
      exception instanceof Error ? exception.message : 'Internal server error';

    const stack = exception instanceof Error ? exception.stack : undefined;

    const method = request.method ?? 'UNKNOWN';
    const path = request.originalUrl ?? request.url ?? '/';

    this.logger.error('API request failed: {method} {path}', {
      event: 'api.request.error',
      method,
      path,
      statusCode: status,
      error:
        typeof errorResponse === 'string'
          ? errorResponse
          : typeof errorResponse === 'object' &&
              errorResponse !== null &&
              'message' in errorResponse
            ? String((errorResponse as { message: unknown }).message)
            : message,
      ...(request.user?.sub ? { userSub: request.user.sub } : {}),
      ...(stack ? { stack } : {}),
    });

    const body =
      typeof errorResponse === 'object' && errorResponse !== null
        ? errorResponse
        : { statusCode: status, message };

    response.status(status).json(body);
  }
}
