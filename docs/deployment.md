# Деплой

Единственный путь — GitHub Actions. Локальных деплой-скриптов, которые ходят
на сервер, нет.

## Конвейер

```
push в main
  → lint / typecheck / tests / OpenAPI drift / e2e
  → docker build, tag = git SHA (immutable)
  → push в GHCR
  → deploy staging (автоматически)
  → deploy production (после ручного подтверждения в GitHub Environment)
```

## Шаг деплоя (deploy.yml → infra/scripts/deploy.sh на сервере)

```
рендер .env из секретов Environment
  → scp на сервер (0600, владелец deploy)
  → docker compose pull
  → одноразовый контейнер: миграции под pg_advisory_lock
  → docker compose up -d
  → ждать /health
  → smoke-тест
  → при провале — автоматический откат на предыдущий SHA
```

## Даунтайм

**~5 секунд** на `docker compose up -d` (одна реплика, без blue/green).
Это осознанное решение. Zero downtime здесь не обещается.

## Миграции

Expand/contract: новая колонка → деплой кода → удаление старой в следующем релизе.
Откат кода не требует отката схемы. Файлы миграций лежат внутри production-образа.

## Вручную задеплоить конкретный SHA

Workflow `deploy` → Run workflow → выбрать окружение и SHA.
