import 'dotenv/config';  // must be first
import './instrumentation';   // start OTel second
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

function validateEnv(): void {
  const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'RABBITMQ_URL'];
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length === 0) return;

  console.error(
    `\n[Config] notification-service is missing required environment variables:\n` +
    missing.map((k) => `  • ${k}`).join('\n') +
    `\n\nFix: ensure these are set in your .env file or docker-compose.yml environment section.\n`,
  );
  process.exit(1);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.setGlobalPrefix('api');

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Notification Service API')
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

  await app.listen(process.env.PORT ?? 4002);
}
validateEnv();
bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\n[Startup] notification-service failed to start: ${message}\n`);
  process.exit(1);
});