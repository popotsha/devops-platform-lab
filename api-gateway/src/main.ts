import 'dotenv/config';
import './instrumentation';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

function validateEnv(): void {
  const required = [
    'KEYCLOAK_JWKS_URI',
    'CATALOG_SERVICE_URL',
    'ORDER_SERVICE_URL',
    'NOTIFICATION_SERVICE_URL',
  ];
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length === 0) return;

  console.error(
    `\n[Config] api-gateway is missing required environment variables:\n` +
      missing.map((k) => `  • ${k}`).join('\n') +
      `\n\nFix: ensure these are set in your .env file or docker-compose.yml environment section.\n`,
  );
  process.exit(1);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const configService = app.get(ConfigService);

  const corsOrigins =
    configService
      .get<string>('CORS_ORIGINS')
      ?.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean) ?? [
      'http://localhost:4200',
      'http://localhost:4201',
      'http://127.0.0.1:4200',
      'http://127.0.0.1:4201',
    ];

  app.enableCors({
    origin: corsOrigins,
    allowedHeaders: [
      'Authorization',
      'Content-Type',
      'traceparent',
      'tracestate',
      'baggage',
    ],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.listen(configService.get<number>('API_GATEWAY_PORT') ?? 3001);
}

validateEnv();
bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\n[Startup] api-gateway failed to start: ${message}\n`);
  process.exit(1);
});
