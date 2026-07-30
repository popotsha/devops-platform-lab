import { logs, SeverityNumber } from '@opentelemetry/api-logs';
import * as winston from 'winston';
import { LOG_LEVEL_NAMES, LogLevel } from './log-level';

const WINSTON_INTERNAL_KEYS = new Set([
  'level',
  'message',
  'timestamp',
  'service',
  'splat',
]);

const LEVEL_TO_SEVERITY: Record<string, SeverityNumber> = {
  error: SeverityNumber.ERROR,
  warn: SeverityNumber.WARN,
  info: SeverityNumber.INFO,
  debug: SeverityNumber.DEBUG,
  verbose: SeverityNumber.TRACE,
};

/** OTLP/Loki-safe attribute values — scalars only, objects JSON-stringified. */
export function sanitizeLogMeta(
  meta: Record<string, unknown>,
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(meta)) {
    if (WINSTON_INTERNAL_KEYS.has(key)) continue;
    if (value === null || value === undefined) continue;

    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      out[key] = value;
    } else {
      out[key] = JSON.stringify(value);
    }
  }

  return out;
}

export function isValuesRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Error) &&
    !(value instanceof Date)
  );
}

/** Replace `{key}` placeholders in message with stringified values. */
export function applyPlaceholders(
  message: string,
  values: Record<string, unknown>,
): string {
  return Object.entries(values).reduce((msg, [key, value]) => {
    return msg.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }, message);
}

export class AppLogger {
  private static instance: AppLogger;

  private readonly consoleLogger: winston.Logger;
  private readonly otelLogger;
  private readonly serviceName: string;

  protected constructor() {
    this.serviceName = process.env.OTEL_SERVICE_NAME ?? 'api-gateway';
    this.otelLogger = logs.getLogger(this.serviceName);

    this.consoleLogger = winston.createLogger({
      level: process.env.LOG_LEVEL ?? 'info',
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.printf((info) => {
              const { timestamp, level, message, ...rest } = info;
              const meta = sanitizeLogMeta(rest as Record<string, unknown>);
              const metaStr =
                Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
              return `${timestamp} [${level}] ${message}${metaStr}`;
            }),
          ),
        }),
      ],
    });
  }

  static getInstance(): AppLogger {
    if (!AppLogger.instance) {
      AppLogger.instance = new AppLogger();
    }
    return AppLogger.instance;
  }

  log(message: string, logLevel: LogLevel, ...optionalParams: unknown[]): void;
  log(
    message: string,
    values: Record<string, unknown>,
    logLevel: LogLevel,
  ): void;
  log(
    message: string,
    levelOrValues: LogLevel | Record<string, unknown>,
    logLevelOrParam?: LogLevel | unknown,
    ...rest: unknown[]
  ): void {
    if (
      isValuesRecord(levelOrValues) &&
      typeof logLevelOrParam === 'number'
    ) {
      this.emitWithValues(
        LOG_LEVEL_NAMES[logLevelOrParam as LogLevel] ?? 'info',
        message,
        levelOrValues,
      );
      return;
    }

    const logLevel = levelOrValues as LogLevel;
    const level = LOG_LEVEL_NAMES[logLevel] ?? 'info';
    const extras =
      logLevelOrParam !== undefined ? [logLevelOrParam, ...rest] : rest;
    this.emitPlain(level, message, extras);
  }

  info(message: string, ...optionalParams: unknown[]): void;
  info(message: string, values: Record<string, unknown>): void;
  info(message: string, valuesOrParam?: unknown, ...rest: unknown[]): void {
    this.emitLevelMethod('info', message, valuesOrParam, rest);
  }

  debug(message: string, ...optionalParams: unknown[]): void;
  debug(message: string, values: Record<string, unknown>): void;
  debug(message: string, valuesOrParam?: unknown, ...rest: unknown[]): void {
    this.emitLevelMethod('debug', message, valuesOrParam, rest);
  }

  warn(message: string, ...optionalParams: unknown[]): void;
  warn(message: string, values: Record<string, unknown>): void;
  warn(message: string, valuesOrParam?: unknown, ...rest: unknown[]): void {
    this.emitLevelMethod('warn', message, valuesOrParam, rest);
  }

  error(message: string, ...optionalParams: unknown[]): void;
  error(message: string, values: Record<string, unknown>): void;
  error(message: string, valuesOrParam?: unknown, ...rest: unknown[]): void {
    if (isValuesRecord(valuesOrParam)) {
      const values = { ...valuesOrParam };
      const stack =
        typeof values.stack === 'string' ? values.stack : undefined;
      if (stack !== undefined) {
        delete values.stack;
      }

      const sanitizedMessage = applyPlaceholders(message, values);
      const meta = sanitizeLogMeta(values);
      if (stack) {
        meta.stack = stack;
      }
      this.write('error', sanitizedMessage, meta);
      return;
    }

    const extras =
      valuesOrParam !== undefined ? [valuesOrParam, ...rest] : rest;
    this.emitPlain('error', message, extras);
  }

  verbose(message: string, ...optionalParams: unknown[]): void;
  verbose(message: string, values: Record<string, unknown>): void;
  verbose(message: string, valuesOrParam?: unknown, ...rest: unknown[]): void {
    this.emitLevelMethod('verbose', message, valuesOrParam, rest);
  }

  private emitLevelMethod(
    level: string,
    message: string,
    valuesOrParam: unknown,
    rest: unknown[],
  ) {
    if (isValuesRecord(valuesOrParam)) {
      this.emitWithValues(level, message, valuesOrParam);
      return;
    }

    const extras =
      valuesOrParam !== undefined ? [valuesOrParam, ...rest] : rest;
    this.emitPlain(level, message, extras);
  }

  private emitWithValues(
    level: string,
    message: string,
    values: Record<string, unknown>,
  ) {
    const sanitizedMessage = applyPlaceholders(message, values);
    this.write(level, sanitizedMessage, sanitizeLogMeta(values));
  }

  private emitPlain(level: string, message: string, extras: unknown[]) {
    const meta: Record<string, unknown> = {};
    extras.forEach((param, index) => {
      if (param !== undefined) {
        meta[`param${index}`] = param;
      }
    });
    this.write(level, message, sanitizeLogMeta(meta));
  }

  private write(
    level: string,
    message: string,
    meta: Record<string, string | number | boolean> = {},
  ) {
    const attributes = {
      service: this.serviceName,
      ...meta,
    };

    this.consoleLogger.log(level, message, attributes);

    this.otelLogger.emit({
      severityNumber: LEVEL_TO_SEVERITY[level] ?? SeverityNumber.INFO,
      severityText: level.toUpperCase(),
      body: message,
      attributes,
    });
  }
}
