import { Injectable } from '@angular/core';
import { SpanStatusCode, trace } from '@opentelemetry/api';
import { flushBrowserTraces } from './browser-otel';

type TraceAttributes = Record<string, string | number | boolean>;

@Injectable({ providedIn: 'root' })
export class BrowserTraceService {
  private readonly tracer = trace.getTracer('angular-app');

  async run<T>(
    name: string,
    fn: () => Promise<T> | T,
    attributes?: TraceAttributes,
  ): Promise<T> {
    const span = this.tracer.startSpan(name);

    if (attributes) {
      span.setAttributes(attributes);
    }

    try {
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      span.end();
      await flushBrowserTraces();
    }
  }
}
