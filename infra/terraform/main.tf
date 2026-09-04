locals {
  name = "${var.product}-${var.env}"

  # Диапазоны Cloudflare тянутся при каждом apply — не хардкодятся
  cloudflare_ips = [
    for ip in split("\n", trimspace(data.http.cloudflare_ips_v4.response_body)) : ip if ip != ""
  ]

  https_sources = concat(local.cloudflare_ips, var.admin_ips)
}

data "http" "cloudflare_ips_v4" {
  url = "https://www.cloudflare.com/ips-v4"
}

# --- Project + группировка ---

resource "digitalocean_project" "this" {
  name        = local.name
  environment = var.env == "production" ? "Production" : "Staging"
  purpose     = "Web Application"
  resources = concat(
    # reserved IP обязан быть в списке: DO привязывает его к проекту дроплета сам,
    # а без записи здесь терраформ пытается его «убрать» и ловит 412
    [digitalocean_droplet.app.urn, digitalocean_reserved_ip.app.urn],
    var.managed_db ? [digitalocean_database_cluster.pg[0].urn] : [],
    var.enable_backups_bucket ? [digitalocean_spaces_bucket.backups[0].urn] : [],
  )
}

# --- Сеть ---

resource "digitalocean_vpc" "this" {
  name   = local.name
  region = var.region
}

# --- Droplet ---

resource "digitalocean_ssh_key" "deploy" {
  name       = "${local.name}-deploy"
  public_key = var.ssh_public_key
}

resource "digitalocean_droplet" "app" {
  name       = local.name
  image      = "ubuntu-24-04-x64"
  size       = var.droplet_size
  region     = var.region
  vpc_uuid   = digitalocean_vpc.this.id
  ssh_keys   = [digitalocean_ssh_key.deploy.fingerprint]
  backups    = true # snapshots по расписанию DO
  monitoring = true
  tags       = [var.product, var.env]

  user_data = templatefile("${path.module}/../scripts/cloud-init.yaml", {
    ssh_public_key = var.ssh_public_key
  })
}

# Reserved IP: пересоздание дроплета не трогает DNS
resource "digitalocean_reserved_ip" "app" {
  region = var.region
}

resource "digitalocean_reserved_ip_assignment" "app" {
  ip_address = digitalocean_reserved_ip.app.ip_address
  droplet_id = digitalocean_droplet.app.id
}

# --- Firewall ---

resource "digitalocean_firewall" "app" {
  name        = local.name
  droplet_ids = [digitalocean_droplet.app.id]

  # 443: Cloudflare + admin_ips. 80 закрыт.
  inbound_rule {
    protocol         = "tcp"
    port_range       = "443"
    source_addresses = local.https_sources
  }

  # 22: отдельная переменная, чтобы закрытие сайта не отрезало SSH
  inbound_rule {
    protocol         = "tcp"
    port_range       = "22"
    source_addresses = var.ssh_allow_ips
  }

  outbound_rule {
    protocol              = "tcp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "udp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "icmp"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }
}

# --- Managed PostgreSQL (production) ---

resource "digitalocean_database_cluster" "pg" {
  count = var.managed_db ? 1 : 0

  name                 = local.name
  engine               = "pg"
  version              = "16"
  size                 = var.db_size
  region               = var.region
  node_count           = 1
  private_network_uuid = digitalocean_vpc.this.id
}

resource "digitalocean_database_db" "app" {
  count      = var.managed_db ? 1 : 0
  cluster_id = digitalocean_database_cluster.pg[0].id
  name       = "app"
}

resource "digitalocean_database_user" "app_user" {
  count      = var.managed_db ? 1 : 0
  cluster_id = digitalocean_database_cluster.pg[0].id
  name       = "app_user"
}

resource "digitalocean_database_user" "migrator" {
  count      = var.managed_db ? 1 : 0
  cluster_id = digitalocean_database_cluster.pg[0].id
  name       = "migrator"
}

# trusted sources: только этот дроплет
resource "digitalocean_database_firewall" "pg" {
  count      = var.managed_db ? 1 : 0
  cluster_id = digitalocean_database_cluster.pg[0].id

  rule {
    type  = "droplet"
    value = digitalocean_droplet.app.id
  }
}

# --- Spaces: бэкапы pg_dump ---

resource "digitalocean_spaces_bucket" "backups" {
  count  = var.enable_backups_bucket ? 1 : 0
  name   = "${local.name}-backups"
  region = var.region
  acl    = "private"

  versioning {
    enabled = true
  }
}

# --- Cloudflare DNS (только если задан домен) ---

resource "cloudflare_record" "app" {
  count = var.app_domain != "" && var.cloudflare_zone_id != "" ? 1 : 0

  zone_id = var.cloudflare_zone_id
  name    = "@"
  type    = "A"
  content = digitalocean_reserved_ip.app.ip_address
  proxied = true
}
