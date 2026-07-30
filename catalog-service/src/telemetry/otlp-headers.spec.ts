import {
  buildGrafanaBasicAuthHeader,
  isRawGlcBasicAuth,
  parseOtlpHeaders,
  resolveOtlpHeaders,
} from './otlp-headers';

describe('parseOtlpHeaders', () => {
  it('parses Authorization header', () => {
    expect(parseOtlpHeaders('Authorization=Basic abc123')).toEqual({
      Authorization: 'Basic abc123',
    });
  });

  it('decodes Grafana URL-encoded Authorization values', () => {
    expect(parseOtlpHeaders('Authorization=Basic%20abc123')).toEqual({
      Authorization: 'Basic abc123',
    });
  });

  it('returns undefined for empty input', () => {
    expect(parseOtlpHeaders(undefined)).toBeUndefined();
    expect(parseOtlpHeaders('')).toBeUndefined();
  });
});

describe('buildGrafanaBasicAuthHeader', () => {
  it('base64-encodes instanceId:token', () => {
    expect(buildGrafanaBasicAuthHeader('123456', 'glc_test')).toBe(
      `Basic ${Buffer.from('123456:glc_test').toString('base64')}`,
    );
  });
});

describe('resolveOtlpHeaders', () => {
  it('builds header from Grafana Cloud env vars', () => {
    const headers = resolveOtlpHeaders({
      GRAFANA_CLOUD_INSTANCE_ID: '123456',
      GRAFANA_CLOUD_API_TOKEN: 'glc_test',
    });
    expect(headers?.Authorization).toBe(
      buildGrafanaBasicAuthHeader('123456', 'glc_test'),
    );
  });

  it('rejects raw glc token in OTEL_EXPORTER_OTLP_HEADERS', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation();
    const headers = resolveOtlpHeaders({
      OTEL_EXPORTER_OTLP_HEADERS: 'Authorization=Basic glc_abc',
    });
    expect(headers).toBeUndefined();
    expect(isRawGlcBasicAuth('Basic glc_abc')).toBe(true);
    warn.mockRestore();
  });
});
