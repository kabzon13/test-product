import { Module } from '@nestjs/common';

import { env } from '../env';

import { JOB_QUEUE, type JobQueue } from './job-queue';
import { PgBossQueue } from './pg-boss.queue';

// Драйвер выбирается при генерации; неиспользуемый вырезается вместе с зависимостью.
function createQueue(): JobQueue {
  if (env.QUEUE_DRIVER === 'pg-boss') {
    return new PgBossQueue(env.DATABASE_URL);
  }
  throw new Error(`queue driver "${String(env.QUEUE_DRIVER)}" is not available in this build`);
}

@Module({
  providers: [{ provide: JOB_QUEUE, useFactory: createQueue }],
  exports: [JOB_QUEUE],
})
export class QueueModule {}
