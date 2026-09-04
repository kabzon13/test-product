# test

Веб-продукт: Next.js + NestJS + PostgreSQL. Same-origin за Caddy, деплой на DigitalOcean.

Профиль: `full` · регион: `fra1` · домен не задан — доступ по IP

## Quick start

```
make dev
```

- http://localhost:8080 — приложение
- http://localhost:8080/api/v1 — API
- http://localhost:8080/api/docs — Swagger (в проде выключен)
- http://localhost:8025 — Mailpit (письма)

Dev-логин после `make db-seed`: `dev@example.com` / `password`.

## Команды

`make help` показывает всё. Основное:

| Команда | Что делает |
|---|---|
| `make dev` | инфра в Docker + приложения на хосте |
| `make test` / `make e2e` | unit / Playwright |
| `make db-migrate` / `make db-reset` | миграции / полный сброс |
| `make gen-api` | openapi.json + typed client |
| `make infra-apply ENV=staging` | поднять окружение в DigitalOcean |
| `make infra-destroy ENV=staging` | снести staging (деньги не тратятся) |
| `make setup-check` | что ещё не настроено |

Деплой и rollback — только через GitHub Actions. Локальных команд для них нет.

## Архитектура

```
браузер → Cloudflare → Caddy:443 ┬ /api/* → NestJS (api:3000)
                                 └ остальное → Next.js (web:3000)
PostgreSQL · worker (pg-boss) · Redis · S3
мониторинг: Grafana + Prometheus + Loki + Alloy (на том же Droplet)
```

Деплой: `git push` → CI → образы в GHCR → staging автоматически → production после подтверждения. Даунтайм деплоя ~5 секунд.

## Что нужно сделать руками

Инфраструктуры ещё не существует. После `make infra-bootstrap` и `make infra-apply` останется:

1. GitHub: создать Environments staging/production, secrets — make setup-check покажет список
2. Домен не задан: сайт будет доступен по IP; домен вписывается позже в deploy/environments/*.env
3. healthchecks.io: создать check, URL → секрет HEALTHCHECKS_URL
4. Resend: аккаунт + API key → секрет RESEND_API_KEY
5. Google OAuth: client id/secret → GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET (нужен публичный HTTPS-домен)
6. Stripe: продукт, цена, webhook → STRIPE_SECRET_KEY/STRIPE_WEBHOOK_SECRET/STRIPE_PRICE_ID
7. Sentry: проект + DSN → SENTRY_DSN/NEXT_PUBLIC_SENTRY_DSN

Пошагово: [docs/setup-checklist.md](docs/setup-checklist.md). Проверка: `make setup-check`.

## Docs

- [docs/infrastructure.md](docs/infrastructure.md) — что создаёт OpenTofu
- [docs/deployment.md](docs/deployment.md) — как устроен деплой (включая честный даунтайм)
- [docs/observability.md](docs/observability.md) — дашборды, логи, алерты: что смотреть и на что реагировать
- [docs/access.md](docs/access.md) — firewall, доступ по IP, SSH-туннели
- [docs/troubleshooting.md](docs/troubleshooting.md) — что делать при алертах
- [docs/modules/](docs/modules/) — включённые модули
