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
    const response = ctx.getResponse<{
      status: (code: number) => { json: (body: unknown) => void };
    }>();
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
      error: this.resolveLogMessage(errorResponse, message),
      ...(request.user?.sub ? { userSub: request.user.sub } : {}),
      // Keep stacks in logs only — never return them to API clients.
      ...(stack ? { stack } : {}),
    });

    if (typeof errorResponse === 'object' && errorResponse !== null) {
      response.status(status).json(errorResponse);
      return;
    }

    // Avoid leaking raw Error.message for unexpected failures.
    response.status(status).json({
      statusCode: status,
      message:
        status >= HttpStatus.INTERNAL_SERVER_ERROR
          ? 'Internal server error'
          : typeof errorResponse === 'string'
            ? errorResponse
            : message,
    });
  }

  private resolveLogMessage(
    errorResponse: string | object | null,
    fallback: string,
  ): string {
    if (typeof errorResponse === 'string') {
      return errorResponse;
    }
    if (
      typeof errorResponse === 'object' &&
      errorResponse !== null &&
      'message' in errorResponse
    ) {
      return String((errorResponse as { message: unknown }).message);
    }
    return fallback;
  }
}
