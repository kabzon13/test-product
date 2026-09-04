# Production: Droplet + DigitalOcean Managed PostgreSQL.

region       = "fra1"
droplet_size = "s-2vcpu-4gb"

managed_db            = true
db_size               = "db-s-1vcpu-1gb"
enable_backups_bucket = true

# Домен появился → вписать сюда + zone id, затем make infra-apply ENV=production
app_domain         = ""
cloudflare_zone_id = ""

# После запуска домена прямой вход закрывают: admin_ips = []
# (SSH при этом остаётся — переменные разделены намеренно, см. docs/access.md)
admin_ips     = []
ssh_allow_ips = []

# ssh_public_key добавляет make infra-bootstrap
