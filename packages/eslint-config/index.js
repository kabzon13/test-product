import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import tseslint from 'typescript-eslint';

/**
 * Общий flat config. Приложения импортируют base() и добавляют свою специфику.
 * @param {{ tsconfigRootDir: string }} opts
 */
export function base({ tsconfigRootDir }) {
  return tseslint.config(
    { ignores: ['dist/**', '.next/**', 'node_modules/**', 'coverage/**', 'next-env.d.ts'] },
    js.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    {
      languageOptions: {
        parserOptions: {
          projectService: {
            // конфиг-файлы пакетов (eslint.config.js, next.config.mjs, jest.config.cjs)
            allowDefaultProject: ['*.js', '*.mjs', '*.cjs'],
          },
          tsconfigRootDir,
        },
      },
      plugins: { import: importPlugin },
      rules: {
        'import/order': [
          'error',
          {
            groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
            'newlines-between': 'always',
            alphabetize: { order: 'asc' },
          },
        ],
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
        ],
        '@typescript-eslint/no-floating-promises': 'error',
        // интерфейсные async-методы без await (in-memory реализации) — норма
        '@typescript-eslint/require-await': 'off',
        'no-console': 'error',
        '@typescript-eslint/no-explicit-any': ['error', { ignoreRestArgs: false }],
      },
    },
    {
      // скрипты — там console разрешён
      files: ['**/scripts/**', '**/*.config.*', '**/migrate.ts', '**/seed.ts', '**/reset.ts'],
      rules: { 'no-console': 'off' },
    },
    {
      // JS-конфиги линтим без type-информации
      files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
      ...tseslint.configs.disableTypeChecked,
      languageOptions: {
        globals: {
          process: 'readonly',
          console: 'readonly',
          __dirname: 'readonly',
          module: 'writable',
          require: 'readonly',
        },
      },
    },
  );
}

/** TS-файлы вне tsconfig-проекта (drizzle.config.ts и т.п.): линт без type-информации. */
export function untypedFiles(files) {
  return {
    files,
    ...tseslint.configs.disableTypeChecked,
  };
}

/** Запрет app/api/* в Next.js: этот путь занят бэкендом (same-origin). */
export const noNextApiRoutes = {
  files: ['app/api/**', 'src/app/api/**'],
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: 'Program',
        message:
          'app/api/* запрещён: путь /api/* занят NestJS (same-origin). Роуты API живут в apps/api.',
      },
    ],
  },
};

/** Запрет ручного редактирования сгенерированного клиента. */
export const noEditGeneratedClient = {
  files: ['packages/api-client/src/types.ts'],
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: 'Program',
        message: 'Файл генерируется. Запусти make gen-api, руками не править.',
      },
    ],
  },
};
