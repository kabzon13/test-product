# Инфраструктура

Всё, что DO позволяет создать через API, создаёт OpenTofu (`infra/terraform/`).
Руками в панели — ничего, кроме аккаунта и токенов.

## Что создаётся на окружение

| Ресурс             | Зачем                                                                   |
| ------------------ | ----------------------------------------------------------------------- |
| Project + tags     | группировка ресурсов окружения                                          |
| VPC                | приложение ходит в БД по приватной сети                                 |
| Droplet            | Ubuntu 24.04, cloud-init: Docker, deploy-user, log rotation, swap, cron |
| Reserved IP        | пересоздание дроплета не трогает DNS                                    |
| Cloud Firewall     | 443 ← Cloudflare + `admin_ips`; 22 ← `ssh_allow_ips`; 80 закрыт         |
| Managed PostgreSQL | только production (`managed_db = true`)                                 |
| Spaces bucket      | бэкапы pg_dump (только production)                                      |
| Cloudflare DNS     | A-запись на Reserved IP, proxied — только если задан домен              |

Каждое окружение — полный независимый набор. Общих серверов между продуктами нет.

## Staging включается и выключается командой

```
make infra-apply   ENV=staging     # нужен для проверки релиза
make infra-destroy ENV=staging     # не нужен — деньги не тратятся
```

Не держать staging постоянно. Он воссоздаётся за ~10 минут из того же кода.

## tfstate

Бакет один на все продукты (создаёт `make infra-bootstrap`), ключи разведены:
`tf-state/<product>/<env>.tfstate`. Versioning включён, бакет приватный.

## Диапазоны Cloudflare

Firewall тянет список из `https://www.cloudflare.com/ips-v4` при каждом apply.
Раз в месяц workflow `infra-drift` делает plan и открывает issue при расхождении.
Лечится обычно так: `make infra-apply ENV=production`.

## Обслуживание сервера (cloud-init)

unattended-upgrades (security-патчи), chrony (NTP), swap 2 ГБ,
docker log rotation (`max-size 10m`, `max-file 3`).
