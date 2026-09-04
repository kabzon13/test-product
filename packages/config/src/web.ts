import { z } from 'zod';

import { nodeEnv } from './shared.js';

export const webEnvSchema = z.object({
  NODE_ENV: nodeEnv,
  // серверный клиент API (RSC) ходит по внутреннему адресу
  INTERNAL_API_URL: z.string().url(),
  PUBLIC_URL: z.string().url(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
});

export type WebEnv = z.infer<typeof webEnvSchema>;
