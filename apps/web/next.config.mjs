import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { config as dotenv } from 'dotenv';

// Единый .env лежит в корне репозитория — Next сам его не видит.
const rootEnv = resolve(process.cwd(), '../../.env');
if (existsSync(rootEnv)) {
  dotenv({ path: rootEnv });
}

/** @type {import('next').NextConfig} */
let nextConfig = {
  output: 'standalone',
  transpilePackages: ['@test/api-client'],
  outputFileTracingRoot: resolve(process.cwd(), '../../'),
};

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  const { withSentryConfig } = await import('@sentry/nextjs');
  nextConfig = withSentryConfig(nextConfig, { silent: true });
}

export default nextConfig;
