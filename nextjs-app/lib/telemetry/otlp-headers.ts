/**
 * Grafana Cloud OTLP auth helpers.
 */
export function parseOtlpHeaders(raw?: string): Record<string, string> | undefined {
  if (!raw?.trim()) {
    return undefined;
  }

  const headers: Record<string, string> = {};
  for (const part of raw.split(',')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    try {
      headers[key] = decodeURIComponent(value);
    } catch {
      headers[key] = value;
    }
  }

  return Object.keys(headers).length > 0 ? headers : undefined;
}

export function buildGrafanaBasicAuthHeader(
  instanceId: string,
  apiToken: string,
): string {
  const credentials = Buffer.from(`${instanceId}:${apiToken}`).toString('base64');
  return `Basic ${credentials}`;
}

export function isRawGlcBasicAuth(value?: string): boolean {
  return !!value?.startsWith('Basic glc_');
}

export function resolveOtlpHeaders(env: NodeJS.ProcessEnv): Record<string, string> | undefined {
  const instanceId = env.GRAFANA_CLOUD_INSTANCE_ID?.trim();
  const apiToken = env.GRAFANA_CLOUD_API_TOKEN?.trim();

  if (instanceId && apiToken) {
    return { Authorization: buildGrafanaBasicAuthHeader(instanceId, apiToken) };
  }

  const parsed = parseOtlpHeaders(env.OTEL_EXPORTER_OTLP_HEADERS);
  if (parsed?.Authorization) {
    if (isRawGlcBasicAuth(parsed.Authorization)) {
      console.warn(
        '[OTel] Invalid OTEL_EXPORTER_OTLP_HEADERS: use base64(instanceId:token), not "Basic glc_...". ' +
          'Set GRAFANA_CLOUD_INSTANCE_ID + GRAFANA_CLOUD_API_TOKEN instead.',
      );
      return undefined;
    }
    return parsed;
  }

  if (env.OTEL_AUTH_HEADER) {
    return { Authorization: env.OTEL_AUTH_HEADER };
  }

  return undefined;
}
