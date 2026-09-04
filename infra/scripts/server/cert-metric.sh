#!/bin/sh
# Пишет срок действия сертификата в textfile-метрику node_exporter.
# Алерт cert-expiry в Grafana читает ssl_cert_expiry_seconds.
set -eu

DOMAIN=$(grep -E '^APP_DOMAIN=' /opt/app/.env 2>/dev/null | head -1 | cut -d= -f2- || true)
[ -n "$DOMAIN" ] || exit 0

END=$(echo | openssl s_client -servername "$DOMAIN" -connect localhost:443 2>/dev/null \
  | openssl x509 -noout -enddate | cut -d= -f2)
END_TS=$(date -d "$END" +%s)
NOW_TS=$(date +%s)

echo "ssl_cert_expiry_seconds $((END_TS - NOW_TS))" > /var/lib/node_exporter/textfile/cert.prom
