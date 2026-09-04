import { z } from 'zod';

import { boolFromString } from './shared.js';
import { logLevel, nodeEnv } from './shared.js';

export const apiEnvSchema = z.object({
  NODE_ENV: nodeEnv,
  PORT: z.coerce.number().int().positive().default(4000),
  PUBLIC_URL: z.string().url(),
  LOG_LEVEL: logLevel,
  DATABASE_URL: z.string().min(1),
  SESSION_TTL_DAYS: z.coerce.number().int().positive().default(30),
  // Secure-куки: по умолчанию = production. dev-docker (http, но NODE_ENV=production)
  // выключает явно — иначе браузер отвергнет __Host-куку без TLS.
  COOKIE_SECURE: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),

  // Email — Core: Mailpit локально через SMTP
  EMAIL_FROM: z.string().min(3),
  SMTP_URL: z.string().min(1).default('smtp://localhost:1025'),
  EMAIL_PROVIDER: z.enum(['smtp', 'resend']).default('smtp'),
  RESEND_API_KEY: z.string().optional(),

  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().min(1),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  S3_FORCE_PATH_STYLE: boolFromString,

  REDIS_URL: z.string().optional(),

  QUEUE_DRIVER: z.enum(['pg-boss', 'bullmq']).default('pg-boss'),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_ID: z.string().optional(),

  SENTRY_DSN: z.string().optional(),

  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional(),

  GIT_SHA: z.string().default('local'),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;
