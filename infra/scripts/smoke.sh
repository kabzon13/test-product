#!/usr/bin/env bash
# Smoke-тест: сайт жив, API жив, авторизация закрыта.
#   smoke.sh https://example.com
#   smoke.sh https://<reserved-ip> --insecure   # пока нет домена
#   smoke.sh staging                            # возьмёт APP_DOMAIN из deploy/environments/staging.env

set -euo pipefail

TARGET="${1:?usage: smoke.sh <base-url|env> [--insecure]}"
INSECURE="${2:-}"

if [[ "$TARGET" != http* ]]; then
  ENV_FILE="$(dirname "$0")/../../deploy/environments/$TARGET.env"
  DOMAIN=$(grep -E '^APP_DOMAIN=' "$ENV_FILE" | cut -d= -f2- || true)
  if [[ -z "$DOMAIN" ]]; then
    echo "APP_DOMAIN пуст в $ENV_FILE — передай URL явно: smoke.sh https://<ip> --insecure" >&2
    exit 1
  fi
  TARGET="https://$DOMAIN"
fi

CURL=(curl -fsS -m 10)
[[ "$INSECURE" == "--insecure" ]] && CURL+=(-k)

fail() { echo "✗ smoke: $1"; exit 1; }

"${CURL[@]}" "$TARGET/healthz" | grep -q '"status":"ok"' || fail "/healthz не ok"
"${CURL[@]}" "$TARGET/" -o /dev/null || fail "/ не отвечает"
CODE=$("${CURL[@]}" -o /dev/null -w '%{http_code}' "$TARGET/api/v1/auth/me" || true)
[[ "$CODE" == "401" ]] || fail "/api/v1/auth/me без куки должен отдавать 401, получено: $CODE"

echo "✔ smoke ok: $TARGET"
