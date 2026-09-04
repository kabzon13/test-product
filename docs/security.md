# Security

## Auth

- Opaque session token (32 случайных байта) в httpOnly cookie `__Host-session`,
  Secure, SameSite=Lax, host-only. В БД — только sha256 токена.
- Без JWT и refresh-токенов. Сессии в Postgres, отзываются мгновенно.
- Пароли: argon2id. Смена пароля инвалидирует все сессии.
- CSRF: SameSite=Lax + проверка Origin на unsafe-методах.
- Одноразовые токены (verify email, password reset) — отдельная таблица
  `auth_tokens` с `used_at` и `expires_at`, в БД только хэши.

## Сеть

- 80 закрыт. 443 — только Cloudflare и `admin_ips`. 22 — только `ssh_allow_ips`.
- PG/Redis наружу не смотрят (Docker-сеть/VPC, портов на хосте нет).
- Grafana слушает 127.0.0.1 — доступ только SSH-туннелем.
- Cloudflare Full (strict) + Origin CA. Реальный IP клиента — из `CF-Connecting-IP`
  (Caddy `trusted_proxies`).

## БД

- `app_user` — только DML, не владелец таблиц. `migrator` — владелец, только миграции.
- Managed PG принимает соединения только с дроплета (trusted sources).

## Секреты

- Живут в GitHub Environments. В репозитории секретов нет.
- `.env` на сервере: 0600, владелец `deploy`.
- SSH-ключ деплоя: свой на окружение, ограничен
  `no-agent-forwarding,no-X11-forwarding,no-pty`. Ротация: docs/secrets — см. access.md.
- GHCR-токен — только `read:packages`.

## Приложение

- Валидация конфига zod, fail-fast: с кривым окружением процесс не стартует.
- Валидация входных данных class-validator, whitelist: true.
- Контейнеры non-root, immutable-теги образов (git SHA).
- Логи не содержат cookie/authorization (redact в pino).
