# Staging: полный независимый набор ресурсов.
# Поднимается и сносится командой:
#   make infra-apply   ENV=staging
#   make infra-destroy ENV=staging   # не нужен — деньги не тратятся

region       = "fra1"
droplet_size = "s-2vcpu-4gb"

# PostgreSQL в контейнере, бэкапов нет намеренно — данные одноразовые
managed_db            = false
enable_backups_bucket = false

app_domain         = ""
cloudflare_zone_id = ""

# Заполняет визард (текущий IP определяется автоматически).
# admin_ips     — прямой вход на 443 мимо Cloudflare
# ssh_allow_ips — SSH; отдельная переменная, чтобы закрытие сайта не отрезало SSH
admin_ips     = []
ssh_allow_ips = []

# ssh_public_key добавляет make infra-bootstrap
