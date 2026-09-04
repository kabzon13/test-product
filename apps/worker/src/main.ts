import './env-load';

import { loadEnv, workerEnvSchema } from '@test/config';
import { pino } from 'pino';

import { runPgBoss } from './pg-boss-runner';

const env = loadEnv(workerEnvSchema);
const logger = pino({ level: env.LOG_LEVEL });

async function main(): Promise<void> {
  if (env.QUEUE_DRIVER === 'pg-boss') {
    await runPgBoss(env, logger);
    return;
  }
  throw new Error(`queue driver "${String(env.QUEUE_DRIVER)}" is not available in this build`);
}

main().catch((err) => {
  logger.error({ err }, 'worker failed to start');
  process.exit(1);
});
