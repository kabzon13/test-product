import { Injectable, Logger, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import PgBoss from 'pg-boss';

import { type EnqueueOptions, type JobQueue } from './job-queue';

@Injectable()
export class PgBossQueue implements JobQueue, OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(PgBossQueue.name);
  private readonly boss: PgBoss;

  constructor(databaseUrl: string) {
    this.boss = new PgBoss(databaseUrl);
  }

  async onModuleInit(): Promise<void> {
    this.boss.on('error', (err) => this.logger.error({ err }, 'pg-boss error'));
    await this.boss.start();
  }

  async onApplicationShutdown(): Promise<void> {
    await this.boss.stop();
  }

  async enqueue(name: string, data: object, opts?: EnqueueOptions): Promise<void> {
    await this.boss.createQueue(name).catch(() => undefined);
    await this.boss.send(name, data, {
      ...(opts?.startAfterSeconds !== undefined ? { startAfter: opts.startAfterSeconds } : {}),
      ...(opts?.singletonKey !== undefined ? { singletonKey: opts.singletonKey } : {}),
    });
  }
}
