import { Global, Module, OnApplicationShutdown } from '@nestjs/common';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { env } from '../env';

import * as schema from './schema';

export const DB = Symbol('DB');
export const PG_POOL = Symbol('PG_POOL');

export type Db = NodePgDatabase<typeof schema>;

const pool = new Pool({ connectionString: env.DATABASE_URL, max: 10 });

@Global()
@Module({
  providers: [
    { provide: PG_POOL, useValue: pool },
    { provide: DB, useValue: drizzle(pool, { schema }) },
  ],
  exports: [DB, PG_POOL],
})
export class DbModule implements OnApplicationShutdown {
  async onApplicationShutdown(): Promise<void> {
    await pool.end();
  }
}
