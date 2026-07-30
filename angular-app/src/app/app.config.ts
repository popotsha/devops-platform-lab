import { APP_INITIALIZER, ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import {
  INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
  includeBearerTokenInterceptor,
  provideKeycloak,
} from 'keycloak-angular';
import { AuthService } from './auth.service';
import { routes } from './app.routes';
import { apiGatewayUrlPattern, getRuntimeConfig } from './runtime-config';
import { BrowserLoggerService } from './telemetry/browser-logger.service';
import { BrowserTraceService } from './telemetry/browser-trace.service';

const runtimeConfig = getRuntimeConfig();

function showConfigError(message: string): void {
  document.body.innerHTML = `
    <div style="font-family:sans-serif;max-width:560px;margin:80px auto;padding:32px;border:1px solid #f5a623;border-radius:8px;background:#fff8f0;">
      <h2 style="color:#c0392b;margin-top:0">Configuration error</h2>
      <p style="color:#333">${message}</p>
      <p style="color:#666;font-size:0.9em">Check the browser console and your Docker Compose environment variables.</p>
    </div>`;
}

function initializeApp(
  authService: AuthService,
  logger: BrowserLoggerService,
  tracer: BrowserTraceService,
) {
  return async () => {
    const cfg = window.__ENV;
    if (!cfg?.keycloakUrl || !cfg?.apiGatewayUrl) {
      const msg = 'Missing runtime configuration (<code>window.__ENV</code>). ' +
        'The app container may not have started correctly — check Docker logs.';
      console.error('[Config]', msg, cfg);
      showConfigError(msg);
      return;
    }

    try {
      await tracer.run('app.initialize', async () => {
        await authService.initialize();
        logger.info('Angular app initialized', { event: 'app.start' });
      }, { event: 'app.start' });
    } catch (error) {
      const msg = `Failed to connect to Keycloak at <code>${cfg.keycloakUrl}</code>. ` +
        'Make sure Keycloak is running and the realm <code>ms-realm</code> is configured correctly.';
      console.error('[Config] Angular app initialization failed:', error);
      showConfigError(msg);
    }
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideKeycloak({
      config: {
        url: runtimeConfig.keycloakUrl,
        realm: runtimeConfig.keycloakRealm,
        clientId: runtimeConfig.keycloakClientId,
      },
      initOptions: {
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri:
          window.location.origin + '/silent-check-sso.html',
        checkLoginIframe: false,
        pkceMethod: 'S256',
      },
    }),
    {
      provide: INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
      useValue: [
        {
          urlPattern: apiGatewayUrlPattern(runtimeConfig.apiGatewayUrl),
          httpMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
        },
      ],
    },
    provideHttpClient(withInterceptors([includeBearerTokenInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      multi: true,
      deps: [AuthService, BrowserLoggerService, BrowserTraceService],
    },
  ],
};
