variable "product" {
  type        = string
  description = "Имя продукта (задаёт Makefile)"
}

variable "env" {
  type        = string
  description = "Окружение: staging | production"
}

variable "region" {
  type    = string
  default = "fra1"
}

variable "droplet_size" {
  type    = string
  default = "s-2vcpu-4gb" # минимум 4 ГБ: мониторинг ест ~1.5 ГБ
}

variable "app_domain" {
  type        = string
  default     = ""
  description = "Пусто — DNS-запись не создаётся, сайт доступен по IP"
}

variable "cloudflare_zone_id" {
  type    = string
  default = ""
}

# Две переменные разделены намеренно: закрытие прямого входа на 443
# не должно отрезать SSH.
variable "admin_ips" {
  type        = list(string)
  default     = []
  description = "Прямой вход на 443 мимо Cloudflare (CIDR)"
}

variable "ssh_allow_ips" {
  type        = list(string)
  default     = []
  description = "SSH (CIDR). Отдельно от admin_ips"
}

variable "ssh_public_key" {
  type        = string
  description = "Публичный SSH-ключ деплоя (генерирует make infra-bootstrap)"
}

variable "managed_db" {
  type        = bool
  default     = true
  description = "true = DO Managed PostgreSQL (prod). false = PG в контейнере (staging)"
}

variable "db_size" {
  type    = string
  default = "db-s-1vcpu-1gb"
}

variable "enable_backups_bucket" {
  type        = bool
  default     = true
  description = "Spaces-бакет для pg_dump. Для staging выключен: данные одноразовые"
}
