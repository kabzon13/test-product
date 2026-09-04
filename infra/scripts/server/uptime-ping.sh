#!/bin/sh
# Pull-uptime: cron дёргает локальный /health и пингует healthchecks.io.
# Работает без домена и открытых портов. Если Droplet умер — пинги прекращаются,
# healthchecks.io поднимает тревогу (Grafana умерла бы вместе с сервером).
set -eu

HC_URL=$(grep -E '^HEALTHCHECKS_URL=' /opt/app/.env 2>/dev/null | head -1 | cut -d= -f2- || true)

curl -fsk -m 10 https://localhost/healthz >/dev/null || exit 1

if [ -n "$HC_URL" ]; then
  curl -fsS -m 10 "$HC_URL" >/dev/null || true
fi
