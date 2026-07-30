import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { initBrowserOtel } from './app/telemetry/browser-otel';

initBrowserOtel();

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err),
);
