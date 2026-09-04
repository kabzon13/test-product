output "droplet_ip" {
  value       = digitalocean_reserved_ip.app.ip_address
  description = "Reserved IP — сюда ходит деплой и DNS"
}

output "app_domain" {
  value = var.app_domain
}

output "database_url" {
  value = var.managed_db ? format(
    "postgres://%s:%s@%s:%d/app?sslmode=require",
    digitalocean_database_user.app_user[0].name,
    digitalocean_database_user.app_user[0].password,
    digitalocean_database_cluster.pg[0].private_host,
    digitalocean_database_cluster.pg[0].port,
  ) : ""
  sensitive   = true
  description = "Строка подключения приложения (private network)"
}

output "migrate_database_url" {
  value = var.managed_db ? format(
    "postgres://%s:%s@%s:%d/app?sslmode=require",
    digitalocean_database_user.migrator[0].name,
    digitalocean_database_user.migrator[0].password,
    digitalocean_database_cluster.pg[0].private_host,
    digitalocean_database_cluster.pg[0].port,
  ) : ""
  sensitive   = true
  description = "Строка подключения для миграций"
}

output "backups_bucket" {
  value = var.enable_backups_bucket ? digitalocean_spaces_bucket.backups[0].name : ""
}

output "backups_bucket_endpoint" {
  value = var.enable_backups_bucket ? "https://${var.region}.digitaloceanspaces.com" : ""
}
