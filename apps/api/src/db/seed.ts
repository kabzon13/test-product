import '../env-load';
import * as argon2 from 'argon2';
import { Client } from 'pg';

// Seed только для локальной разработки: dev-пользователь с подтверждённой почтой.

export async function seed(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('seed is not for production');
  }
  const url = process.env.MIGRATE_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');

  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    const passwordHash = await argon2.hash('password', { type: argon2.argon2id });
    await client.query(
      `INSERT INTO users (email, password_hash, email_verified_at)
       VALUES ($1, $2, now())
       ON CONFLICT (email) DO NOTHING`,
      ['dev@example.com', passwordHash],
    );
    console.log('seed: dev@example.com / password');
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  seed().catch((err) => {
    console.error('seed: failed', err);
    process.exit(1);
  });
}
