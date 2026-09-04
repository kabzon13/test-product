import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import '../env-load';

// Скрипт поднимает приложение без listen и пишет openapi.json.
// Дальше openapi-typescript генерирует typed client (make gen-api).

process.env.NODE_ENV = process.env.NODE_ENV ?? 'development';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgres://app_user:app_user@localhost:5432/app';
process.env.PUBLIC_URL = process.env.PUBLIC_URL ?? 'http://localhost:8080';
process.env.EMAIL_FROM = process.env.EMAIL_FROM ?? 'no-reply@localhost';
process.env.S3_ENDPOINT = process.env.S3_ENDPOINT ?? 'http://localhost:9000';
process.env.S3_BUCKET = process.env.S3_BUCKET ?? 'test';
process.env.S3_ACCESS_KEY = process.env.S3_ACCESS_KEY ?? 'minioadmin';
process.env.S3_SECRET_KEY = process.env.S3_SECRET_KEY ?? 'minioadmin';

async function main(): Promise<void> {
  const { NestFactory } = await import('@nestjs/core');
  const { SwaggerModule } = await import('@nestjs/swagger');
  const { AppModule } = await import('../app.module');
  const { buildOpenApiConfig } = await import('../openapi');

  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api/v1', { exclude: ['health', 'ready', 'metrics'] });
  const doc = SwaggerModule.createDocument(app, buildOpenApiConfig(), {
    ignoreGlobalPrefix: true,
  });

  const out = resolve(__dirname, '../../../../packages/api-client/openapi.json');
  mkdirSync(resolve(out, '..'), { recursive: true });
  writeFileSync(out, `${JSON.stringify(doc, null, 2)}\n`);
  console.log(`openapi: written to ${out}`);
  await app.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('openapi: failed', err);
  process.exit(1);
});
