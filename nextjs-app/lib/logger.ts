import { logs, SeverityNumber } from '@opentelemetry/api-logs';

const LEVEL_TO_SEVERITY: Record<string, SeverityNumber> = {
  error: SeverityNumber.ERROR,
  warn: SeverityNumber.WARN,
  info: SeverityNumber.INFO,
  debug: SeverityNumber.DEBUG,
};

function sanitizeLogMeta(
  meta: Record<string, unknown>,
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(meta)) {
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

export class AppLogger {
  private static instance: AppLogger;
  private readonly otelLogger;
  private readonly serviceName: string;

  protected constructor() {
    this.serviceName = process.env.OTEL_SERVICE_NAME ?? 'nextjs-app';
    this.otelLogger = logs.getLogger(this.serviceName);
  }

  static getInstance(): AppLogger {
    if (!AppLogger.instance) {
      AppLogger.instance = new AppLogger();
    }
    return AppLogger.instance;
  }

  info(message: string, meta?: Record<string, unknown>) {
    this.write('info', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>) {
    this.write('warn', message, meta);
  }

  error(message: string, meta?: Record<string, unknown>) {
    this.write('error', message, meta);
  }

  private write(level: string, message: string, meta?: Record<string, unknown>) {
    const attributes = {
      service: this.serviceName,
      ...sanitizeLogMeta(meta ?? {}),
    };

    console.log(`[${level}] ${message}`, attributes);

    this.otelLogger.emit({
      severityNumber: LEVEL_TO_SEVERITY[level] ?? SeverityNumber.INFO,
      severityText: level.toUpperCase(),
      body: message,
      attributes,
    });
  }
}

export const logger = AppLogger.getInstance();
