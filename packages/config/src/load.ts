import type { z } from 'zod';

/**
 * Валидация окружения. Fail-fast: невалидный конфиг — процесс не стартует.
 */
export function loadEnv<T extends z.ZodTypeAny>(schema: T, source = process.env): z.infer<T> {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`);
    process.stderr.write(`Invalid environment:\n${lines.join('\n')}\n`);
    process.exit(1);
  }
  return parsed.data as z.infer<T>;
}
