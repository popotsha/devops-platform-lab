import 'dotenv/config';
import './instrumentation';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

function validateEnv(): void {
  const required = [
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'KEYCLOAK_JWKS_URI',
    'CATALOG_SERVICE_URL',
    'RABBITMQ_URL',
  ];
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length === 0) return;

  console.error(
    `\n[Config] order-service is missing required environment variables:\n` +
      missing.map((k) => `  • ${k}`).join('\n') +
      `\n\nFix: ensure these are set in your .env file or docker-compose.yml environment section.\n`,
  );
  process.exit(1);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Order Service API')
      .setDescription('Protected routes require a Keycloak access token (Bearer JWT).')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Paste the Keycloak access token from your logged-in session',
        },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  await app.listen(process.env.PORT ?? 4001);
}

validateEnv();
bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\n[Startup] order-service failed to start: ${message}\n`);
  process.exit(1);
});
