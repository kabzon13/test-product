#!/usr/bin/env bash
# Один раз на продукт: бакет под tfstate + SSH-ключи деплоя для каждого окружения.
# Идемпотентно: существующее не пересоздаётся.
#
# Требует: aws-cli (Spaces = S3 API; doctl бакеты создавать не умеет), gh, ssh-keygen.
# Ключи Spaces в окружении: SPACES_ACCESS_KEY_ID, SPACES_SECRET_ACCESS_KEY.

set -euo pipefail
cd "$(dirname "$0")/../.."

BACKEND_FILE="deploy/backend.hcl"

if [[ -z "${SPACES_ACCESS_KEY_ID:-}" || -z "${SPACES_SECRET_ACCESS_KEY:-}" ]]; then
  echo "Нужны SPACES_ACCESS_KEY_ID и SPACES_SECRET_ACCESS_KEY (DigitalOcean → API → Spaces Keys)" >&2
  exit 1
fi

# --- 1. deploy/backend.hcl ---

if [[ ! -f "$BACKEND_FILE" ]]; then
  read -rp "Имя Spaces-бакета для tfstate (один на все продукты): " BUCKET
  read -rp "Регион Spaces [fra1]: " SPACES_REGION
  SPACES_REGION="${SPACES_REGION:-fra1}"
  cat > "$BACKEND_FILE" <<EOF
bucket                      = "$BUCKET"
region                      = "us-east-1"
endpoints                   = { s3 = "https://$SPACES_REGION.digitaloceanspaces.com" }
skip_credentials_validation = true
skip_metadata_api_check     = true
skip_requesting_account_id  = true
skip_region_validation      = true
skip_s3_checksum            = true
use_path_style              = false
EOF
  echo "✔ $BACKEND_FILE создан"
else
  BUCKET=$(grep -E '^bucket' "$BACKEND_FILE" | sed 's/.*"\(.*\)".*/\1/')
  SPACES_REGION=$(grep -oE '[a-z]{3}[0-9]\.digitaloceanspaces' "$BACKEND_FILE" | cut -d. -f1)
  echo "✔ $BACKEND_FILE уже есть (bucket: $BUCKET)"
fi

ENDPOINT="https://$SPACES_REGION.digitaloceanspaces.com"
export AWS_ACCESS_KEY_ID="$SPACES_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="$SPACES_SECRET_ACCESS_KEY"

# --- 2. бакет tfstate (versioning включён, приватный) ---

if aws s3api head-bucket --bucket "$BUCKET" --endpoint-url "$ENDPOINT" 2>/dev/null; then
  echo "✔ бакет $BUCKET уже существует"
else
  aws s3api create-bucket --bucket "$BUCKET" --endpoint-url "$ENDPOINT" --acl private
  echo "✔ бакет $BUCKET создан"
fi
aws s3api put-bucket-versioning --bucket "$BUCKET" --endpoint-url "$ENDPOINT" \
  --versioning-configuration Status=Enabled
echo "✔ versioning включён"

# --- 3. SSH-ключи деплоя: свой на окружение, приватный только в GitHub ---

for ENV in staging production; do
  TFVARS="deploy/environments/$ENV.tfvars"
  if grep -qE '^ssh_public_key\s*=\s*"ssh-' "$TFVARS" 2>/dev/null; then
    echo "✔ $ENV: ssh_public_key уже задан"
    continue
  fi
  TMP=$(mktemp -d)
  ssh-keygen -t ed25519 -N '' -C "deploy-$ENV" -f "$TMP/key" >/dev/null
  gh secret set DEPLOY_SSH_KEY --env "$ENV" < "$TMP/key"
  PUB=$(cat "$TMP/key.pub")
  if grep -qE '^ssh_public_key' "$TFVARS" 2>/dev/null; then
    sed -i.bak "s|^ssh_public_key.*|ssh_public_key = \"$PUB\"|" "$TFVARS" && rm -f "$TFVARS.bak"
  else
    echo "ssh_public_key = \"$PUB\"" >> "$TFVARS"
  fi
  rm -rf "$TMP"
  echo "✔ $ENV: ключ сгенерирован, приватный ушёл в GitHub Environment, локально не хранится"
done

echo
echo "Готово. Дальше: make infra-plan ENV=staging"
