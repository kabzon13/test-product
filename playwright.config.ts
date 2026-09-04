import { defineConfig } from '@playwright/test';

// Ходит на make dev / make dev-docker: http://localhost:8080
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.PUBLIC_URL ?? 'http://localhost:8080',
    trace: 'retain-on-failure',
  },
});
