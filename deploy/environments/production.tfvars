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
admin_ips     = ["18.197.44.72/32", "87.228.170.196/32"]
ssh_allow_ips = ["18.197.44.72/32", "87.228.170.196/32"]

# ssh_public_key добавляет make infra-bootstrap
ssh_public_key = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPoWKrd7gbSfamX/YwJprpkzhi7s/4aYrij699/yNV7T deploy-production"
