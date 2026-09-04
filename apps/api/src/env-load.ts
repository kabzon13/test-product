import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { config } from 'dotenv';

// В dev приложение запускается из apps/api, а .env лежит в корне репозитория.
// В контейнере переменные приходят из compose env_file — файла нет, ничего не грузим.
// dotenv не перетирает уже заданные переменные.
for (const candidate of ['.env', '../../.env']) {
  const file = resolve(process.cwd(), candidate);
  if (existsSync(file)) {
    config({ path: file });
    break;
  }
}
