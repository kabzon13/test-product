import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import '../env-load';
import { Client } from 'pg';

// Собственный раннер: plain SQL, порядок по имени файла, advisory lock,
// grants для app_user после наката. Expand/contract — откатов нет.

const MIGRATIONS_DIR = resolve(__dirname, '../../migrations');
const LOCK_KEY = 723_119_042;

// Postgres при первом старте перезапускается после init-скриптов — healthcheck
// может пройти в окне временного сервера. Ретраим подключение.
async function connectWithRetry(url: string, attempts = 30): Promise<Client> {
  for (let attempt = 1; ; attempt += 1) {
    const client = new Client({ connectionString: url });
    try {
      await client.connect();
      await client.query('SELECT 1');
      return client;
    } catch (err) {
      await client.end().catch(() => undefined);
      if (attempt >= attempts) throw err;
      console.log(`migrate: БД ещё недоступна (попытка ${attempt}/${attempts}), ждём 1с…`);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

export async function migrate(): Promise<void> {
  const url = process.env.MIGRATE_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error('MIGRATE_DATABASE_URL or DATABASE_URL is required');
  }
  const client = await connectWithRetry(url);
  try {
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_KEY]);
    await client.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         name text PRIMARY KEY,
         applied_at timestamptz NOT NULL DEFAULT now()
       )`,
    );
    const applied = new Set(
      (await client.query<{ name: string }>('SELECT name FROM schema_migrations')).rows.map(
        (r) => r.name,
      ),
    );
    const pending = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort()
      .filter((f) => !applied.has(f));

    for (const file of pending) {
      const sql = readFileSync(resolve(MIGRATIONS_DIR, file), 'utf8');
      console.log(`migrate: applying ${file}`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }

    // migrator владеет таблицами, app_user получает только DML
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
          GRANT USAGE ON SCHEMA public TO app_user;
          GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
          GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
          ALTER DEFAULT PRIVILEGES IN SCHEMA public
            GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
          ALTER DEFAULT PRIVILEGES IN SCHEMA public
            GRANT USAGE, SELECT ON SEQUENCES TO app_user;
        END IF;
      END $$;
    `);

    console.log(`migrate: done (${pending.length} applied)`);
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [LOCK_KEY]).catch(() => undefined);
    await client.end();
  }
}

if (require.main === module) {
  migrate().catch((err) => {
    console.error('migrate: failed', err);
    process.exit(1);
  });
}
