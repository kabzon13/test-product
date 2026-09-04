# Setup checklist — test

Пошагово от нуля до production. Проверка прогресса: `make setup-check`.

## 1. Один раз на аккаунт (не на продукт)

- [ ] Аккаунт DigitalOcean + API-токен (Write) → env `DIGITALOCEAN_TOKEN`
- [ ] Spaces keys → env `SPACES_ACCESS_KEY_ID`, `SPACES_SECRET_ACCESS_KEY`

## 2. Bootstrap

- [ ] `gh auth login` (GitHub CLI)
- [ ] `make infra-bootstrap` — бакет tfstate + SSH-ключи деплоя (приватные сразу уходят в GitHub Environments)
- [ ] В GitHub создать Environments `staging` и `production`; на production включить required reviewers — это и есть ручное подтверждение деплоя

## 3. Секреты GitHub Environments (для каждого окружения)

- [ ] `GHCR_TOKEN` — токен только с `read:packages`, привязанный к продукту (не личный)
- [ ] `GRAFANA_ADMIN_PASSWORD` — сгенерировать: `openssl rand -base64 24`
- [ ] `HEALTHCHECKS_URL` — check на healthchecks.io (pull-uptime)
- [ ] `ALERT_TELEGRAM_BOT_TOKEN` + `ALERT_TELEGRAM_CHAT_ID` (или `ALERT_EMAIL_TO`)
- [ ] staging: `POSTGRES_PASSWORD`, `MIGRATOR_PASSWORD`, `APP_USER_PASSWORD` (БД в контейнере)
- [ ] `RESEND_API_KEY` — если EMAIL_PROVIDER=resend
- [ ] `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — redirect URI: `https:///api/v1/auth/oauth/google/callback`. ⚠️ OAuth не работает без публичного HTTPS-домена (самоподписанный сертификат провайдеры не принимают)
- [ ] Stripe: продукт + цена + webhook на `https:///api/v1/billing/webhook` → `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`
- [ ] Sentry: проект → `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`

## 4. Инфраструктура

- [ ] `make infra-plan ENV=staging` — посмотреть, что создастся
- [ ] `make infra-apply ENV=staging`
- [ ] `make sync-secrets ENV=staging` — выходы tofu → GitHub Environment
- [ ] То же для production

## 5. Без домена

Сайт будет доступен по `https://<reserved-ip>` с самоподписанным сертификатом — браузер покажет предупреждение, это ожидаемо. Когда домен появится: вписать в `deploy/environments/production.env` и `production.tfvars`, добавить Origin CA в секреты, `make infra-apply ENV=production`, затем закрыть прямой вход (`admin_ips = []`).

## 6. Первый деплой

- [ ] `git push` в main → CI соберёт образы → staging задеплоится автоматически
- [ ] Проверить staging: `make smoke ENV=staging` (или `bash infra/scripts/smoke.sh https://<ip> --insecure`)
- [ ] Подтвердить production в GitHub Actions
- [ ] Проверить алерт искусственным срабатыванием (например, остановить api-контейнер на минуту)
- [ ] Выполнить и проверить rollback (workflow rollback, предыдущий SHA)

## 7. После появления домена

- [ ] Домен в `production.env` + `production.tfvars` (+ zone id), Origin CA в секреты
- [ ] `make infra-apply ENV=production` — создаст DNS-запись
- [ ] Закрыть прямой вход: `admin_ips = []` + `make infra-apply` (SSH останется — переменные разделены)
