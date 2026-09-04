import { base, untypedFiles } from '@test/eslint-config';

export default [
  ...base({ tsconfigRootDir: import.meta.dirname }),
  // файл вне tsconfig-проекта (include: src)
  untypedFiles(['drizzle.config.ts']),
];
