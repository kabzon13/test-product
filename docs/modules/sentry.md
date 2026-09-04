# Модуль: Sentry

Закрывает ошибки фронтенда, которых нет в логах сервера. Бэкенд-ошибки тоже
шлёт — с релизом = git SHA.

## Точки инициализации

- API: `apps/api/src/sentry.ts` (импортируется первым в `main.ts`)
- Web client: `apps/web/sentry.client.config.ts`
- Web server: `apps/web/sentry.server.config.ts` (через `instrumentation.ts`)

Без DSN ничего не инициализируется — модуль можно включить позже одним `.env`.

## Включение

Секреты/`.env`:

```
SENTRY_DSN=https://…@….ingest.sentry.io/…
NEXT_PUBLIC_SENTRY_DSN=…   # может совпадать
```

Релиз проставляется автоматически из `GIT_SHA` (build-arg образа).

## Проверка

Бросить тестовую ошибку в консоли браузера
(`Sentry.captureException(new Error('test'))`) — событие в проекте Sentry
с правильным release.
