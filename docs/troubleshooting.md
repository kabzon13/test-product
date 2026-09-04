# Troubleshooting

Каждый алерт Grafana ссылается на раздел здесь. Начало любого разбора:

```
ssh -N -L 3001:localhost:3001 deploy@<reserved-ip>   # Grafana → http://localhost:3001
```

Дашборд Logs → фильтр по level=50 → кликнуть requestId → все записи запроса.

## API недоступен

1. `ssh deploy@<ip> docker ps` — контейнер api жив?
2. `docker logs <product>-api-1 --tail 100` — падает на старте? Чаще всего — невалидный конфиг (fail-fast пишет, какая переменная).
3. `docker compose -f /opt/app/docker-compose.yml --env-file /opt/app/.env --env-file /opt/app/.env.images up -d api`
4. Не помогает — rollback на предыдущий SHA (workflow rollback).

## Web недоступен

Как выше, но контейнер web. Если api жив, а web нет — чаще всего упала сборка/страница: смотреть логи web.

## 5xx

1. Дашборд API → какой маршрут даёт 5xx.
2. Logs → level=50 за тот же период → requestId → полная цепочка.
3. Частые причины: БД (см. PostgreSQL ниже), внешний API, недавний деплой → rollback.

## Медленный API

1. Дашборд API → p95 по маршрутам — кто именно медленный.
2. Дашборд PostgreSQL → блокировки, max tx duration.
3. Дашборд Node.js → event loop lag (CPU-bound код), heap (утечка).

## Диск

1. `ssh deploy@<ip> df -h /`
2. Обычные виновники: docker-образы → `docker system prune -af --volumes=false`; логи → ротация уже стоит, проверить `/var/log`.
3. Prometheus/Loki имеют лимиты retention — если растут, проверить их volume: `docker system df -v`.

## PostgreSQL

1. Managed: панель DO → Databases → состояние кластера.
2. Staging (контейнер): `docker logs <product>-postgres-1`.
3. Приложение не коннектится, но БД жива → проверить trusted sources (firewall БД) и `DATABASE_URL` в `/opt/app/.env`.

## Рестарты

1. `docker ps -a` — какой контейнер рестартует.
2. `docker logs <container> --tail 200` — причина обычно в последних строках перед смертью (OOM, конфиг, зависимость).
3. OOM → дашборд Host & Docker → память контейнеров. Swap 2 ГБ уже есть; если стабильно упирается — увеличить дроплет.

## Сертификат

Метрика `ssl_cert_expiry_seconds` пишется cron-скриптом.
Origin CA живёт 15 лет — если алерт сработал, вероятнее проблема с edge-сертификатом Cloudflare (панель → SSL/TLS) или в `/opt/app/certs` лежит не тот файл.

## Алерты не приходят

1. `ALERT_CHANNEL`, `ALERT_TELEGRAM_*` в `/opt/app/.env` заданы?
2. Grafana (туннель) → Alerting → Contact points → Test.

## Uptime (healthchecks.io молчит/паникует)

1. Пинги шлёт cron на сервере: `sudo grep app /etc/cron.d/app`, скрипт `/opt/app/scripts/uptime-ping.sh`.
2. Сервер умер целиком → `make infra-apply` пересоздаст, затем deploy (docs/disaster-recovery.md).
