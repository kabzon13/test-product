import { z } from 'zod';

import { logLevel, nodeEnv } from './shared.js';

export const workerEnvSchema = z.object({
  NODE_ENV: nodeEnv,
  LOG_LEVEL: logLevel,
  DATABASE_URL: z.string().min(1),
  QUEUE_DRIVER: z.enum(['pg-boss', 'bullmq']).default('pg-boss'),
  REDIS_URL: z.string().optional(),
  GIT_SHA: z.string().default('local'),
});

export type WorkerEnv = z.infer<typeof workerEnvSchema>;
