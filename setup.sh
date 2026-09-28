#!/usr/bin/env bash
# =============================================================================
# setup.sh — Inicialización completa de EPSEL Papeletas (Fase 0)
# Ejecutar desde la raíz del proyecto: bash setup.sh
# Requiere: Docker y Docker Compose v2+
# =============================================================================
set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()    { echo -e "${CYAN}[EPSEL]${NC} $*"; }
ok()     { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()   { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()  { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ─────────────────────────────────────────────
# 0. Pre-requisitos
# ─────────────────────────────────────────────
command -v docker &>/dev/null || error "Docker no está instalado."
docker compose version &>/dev/null || error "Docker Compose v2 no está disponible."

log "========================================================"
log "  EPSEL Papeletas — Fase 0 Setup"
log "========================================================"

# ─────────────────────────────────────────────
# 1. Copiar .env
# ─────────────────────────────────────────────
if [ ! -f .env ]; then
  cp .env.example .env
  ok ".env creado desde .env.example"
else
  warn ".env ya existe, no se sobreescribe"
fi

# ─────────────────────────────────────────────
# 2. Construir imagen PHP
# ─────────────────────────────────────────────
log "Construyendo imagen PHP 8.3-FPM..."
docker compose build app --no-cache
ok "Imagen PHP construida"

# ─────────────────────────────────────────────
# 3. Crear proyecto Laravel con Breeze (Inertia+React+TS)
#    Solo si src/ está vacío
# ─────────────────────────────────────────────
if [ -z "$(ls -A src 2>/dev/null)" ]; then
  log "Creando proyecto Laravel 11 con Composer..."
  docker compose run --rm --no-deps app bash -c "
    composer create-project laravel/laravel:^11 /tmp/laravel --prefer-dist --no-interaction \
    && cp -r /tmp/laravel/. /var/www/html/ \
    && echo 'Laravel creado'
  "
  ok "Proyecto Laravel creado en src/"

  log "Instalando paquetes Laravel adicionales..."
  docker compose run --rm --no-deps app bash -c "
    cd /var/www/html \
    && composer require \
        laravel/breeze \
        laravel/reverb \
        barryvdh/laravel-dompdf \
        --no-interaction
  "
  ok "Paquetes instalados"

  log "Instalando Breeze con Inertia + React + TypeScript..."
  docker compose run --rm --no-deps app bash -c "
    cd /var/www/html \
    && php artisan breeze:install react --typescript --ssr=no --no-interaction \
    && php artisan reverb:install --no-interaction
  "
  ok "Breeze y Reverb instalados"

  log "Configurando variables de entorno en .env Laravel..."
  docker compose run --rm --no-deps app bash -c "
    cd /var/www/html \
    && cp /var/www/html/../.env.example /var/www/html/.env \
    && php artisan key:generate --force
  "
  ok "APP_KEY generado"
else
  warn "src/ ya contiene archivos. Omitiendo creación de Laravel."
fi

# ─────────────────────────────────────────────
# 4. Levantar todos los servicios
# ─────────────────────────────────────────────
log "Levantando servicios..."
docker compose up -d db
log "Esperando que PostgreSQL esté listo..."
sleep 10

docker compose up -d
ok "Todos los servicios arriba"

# ─────────────────────────────────────────────
# 5. Esperar app healthy y correr migraciones
# ─────────────────────────────────────────────
log "Esperando que app esté healthy..."
RETRIES=30
until docker compose exec app php -r "echo 'ok';" &>/dev/null; do
  sleep 3
  ((RETRIES--))
  [ $RETRIES -eq 0 ] && error "El contenedor app no respondió a tiempo"
done

log "Ejecutando migraciones..."
docker compose exec app php artisan migrate --force
ok "Migraciones ejecutadas"

log "Creando estructura Clean Architecture..."
docker compose exec app bash -c "
  mkdir -p \
    app/Domain/ExitSlip \
    app/Domain/User \
    app/Domain/Notification \
    app/Application/ExitSlip/Actions \
    app/Application/ExitSlip/DTOs \
    app/Application/User \
    app/Application/Notification \
    app/Infrastructure/Persistence/Eloquent \
    app/Infrastructure/Persistence/Repositories \
    app/Infrastructure/Broadcasting \
    app/Infrastructure/PDF \
    app/Infrastructure/Storage
"
ok "Estructura de directorios creada"

# ─────────────────────────────────────────────
# 6. Instalar dependencias npm y build
# ─────────────────────────────────────────────
log "Instalando dependencias npm..."
docker compose exec node sh -c "cd /var/www/html && npm install"
ok "npm install completado"

# ─────────────────────────────────────────────
# 7. Disparar evento de prueba Reverb
# ─────────────────────────────────────────────
log "Disparando evento de prueba Reverb..."
docker compose exec app php artisan tinker --execute="
  event(new \App\Events\ReverbHealthCheck());
  echo 'Evento Reverb disparado OK';
" 2>/dev/null || warn "Evento Reverb: configura el evento manualmente (ver docs)"

# ─────────────────────────────────────────────
# 8. Resumen
# ─────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   EPSEL Papeletas — Fase 0 COMPLETADA ✓          ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  App (Laravel):   http://localhost:8000           ║${NC}"
echo -e "${GREEN}║  Vite (HMR):      http://localhost:5173           ║${NC}"
echo -e "${GREEN}║  pgAdmin:         http://localhost:5050           ║${NC}"
echo -e "${GREEN}║  Reverb WS:       ws://localhost:8080             ║${NC}"
echo -e "${GREEN}║  PostgreSQL:      localhost:5432                  ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
log "Logs en tiempo real: docker compose logs -f"
