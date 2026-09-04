import { defineConfig } from 'drizzle-kit';

// Используется только для drizzle-kit generate (диффы схемы → SQL).
// Накат миграций делает собственный раннер: src/db/migrate.ts.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './migrations',
  dbCredentials: {
    url: process.env.MIGRATE_DATABASE_URL ?? 'postgres://migrator:migrator@localhost:5432/app',
  },
});
