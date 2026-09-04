import '../env-load';
import { Client } from 'pg';

import { migrate } from './migrate';
import { seed } from './seed';

// Полный сброс локальной БД: drop schema → миграции → seed.

async function reset(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('db:reset is not for production');
  }
  const url = process.env.MIGRATE_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');

  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    await client.query('DROP SCHEMA public CASCADE');
    await client.query('CREATE SCHEMA public');
    await client.query('GRANT USAGE ON SCHEMA public TO PUBLIC');
    console.log('reset: schema dropped');
  } finally {
    await client.end();
  }
  await migrate();
  await seed();
}

reset().catch((err) => {
  console.error('reset: failed', err);
  process.exit(1);
});
