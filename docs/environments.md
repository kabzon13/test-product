# Окружения

Окружение = два файла + GitHub Environment с тем же именем. Кода не трогать.

```
deploy/environments/
  staging.tfvars       регион, размер дроплета, размер БД
  staging.env          домен, публичные переменные
  production.tfvars
  production.env
```

Секретов в этих файлах нет — они в GitHub Environment.

## Добавить окружение (например, preview)

1. Скопировать пару `staging.tfvars` + `staging.env` под новым именем
2. Создать GitHub Environment `preview`, положить секреты
3. `make infra-apply ENV=preview`
4. `make sync-secrets ENV=preview`
5. Деплой: workflow deploy → Run workflow → preview

## Отличия staging от production

|                | staging                                 | production                  |
| -------------- | --------------------------------------- | --------------------------- |
| PostgreSQL     | контейнер (`COMPOSE_PROFILES=local-db`) | DO Managed                  |
| Бэкапы         | нет, намеренно                          | DO 7 дней + pg_dump 30 дней |
| Жизненный цикл | поднимается/сносится командой           | всегда включён              |
| Деплой         | автоматически с main                    | после подтверждения         |
