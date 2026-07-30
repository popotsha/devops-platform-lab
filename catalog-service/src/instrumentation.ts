import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { resolveOtlpHeaders } from './telemetry/otlp-headers';

const serviceName = process.env.OTEL_SERVICE_NAME || 'catalog-service';

if (process.env.OTEL_ENABLED !== 'true') {
  console.log(`[OTel] Telemetry disabled for ${serviceName} — set OTEL_ENABLED=true in catalog-service/.env to enable`);
} else {
  if (process.env.OTEL_LOG_LEVEL) {
    const level =
      DiagLogLevel[process.env.OTEL_LOG_LEVEL.toUpperCase() as keyof typeof DiagLogLevel] ??
      DiagLogLevel.INFO;
    diag.setLogger(new DiagConsoleLogger(), level);
  }

  const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.replace(/\/$/, '');
  const otlpHeaders = resolveOtlpHeaders(process.env);

  if (otlpHeaders?.Authorization && !process.env.OTEL_EXPORTER_OTLP_HEADERS) {
    process.env.OTEL_EXPORTER_OTLP_HEADERS = `Authorization=${otlpHeaders.Authorization}`;
  }

  if (!otlpEndpoint || !otlpHeaders?.Authorization) {
    console.warn(
      '[OTel] Missing Grafana OTLP config. Set OTEL_EXPORTER_OTLP_ENDPOINT and either ' +
        'GRAFANA_CLOUD_INSTANCE_ID + GRAFANA_CLOUD_API_TOKEN, or OTEL_EXPORTER_OTLP_HEADERS=Authorization=Basic <base64>.',
    );
  }

  const resourceAttributes = (process.env.OTEL_RESOURCE_ATTRIBUTES ?? '')
    .split(',')
    .map((pair) => pair.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, pair) => {
      const eq = pair.indexOf('=');
      if (eq === -1) return acc;
      acc[pair.slice(0, eq).trim()] = pair.slice(eq + 1).trim();
      return acc;
    }, {});

  const sdk = new NodeSDK({
    serviceName,
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
      ...resourceAttributes,
    }),
    traceExporter: new OTLPTraceExporter({
      url: otlpEndpoint ? `${otlpEndpoint}/v1/traces` : undefined,
      headers: otlpHeaders,
    }),
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({
        url: otlpEndpoint ? `${otlpEndpoint}/v1/metrics` : undefined,
        headers: otlpHeaders,
      }),
    }),
    logRecordProcessors: [
      new BatchLogRecordProcessor({
        exporter: new OTLPLogExporter({
          url: otlpEndpoint ? `${otlpEndpoint}/v1/logs` : undefined,
          headers: otlpHeaders,
        }),
      }),
    ],
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-winston': {
          disableLogSending: true,
        },
      }),
    ],
  });

  sdk.start();

  console.log(
    `[OTel] SDK started — service=${serviceName} endpoint=${otlpEndpoint ?? 'not set'} auth=${otlpHeaders?.Authorization ? 'configured' : 'missing'}`,
  );

  async function shutdownTelemetry(signal: string) {
    console.log(`[OTel] Shutting down (${signal})...`);
    try {
      await sdk.shutdown();
    } catch (error) {
      console.error('[OTel] Shutdown error:', error);
    }
  }

  process.once('SIGTERM', () => void shutdownTelemetry('SIGTERM'));
  process.once('SIGINT', () => void shutdownTelemetry('SIGINT'));
}
