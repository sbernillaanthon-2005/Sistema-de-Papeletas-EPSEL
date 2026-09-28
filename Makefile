# =============================================================================
# Makefile — Comandos de desarrollo para EPSEL Papeletas
# Uso: make <target>
# =============================================================================

.PHONY: help setup up down restart logs shell artisan migrate seed \
        test test-fe npm-dev npm-build healthcheck reverb-test clean

# Colores
CYAN  = \033[36m
RESET = \033[0m

help: ## Mostrar esta ayuda
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "$(CYAN)%-20s$(RESET) %s\n", $$1, $$2}'

# ── Setup ──────────────────────────────────────────────────────────────────
setup: ## Configuración inicial completa (primera vez)
	@bash setup.sh

post-install: ## Copiar stubs de Clean Architecture al proyecto Laravel
	@bash post-install.sh

# ── Docker ─────────────────────────────────────────────────────────────────
up: ## Levantar todos los servicios
	docker compose up -d

down: ## Detener todos los servicios
	docker compose down

restart: ## Reiniciar todos los servicios
	docker compose restart

logs: ## Ver logs de todos los servicios (ctrl+c para salir)
	docker compose logs -f

logs-app: ## Ver logs solo del contenedor app
	docker compose logs -f app

logs-reverb: ## Ver logs de Reverb WebSocket
	docker compose logs -f reverb

logs-queue: ## Ver logs del queue worker
	docker compose logs -f queue-worker

# ── Shell / Artisan ─────────────────────────────────────────────────────────
shell: ## Abrir shell bash en el contenedor app
	docker compose exec app bash

artisan: ## Ejecutar comando artisan (ej: make artisan CMD="route:list")
	docker compose exec app php artisan $(CMD)

# ── Base de datos ───────────────────────────────────────────────────────────
migrate: ## Ejecutar migraciones
	docker compose exec app php artisan migrate

migrate-fresh: ## Limpiar y re-ejecutar todas las migraciones + seeds
	docker compose exec app php artisan migrate:fresh --seed

seed: ## Ejecutar seeders
	docker compose exec app php artisan db:seed

# ── Tests ────────────────────────────────────────────────────────────────────
test: ## Ejecutar tests PHP (Pest)
	docker compose exec app php artisan test

test-unit: ## Ejecutar solo tests unitarios
	docker compose exec app php artisan test --group=unit

test-fe: ## Verificar tipos del frontend
	docker compose exec node npm run typecheck

# ── Frontend ─────────────────────────────────────────────────────────────────
npm-dev: ## Iniciar Vite en modo desarrollo
	docker compose exec node sh -c "cd /var/www/html && npm run dev"

npm-build: ## Build de producción frontend
	docker compose exec node sh -c "cd /var/www/html && npm run build"

npm-install: ## Instalar dependencias npm
	docker compose exec node sh -c "cd /var/www/html && npm install"

# ── Healthcheck / Reverb ─────────────────────────────────────────────────────
healthcheck: ## Verificar salud de todos los servicios
	@echo "Verificando servicios..."
	@curl -sf http://localhost:8000/up && echo " Laravel OK" || echo " Laravel ERROR"
	@docker compose exec db pg_isready -U epsel -d epsel_papeletas && echo " PostgreSQL OK" || echo " PostgreSQL ERROR"
	@curl -sf http://localhost:5050 && echo " pgAdmin OK" || echo " pgAdmin ERROR"

reverb-test: ## Disparar evento de prueba Reverb
	docker compose exec app php artisan tinker --execute="\
	  use App\Infrastructure\Broadcasting\Events\ReverbHealthCheck; \
	  event(new ReverbHealthCheck()); \
	  echo 'Evento Reverb disparado. Escucha en ws://localhost:8080';\
	"

# ── Limpieza ─────────────────────────────────────────────────────────────────
cache-clear: ## Limpiar cachés de Laravel
	docker compose exec app php artisan cache:clear
	docker compose exec app php artisan config:clear
	docker compose exec app php artisan route:clear
	docker compose exec app php artisan view:clear

clean: ## Detener servicios y eliminar volúmenes (¡BORRA LA BASE DE DATOS!)
	@echo "ADVERTENCIA: Esto eliminará la base de datos. Presiona Ctrl+C para cancelar..."
	@sleep 5
	docker compose down -v
