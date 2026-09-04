#!/usr/bin/env bash
# Выполняется НА СЕРВЕРЕ через workflow rollback (workflow_dispatch с параметром SHA).
# Миграции expand/contract — откат кода не требует отката схемы.

set -euo pipefail

SHA="${1:?usage: rollback.sh <git-sha>}"
echo "→ rollback на $SHA"
exec /opt/app/scripts/deploy.sh "$SHA"
