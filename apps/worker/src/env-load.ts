import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { config } from 'dotenv';

for (const candidate of ['.env', '../../.env']) {
  const file = resolve(process.cwd(), candidate);
  if (existsSync(file)) {
    config({ path: file });
    break;
  }
}
