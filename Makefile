PRODUCT       := test
ENV           ?= staging
SHELL         := /bin/bash
.DEFAULT_GOAL := help

COMPOSE_DEV = docker compose -p $(PRODUCT)-dev -f docker-compose.dev.yml
TFVARS      = ../../deploy/environments/$(ENV).tfvars

.PHONY: help gen dev dev-docker observability stop clean logs test e2e lint typecheck build \
	db-migrate db-reset db-seed gen-api setup-check \
	infra-bootstrap infra-plan infra-apply infra-destroy sync-secrets smoke

help: ## список команд
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

gen: ## создать продукт из шаблона (NAME= OUT= DOMAIN= REGION= PROFILE= YES=1)
	cd .generator && pnpm install --ignore-workspace --silent
	node .generator/src/index.js \
		$(if $(NAME),--name "$(NAME)") \
		$(if $(OUT),--out "$(OUT)") \
		$(if $(DOMAIN),--domain "$(DOMAIN)") \
		$(if $(REGION),--region "$(REGION)") \
		$(if $(PROFILE),--profile "$(PROFILE)") \
		$(if $(YES),--yes)

dev: ## инфра в Docker + приложения на хосте
	$(COMPOSE_DEV) up -d --wait
	pnpm install
	pnpm --filter @test/api db:migrate
	set -a; [ -f .env ] && . ./.env; set +a; pnpm dev

dev-docker: ## всё в Docker (используется в CI)
	API_UPSTREAM=api:3000 WEB_UPSTREAM=web:3000 $(COMPOSE_DEV) --profile apps up -d --build --wait

observability: ## локальный стек мониторинга (Grafana на :3001)
	$(COMPOSE_DEV) --profile observability up -d --wait

stop: ## остановить всё локальное
	$(COMPOSE_DEV) --profile apps --profile observability down

clean: ## полный локальный сброс: контейнеры, тома (база!), node_modules, сборки
	@echo "⚠️  БУДЕТ УДАЛЕНО БЕЗВОЗВРАТНО:"
	@echo "   - контейнеры и тома Docker этого проекта (вся локальная база данных!)"
	@echo "   - node_modules и все сборки"
	@echo "   Код, .env и git-история останутся."
	@read -p "Продолжить? [y/N] " ans; [ "$$ans" = "y" ] || { echo "Отменено."; exit 1; }
	$(COMPOSE_DEV) --profile apps --profile observability --profile stripe down -v --remove-orphans
	rm -rf node_modules apps/*/node_modules packages/*/node_modules
	rm -rf apps/web/.next apps/api/dist apps/worker/dist packages/config/dist
	rm -rf playwright-report test-results coverage
	@echo "Локальное состояние снесено. Проект «с нуля» целиком: cd .. && rm -rf $(notdir $(CURDIR)) && заново make gen"

logs: ## логи локальных контейнеров
	$(COMPOSE_DEV) logs -f

test: ## unit-тесты
	pnpm -r test

e2e: ## Playwright (нужен запущенный make dev или dev-docker)
	pnpm exec playwright install chromium
	set -a; [ -f .env ] && . ./.env; set +a; pnpm exec playwright test

lint: ## ESLint
	pnpm -r lint

typecheck: ## tsc --noEmit
	pnpm -r typecheck

build: ## сборка всех пакетов
	pnpm -r build

db-migrate: ## накатить миграции
	pnpm --filter @test/api db:migrate

db-reset: ## снести схему, миграции, seed
	pnpm --filter @test/api db:reset

db-seed: ## seed-данные
	pnpm --filter @test/api db:seed

gen-api: ## openapi.json + typed client
	pnpm --filter @test/api gen:openapi
	pnpm --filter @test/api-client gen

setup-check: ## что ещё не настроено перед деплоем
	node infra/scripts/setup-check.mjs

infra-bootstrap: ## один раз: бакет под tfstate + SSH-ключи деплоя
	bash infra/scripts/bootstrap.sh

infra-plan: ## tofu plan (ENV=staging|production)
	cd infra/terraform && \
		tofu init -reconfigure -backend-config=../../deploy/backend.hcl \
			-backend-config="key=tf-state/$(PRODUCT)/$(ENV).tfstate" && \
		tofu plan -var-file=$(TFVARS) -var "env=$(ENV)" -var "product=$(PRODUCT)"

infra-apply: ## tofu apply (ENV=staging|production)
	cd infra/terraform && \
		tofu init -reconfigure -backend-config=../../deploy/backend.hcl \
			-backend-config="key=tf-state/$(PRODUCT)/$(ENV).tfstate" && \
		tofu apply -var-file=$(TFVARS) -var "env=$(ENV)" -var "product=$(PRODUCT)"

infra-destroy: ## снести окружение целиком (ENV=staging)
	cd infra/terraform && \
		tofu init -reconfigure -backend-config=../../deploy/backend.hcl \
			-backend-config="key=tf-state/$(PRODUCT)/$(ENV).tfstate" && \
		tofu destroy -var-file=$(TFVARS) -var "env=$(ENV)" -var "product=$(PRODUCT)"

sync-secrets: ## выходы tofu → GitHub Environment
	bash infra/scripts/sync-secrets.sh $(ENV)

smoke: ## smoke-тест задеплоенного окружения
	bash infra/scripts/smoke.sh $(ENV)
