import { z } from 'zod';

export const boolFromString = z
  .enum(['true', 'false'])
  .default('false')
  .transform((v) => v === 'true');

export const nodeEnv = z.enum(['development', 'test', 'production']).default('development');

export const logLevel = z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info');
