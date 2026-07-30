export interface RuntimeConfig {
  keycloakUrl: string;
  keycloakRealm: string;
  keycloakClientId: string;
  apiGatewayUrl: string;
  otelEnabled?: boolean;
  otelServiceName?: string;
  otelDeploymentEnvironment?: string;
}

declare global {
  interface Window {
    __ENV?: Partial<RuntimeConfig>;
  }
}

export function getRuntimeConfig(): RuntimeConfig {
  const env = window.__ENV ?? {};
  const host = window.location.hostname;
  const protocol = window.location.protocol;

  const config: RuntimeConfig = {
    keycloakUrl: env.keycloakUrl ?? 'http://localhost:8080',
    keycloakRealm: env.keycloakRealm ?? 'ms-realm',
    keycloakClientId: env.keycloakClientId ?? 'angular-app',
    apiGatewayUrl: env.apiGatewayUrl ?? `${protocol}//${host}:3001`,
    otelEnabled: env.otelEnabled ?? false,
    otelServiceName: env.otelServiceName,
    otelDeploymentEnvironment: env.otelDeploymentEnvironment,
  };

  return config;
}

export function apiGatewayUrlPattern(apiGatewayUrl: string): RegExp {
  const parsed = new URL(apiGatewayUrl);
  const host = parsed.hostname.replace(/\./g, '\\.');
  const port = parsed.port || (parsed.protocol === 'https:' ? '443' : '80');
  return new RegExp(`^${parsed.protocol}//${host}:${port}(/.*)?$`);
}
