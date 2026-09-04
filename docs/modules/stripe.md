# Модуль: Stripe

Billing поверх модуля webhooks.

## Эндпоинты

- `POST /api/v1/billing/checkout` (сессия) → `{url}` Stripe Checkout
- `POST /api/v1/billing/webhook` — приём событий: verify подписи +
  идемпотентность через webhook-модуль

## Настройка

1. Stripe Dashboard: продукт + цена → `STRIPE_PRICE_ID`
2. API key → `STRIPE_SECRET_KEY`
3. Webhook endpoint `https://<домен>/api/v1/billing/webhook`
   (события: `checkout.session.completed`, …) → `STRIPE_WEBHOOK_SECRET`

## Локально

```
docker compose -f docker-compose.dev.yml --profile stripe up stripe-cli
```

stripe-cli форвардит вебхуки на локальный API; webhook secret печатается при старте.

## Где бизнес-логика

`apps/api/src/billing/billing.service.ts`, обработчик
`checkout.session.completed` — точка, где продукт начинает свою логику
(выдача доступа и т.п.).

## Мониторинг

Дашборд Grafana «Billing (Stripe)»: запросы /billing, ошибки вебхуков, события в логах.
