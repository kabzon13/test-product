# Disaster recovery

## Бэкапы

- **DO Managed PG**: автоматические, 7 дней (внутри DigitalOcean).
- **pg_dump** (cron 03:17 на сервере) → Spaces, retention 30 дней.
  Нужен потому, что бэкапы DO живут внутри DO — при потере доступа к аккаунту
  они недоступны.
- **Staging** — бэкапов нет намеренно: данные одноразовые, окружение сносится
  и пересоздаётся.

## Restore из pg_dump

```bash
# 1. скачать дамп
aws s3 cp s3://<product>-production-backups/pg/db-YYYY-MM-DD.sql.gz . \
  --endpoint-url https://<region>.digitaloceanspaces.com

# 2. залить (в пустую базу или новый кластер)
gunzip -c db-YYYY-MM-DD.sql.gz | psql "$MIGRATE_DATABASE_URL"

# 3. проверить
make smoke ENV=production
```

## Потерян дроплет

1. `make infra-apply ENV=production` — cloud-init поднимет всё заново
2. `make sync-secrets ENV=production`
3. Запустить deploy workflow с последним SHA
4. БД managed — данные не затронуты

## Потерян доступ к DO-аккаунту

pg_dump-и лежат в Spaces (отдельные ключи). Поднять Postgres где угодно,
залить дамп, переключить DNS. Это худший сценарий — инфраструктура
пересоздаётся из `infra/` у любого провайдера с правкой terraform.

## Проверка restore

Restore обязан быть проверен один раз до запуска в прод.

- Дата последней проверки: **не проверялся** ← обновить после проверки
- Кто проверял: —
