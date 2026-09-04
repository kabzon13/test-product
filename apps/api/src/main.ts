import './env-load';
import './otel';
import './sentry';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';

import { AppModule } from './app.module';
import { env } from './env';
import { buildOpenApiConfig } from './openapi';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true, rawBody: true });

  app.useLogger(app.get(Logger));
  app.useGlobalInterceptors(new LoggerErrorInterceptor());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.use(cookieParser());
  app.setGlobalPrefix('api/v1', { exclude: ['health', 'ready', 'metrics'] });
  app.enableShutdownHooks();

  // Swagger только вне production
  if (env.NODE_ENV !== 'production') {
    const doc = SwaggerModule.createDocument(app, buildOpenApiConfig(), {
      ignoreGlobalPrefix: true,
    });
    SwaggerModule.setup('api/docs', app, doc);
  }

  await app.listen(env.PORT, '0.0.0.0');
}

void bootstrap();
