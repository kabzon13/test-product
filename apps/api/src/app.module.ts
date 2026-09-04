import { randomUUID } from 'node:crypto';

import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import type { Request } from 'express';
import { LoggerModule } from 'nestjs-pino';

import { AuthModule } from './auth/auth.module';
import { BillingModule } from './billing/billing.module';
import { CacheModule } from './cache/cache.module';
import { csrfMiddleware } from './common/csrf.middleware';
import { metricsMiddleware } from './common/metrics';
import { DbModule } from './db/db.module';
import { EmailModule } from './email/email.module';
import { env } from './env';
import { HealthModule } from './health/health.module';
import { QueueModule } from './queue/queue.module';
import { StorageModule } from './storage/storage.module';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: env.LOG_LEVEL,
        genReqId: (req) => (req.headers['x-request-id'] as string | undefined) ?? randomUUID(),
        customProps: (req) => ({
          requestId: (req as Request & { id?: string }).id,
          userId: (req as Request & { user?: { id: string } }).user?.id,
        }),
        autoLogging: {
          ignore: (req) => ['/health', '/ready', '/metrics'].includes(req.url ?? ''),
        },
        ...(env.NODE_ENV === 'development'
          ? { transport: { target: 'pino-pretty', options: { singleLine: true } } }
          : {}),
        redact: ['req.headers.cookie', 'req.headers.authorization'],
      },
    }),
    DbModule,
    HealthModule,
    EmailModule,
    CacheModule,
    AuthModule,
    StorageModule,
    QueueModule,
    WebhooksModule,
    BillingModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(metricsMiddleware, csrfMiddleware).forRoutes('*');
  }
}
