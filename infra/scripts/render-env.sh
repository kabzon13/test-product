#!/usr/bin/env bash
# Рендер .env для сервера: deploy/environments/<env>.env + секреты из окружения CI.
# Вызывается из GitHub Actions. Вывод — в stdout.

set -euo pipefail
cd "$(dirname "$0")/../.."

ENV="${1:?usage: render-env.sh <env>}"
ENV_FILE="deploy/environments/$ENV.env"
[[ -f "$ENV_FILE" ]] || { echo "нет $ENV_FILE" >&2; exit 1; }

cat "$ENV_FILE"
echo
echo "# --- рендер из GitHub Environment ($ENV) ---"

APP_DOMAIN=$(grep -E '^APP_DOMAIN=' "$ENV_FILE" | cut -d= -f2- || true)

# PUBLIC_URL: домен, а без него — IP (ссылки в письмах, OAuth-редиректы)
if [[ -n "$APP_DOMAIN" ]]; then
  echo "PUBLIC_URL=https://$APP_DOMAIN"
else
  echo "PUBLIC_URL=https://${DROPLET_IP:?DROPLET_IP не задан}"
fi

# staging: БД в контейнере — строки подключения собираются из паролей
if [[ -z "${DATABASE_URL:-}" && -n "${APP_USER_PASSWORD:-}" ]]; then
  echo "DATABASE_URL=postgres://app_user:${APP_USER_PASSWORD}@postgres:5432/app"
  echo "MIGRATE_DATABASE_URL=postgres://migrator:${MIGRATOR_PASSWORD:?}@postgres:5432/app"
fi

emit() {
  local name="$1"
  local val="${!name:-}"
  [[ -n "$val" ]] && echo "$name=$val" || true
}

emit IMAGE_PREFIX
emit DROPLET_IP
emit DATABASE_URL
emit MIGRATE_DATABASE_URL
emit POSTGRES_PASSWORD
emit MIGRATOR_PASSWORD
emit APP_USER_PASSWORD
emit GRAFANA_ADMIN_PASSWORD
emit GHCR_USER
emit GHCR_TOKEN
emit SPACES_ACCESS_KEY_ID
emit SPACES_SECRET_ACCESS_KEY
emit BACKUPS_BUCKET
emit BACKUPS_ENDPOINT
emit HEALTHCHECKS_URL
emit ALERT_TELEGRAM_BOT_TOKEN
emit ALERT_TELEGRAM_CHAT_ID
emit ALERT_EMAIL_TO
emit RESEND_API_KEY
emit GOOGLE_CLIENT_ID
emit GOOGLE_CLIENT_SECRET
emit STRIPE_SECRET_KEY
emit STRIPE_WEBHOOK_SECRET
emit STRIPE_PRICE_ID
emit SENTRY_DSN
emit NEXT_PUBLIC_SENTRY_DSN
emit OTEL_EXPORTER_OTLP_ENDPOINT
emit GIT_SHA
