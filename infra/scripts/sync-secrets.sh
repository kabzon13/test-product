#!/usr/bin/env bash
# Выходы tofu → GitHub Environment. Копировать строки подключения руками не нужно.
#   make sync-secrets ENV=staging

set -euo pipefail
cd "$(dirname "$0")/../.."

ENV="${1:?usage: sync-secrets.sh <env>}"
PRODUCT=$(grep -E '^PRODUCT' Makefile | head -1 | awk '{print $3}')

command -v gh >/dev/null || { echo "нужен gh (GitHub CLI), авторизованный в репозитории"; exit 1; }

TF="tofu -chdir=infra/terraform"
$TF init -reconfigure \
  -backend-config=../../deploy/backend.hcl \
  -backend-config="key=tf-state/$PRODUCT/$ENV.tfstate" >/dev/null

json=$($TF output -json)

get() { echo "$json" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const o=JSON.parse(d);process.stdout.write(o['$1']?.value ?? '')})"; }

DROPLET_IP=$(get droplet_ip)
DATABASE_URL=$(get database_url)
MIGRATE_DATABASE_URL=$(get migrate_database_url)
BACKUPS_BUCKET=$(get backups_bucket)
BACKUPS_ENDPOINT=$(get backups_bucket_endpoint)

[[ -n "$DROPLET_IP" ]] || { echo "нет droplet_ip — сначала make infra-apply ENV=$ENV"; exit 1; }

gh variable set DROPLET_IP --env "$ENV" --body "$DROPLET_IP"
echo "✔ DROPLET_IP=$DROPLET_IP"

if [[ -n "$DATABASE_URL" ]]; then
  gh secret set DATABASE_URL --env "$ENV" --body "$DATABASE_URL"
  gh secret set MIGRATE_DATABASE_URL --env "$ENV" --body "$MIGRATE_DATABASE_URL"
  echo "✔ DATABASE_URL, MIGRATE_DATABASE_URL"
else
  echo "· managed_db выключен ($ENV): DATABASE_URL задаётся паролями Postgres-контейнера"
fi

if [[ -n "$BACKUPS_BUCKET" ]]; then
  gh variable set BACKUPS_BUCKET --env "$ENV" --body "$BACKUPS_BUCKET"
  gh variable set BACKUPS_ENDPOINT --env "$ENV" --body "$BACKUPS_ENDPOINT"
  echo "✔ BACKUPS_BUCKET=$BACKUPS_BUCKET"
fi

echo "✔ sync-secrets ($ENV) готово"
