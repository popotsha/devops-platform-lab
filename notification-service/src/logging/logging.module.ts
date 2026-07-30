import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AppLogger } from './app-logger.service';
import { LoggingExceptionFilter } from './logging.exception-filter';

@Global()
@Module({
  providers: [
    {
      provide: AppLogger,
      useFactory: () => AppLogger.getInstance(),
    },
    { provide: APP_FILTER, useClass: LoggingExceptionFilter },
  ],
  exports: [AppLogger],
})
export class LoggingModule {}
