import type { WorkerEnv } from '@test/config';
import PgBoss from 'pg-boss';
import type { Logger } from 'pino';

import { handlers } from './handlers';

export async function runPgBoss(env: WorkerEnv, logger: Logger): Promise<void> {
  const boss = new PgBoss(env.DATABASE_URL);
  boss.on('error', (err) => logger.error({ err }, 'pg-boss error'));
  await boss.start();

  for (const [name, handler] of Object.entries(handlers)) {
    await boss.createQueue(name).catch(() => undefined);
    await boss.work(name, async (jobs) => {
      for (const job of jobs) {
        const log = logger.child({ jobId: job.id, name });
        log.info('job started');
        await handler(job.data as never, log);
        log.info('job done');
      }
    });
  }

  logger.info({ driver: 'pg-boss', queues: Object.keys(handlers) }, 'worker started');

  const shutdown = async () => {
    logger.info('worker stopping');
    await boss.stop({ wait: true });
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown());
  process.on('SIGINT', () => void shutdown());
}
