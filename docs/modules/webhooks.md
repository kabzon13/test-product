# Модуль: Webhooks

Приём внешних событий: verify подписи (на стороне вызывающего модуля),
идемпотентность, хранение, статус обработки.

## Как работает

`WebhooksService.handleOnce(source, externalId, type, payload, handler)`:

1. INSERT в `webhook_events` c `ON CONFLICT (source, external_id) DO NOTHING`
2. дубликат → выход (обработка ровно один раз)
3. новый → выполняется handler → статус `processed` / `failed` + текст ошибки

## Таблица

`webhook_events`: source, external_id (уникальны вместе), type, payload jsonb,
status (`received | processed | failed`), error, received_at, processed_at.

## Использование

Stripe-модуль — готовый пример: `apps/api/src/billing/billing.service.ts`
верифицирует подпись и передаёт событие в `handleOnce`.

## Разбор проблем

`SELECT * FROM webhook_events WHERE status = 'failed' ORDER BY received_at DESC;`
— payload сохранён, обработку можно повторить вручную после фикса.
