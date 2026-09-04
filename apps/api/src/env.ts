import './env-load';

import { apiEnvSchema, loadEnv } from '@test/config';

export const env = loadEnv(apiEnvSchema);
