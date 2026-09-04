#!/usr/bin/env bash
# Выполняется НА СЕРВЕРЕ (его копирует workflow). Единственный способ запуска — GitHub Actions.
#
# deploy.sh <git-sha>
#   pull → migrate → up -d → health → smoke → при провале автоматический откат.
# Даунтайм ~5 секунд на up -d — это честно написано в docs/deployment.md.

set -euo pipefail
cd /opt/app

SHA="${1:?usage: deploy.sh <git-sha>}"
RELEASES=/opt/app/releases.log

get_env() { grep -E "^$1=" .env | head -1 | cut -d= -f2- || true; }

IMAGE_PREFIX=$(get_env IMAGE_PREFIX)   # ghcr.io/<owner>/<product>
APP_DOMAIN=$(get_env APP_DOMAIN)
GHCR_USER=$(get_env GHCR_USER)
GHCR_TOKEN=$(get_env GHCR_TOKEN)

[[ -n "$IMAGE_PREFIX" ]] || { echo "IMAGE_PREFIX отсутствует в .env"; exit 1; }

# --- Caddyfile: базовый вход по IP + домен, если задан ---
cat caddy/Caddyfile.ip > caddy/Caddyfile
if [[ -n "$APP_DOMAIN" ]]; then
  cat caddy/Caddyfile.domain >> caddy/Caddyfile
fi

# --- образы: immutable tag = git SHA ---
cat > .env.images <<EOF
WEB_IMAGE=$IMAGE_PREFIX-web:$SHA
API_IMAGE=$IMAGE_PREFIX-api:$SHA
WORKER_IMAGE=$IMAGE_PREFIX-worker:$SHA
EOF

compose() {
  docker compose --env-file .env --env-file .env.images "$@"
}

rollback() {
  local prev
  prev=$(grep -v "^$SHA\$" "$RELEASES" 2>/dev/null | tail -1 || true)
  if [[ -z "$prev" ]]; then
    echo "✗ откатываться некуда (первый деплой)"; exit 1
  fi
  echo "✗ деплой $SHA провалился — откат на $prev"
  exec "$0" "$prev"
}

echo "→ docker login ghcr.io (токен только read:packages)"
echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin

echo "→ pull $SHA"
compose pull

echo "→ миграции (одноразовый контейнер, pg_advisory_lock внутри)"
compose run --rm migrate || rollback

echo "→ up -d"
compose up -d --remove-orphans

echo "→ ждём /health (до 60с)"
for i in $(seq 1 30); do
  if curl -fsk -m 5 https://localhost/healthz >/dev/null 2>&1; then
    HEALTHY=1; break
  fi
  sleep 2
done
[[ -n "${HEALTHY:-}" ]] || rollback

echo "→ smoke"
/opt/app/scripts/smoke.sh "https://localhost" --insecure || rollback

echo "$SHA" >> "$RELEASES"
echo "✔ deploy $SHA ok"
