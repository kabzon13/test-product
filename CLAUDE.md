# test

Next.js (apps/web) + NestJS (apps/api) + PostgreSQL + Drizzle. Same-origin: `/api/v1/*` → NestJS, остальное → Next.js, роутит Caddy.
Профиль: full. Storage: S3/MinIO. Очередь: pg-boss (apps/worker). Кэш: Redis. Billing: Stripe.
Окружения: staging, production (deploy/environments/).

## Команды

| Команда | Что делает |
|---|---|
| `make dev` | инфра в Docker, приложения на хосте |
| `make test` / `make e2e` / `make lint` / `make typecheck` | проверки |
| `make db-migrate` / `make db-seed` / `make db-reset` | база |
| `make gen-api` | openapi.json + клиент (после изменения API) |
| `make observability` | локальная Grafana на :3001 |
| `make infra-plan/apply/destroy ENV=…` | инфраструктура |

Ничего не запускать в обход Makefile.

## Куда смотреть

| Вопрос | Файл |
|---|---|
| Роуты API | apps/api/src/*/**.controller.ts |
| Схема БД | apps/api/src/db/schema.ts, миграции: apps/api/migrations/ |
| Авторизация | apps/api/src/auth/ (opaque session в httpOnly cookie) |
| Конфиг окружения | packages/config/src/*.ts (zod, fail-fast) |
| Деплой | .github/workflows/, infra/scripts/deploy.sh |
| Инфраструктура | infra/terraform/ |
| Дашборды/алерты | docs/observability.md (что смотреть), infra/observability/grafana/ (конфиги) |

## Правила

- Схему БД менять только миграцией, файлы миграций не редактировать
- Секреты не писать в код и не коммитить
- Версии зависимостей только фиксированные — никаких `^` и `~` в package.json (`.npmrc`: save-exact=true)
- Commit-сообщения без упоминаний ИИ: никаких `Co-Authored-By: Claude` и `Generated with Claude Code`
- openapi.json и packages/api-client не править руками — только `make gen-api`
- Деплой только через Actions, ssh на сервер руками не ходить
- Firewall не править из панели DigitalOcean — только через tfvars и `make infra-apply`
- `admin_ips` и `ssh_allow_ips` не объединять: обнуление первой не должно отрезать SSH
- `app/api/*` в Next.js запрещён — путь /api/* занят бэкендом

## Сетевой доступ

Домена нет: прямой вход по IP открыт (самоподписанный сертификат). Когда домен появится — вписать в deploy/environments/production.env и tfvars, добавить Origin CA в секреты, потом закрыть прямой вход: `admin_ips = []` + `make infra-apply`.
Обход Cloudflare без открытия firewall: `ssh -N -L 8443:localhost:443 deploy@<ip>`. Grafana — тем же туннелем (`-L 3001:localhost:3001`).
Подробности: docs/access.md и .claude/commands/access.md.

## Если спрашивают «что дальше делать»

1. `make setup-check` — покажет незакрытые шаги
2. docs/setup-checklist.md — пошагово
3. docs/troubleshooting.md — если что-то сломалось

Не угадывать по коду, читать эти три источника.
