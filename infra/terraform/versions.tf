terraform {
  required_version = ">= 1.6"

  # Частичная конфигурация backend: endpoint/bucket приходят из deploy/backend.hcl,
  # key — из Makefile (tf-state/<product>/<env>.tfstate).
  backend "s3" {}

  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.46"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.52"
    }
    http = {
      source  = "hashicorp/http"
      version = "~> 3.4"
    }
  }
}

# Токены — только из окружения:
#   DIGITALOCEAN_TOKEN, SPACES_ACCESS_KEY_ID, SPACES_SECRET_ACCESS_KEY, CLOUDFLARE_API_TOKEN
provider "digitalocean" {}

provider "cloudflare" {}
