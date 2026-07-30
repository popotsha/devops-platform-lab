import { logs, SeverityNumber } from '@opentelemetry/api-logs';
import { ZoneContextManager } from '@opentelemetry/context-zone-peer-dep';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { BatchLogRecordProcessor, LoggerProvider } from '@opentelemetry/sdk-logs';
import { SimpleSpanProcessor, WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { apiGatewayUrlPattern, getRuntimeConfig } from '../runtime-config';

let initialized = false;
let tracerProvider: WebTracerProvider | undefined;

const TELEMETRY_PATH = /\/telemetry(\/v1\/(traces|logs)|\/logs)$/;

/**
 * Browser-side OpenTelemetry for Angular.
 *
 * Exports traces and logs through api-gateway OTLP proxy (avoids Grafana CORS).
 * Uses ZoneContextManager for Angular/zone.js compatibility.
 */
export function initBrowserOtel(): void {
  if (initialized || typeof window === 'undefined') {
    return;
  }

  const config = getRuntimeConfig();

  if (config.otelEnabled !== true) {
    return;
  }

  const serviceName = config.otelServiceName ?? 'angular-app';
  const apiGatewayPattern = apiGatewayUrlPattern(config.apiGatewayUrl);
  const telemetryBase = `${config.apiGatewayUrl}/telemetry/v1`;

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: serviceName,
    'deployment.environment': config.otelDeploymentEnvironment ?? 'local',
  });

  const traceExporter = new OTLPTraceExporter({
    url: `${telemetryBase}/traces`,
  });

  tracerProvider = new WebTracerProvider({
    resource,
    // Export each span immediately — batching often loses browser spans before flush.
    spanProcessors: [new SimpleSpanProcessor(traceExporter)],
  });

  tracerProvider.register({
    contextManager: new ZoneContextManager(),
  });

  const logExporter = new OTLPLogExporter({
    url: `${telemetryBase}/logs`,
  });

  const loggerProvider = new LoggerProvider({
    resource,
    processors: [new BatchLogRecordProcessor({ exporter: logExporter })],
  });
  logs.setGlobalLoggerProvider(loggerProvider);

  registerInstrumentations({
    instrumentations: [
      new FetchInstrumentation({
        propagateTraceHeaderCorsUrls: [apiGatewayPattern],
        ignoreUrls: [TELEMETRY_PATH],
        clearTimingResources: true,
      }),
      new XMLHttpRequestInstrumentation({
        propagateTraceHeaderCorsUrls: [apiGatewayPattern],
        ignoreUrls: [TELEMETRY_PATH],
        clearTimingResources: true,
      }),
    ],
  });

  initialized = true;
  console.info(
    `[OTel] Browser export enabled — service=${serviceName} → ${telemetryBase}`,
  );
}

export async function flushBrowserTraces(): Promise<void> {
  await tracerProvider?.forceFlush();
}

export function getBrowserLogSeverity(level: 'info' | 'warn' | 'error'): SeverityNumber {
  switch (level) {
    case 'error':
      return SeverityNumber.ERROR;
    case 'warn':
      return SeverityNumber.WARN;
    default:
      return SeverityNumber.INFO;
  }
}
