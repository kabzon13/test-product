#!/bin/sh
# pg_dump раз в сутки → Spaces, retention 30 дней.
# Нужен потому, что бэкапы DO живут внутри DO: при потере доступа к аккаунту они недоступны.
set -eu

get() { grep -E "^$1=" /opt/app/.env | head -1 | cut -d= -f2- || true; }

DATABASE_URL=$(get DATABASE_URL)
BUCKET=$(get BACKUPS_BUCKET)
ENDPOINT=$(get BACKUPS_ENDPOINT)
KEY_ID=$(get SPACES_ACCESS_KEY_ID)
KEY_SECRET=$(get SPACES_SECRET_ACCESS_KEY)

[ -n "$BUCKET" ] || { echo "BACKUPS_BUCKET не задан — бэкап пропущен"; exit 0; }

STAMP=$(date +%Y-%m-%d)
FILE="/tmp/db-$STAMP.sql.gz"

docker run --rm --network host postgres:16-alpine pg_dump "$DATABASE_URL" | gzip > "$FILE"

docker run --rm --network host -v /tmp:/tmp \
  -e AWS_ACCESS_KEY_ID="$KEY_ID" -e AWS_SECRET_ACCESS_KEY="$KEY_SECRET" \
  amazon/aws-cli s3 cp "$FILE" "s3://$BUCKET/pg/db-$STAMP.sql.gz" --endpoint-url "$ENDPOINT"

rm -f "$FILE"

# retention 30 дней
CUTOFF=$(date -d '30 days ago' +%Y-%m-%d)
docker run --rm --network host \
  -e AWS_ACCESS_KEY_ID="$KEY_ID" -e AWS_SECRET_ACCESS_KEY="$KEY_SECRET" \
  amazon/aws-cli s3 ls "s3://$BUCKET/pg/" --endpoint-url "$ENDPOINT" \
  | awk '{print $NF}' | grep -E '^db-[0-9-]+\.sql\.gz$' | while read -r f; do
      d=$(echo "$f" | sed 's/^db-//; s/\.sql\.gz$//')
      if [ "$d" \< "$CUTOFF" ]; then
        docker run --rm --network host \
          -e AWS_ACCESS_KEY_ID="$KEY_ID" -e AWS_SECRET_ACCESS_KEY="$KEY_SECRET" \
          amazon/aws-cli s3 rm "s3://$BUCKET/pg/$f" --endpoint-url "$ENDPOINT"
      fi
    done

echo "✔ backup db-$STAMP.sql.gz"
