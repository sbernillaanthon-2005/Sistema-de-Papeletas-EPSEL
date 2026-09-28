# =============================================================================
# setup.ps1 - Inicializacion completa de EPSEL Papeletas (Fase 0)
# Ejecutar desde PowerShell en la raiz del proyecto: .\setup.ps1
# Requiere: Docker Desktop corriendo con Docker Compose v2
# =============================================================================
$ErrorActionPreference = "Stop"

function LogInfo { Write-Host "[EPSEL] $args" -ForegroundColor Cyan }
function LogOk   { Write-Host "[OK]    $args" -ForegroundColor Green }
function LogWarn { Write-Host "[WARN]  $args" -ForegroundColor Yellow }
function LogFail { Write-Host "[ERROR] $args" -ForegroundColor Red; exit 1 }

LogInfo "========================================================"
LogInfo "  EPSEL Papeletas - Fase 0 Setup (Windows PowerShell)"
LogInfo "========================================================"

# ---------------------------------------------------------
# 0. Pre-requisitos
# ---------------------------------------------------------
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    LogFail "Docker no esta instalado o no esta en PATH."
}
docker compose version | Out-Null
if ($LASTEXITCODE -ne 0) { LogFail "Docker Compose v2 no disponible." }

# ---------------------------------------------------------
# 1. Copiar .env
# ---------------------------------------------------------
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    LogOk ".env creado desde .env.example"
} else {
    LogWarn ".env ya existe, no se sobreescribe"
}

# ---------------------------------------------------------
# 2. Construir imagen PHP
# ---------------------------------------------------------
LogInfo "Construyendo imagen PHP 8.3-FPM..."
docker compose build app --no-cache
if ($LASTEXITCODE -ne 0) { LogFail "Fallo al construir imagen PHP" }
LogOk "Imagen PHP construida"

# ---------------------------------------------------------
# 3. Levantar solo db primero (necesaria para Laravel)
# ---------------------------------------------------------
LogInfo "Levantando PostgreSQL..."
docker compose up -d db
LogInfo "Esperando 20 segundos para que PostgreSQL inicie..."
Start-Sleep -Seconds 20

# ---------------------------------------------------------
# 4. Crear proyecto Laravel (solo si src/ esta vacio)
# ---------------------------------------------------------
$srcItems = Get-ChildItem "src" -ErrorAction SilentlyContinue
if ($null -eq $srcItems -or $srcItems.Count -eq 0) {
    LogInfo "Creando proyecto Laravel 11 via Composer en Docker..."
    docker compose run --rm --no-deps app bash -c "composer create-project laravel/laravel:^11 /tmp/laravel --prefer-dist --no-interaction && cp -r /tmp/laravel/. /var/www/html/ && echo 'Laravel OK'"
    if ($LASTEXITCODE -ne 0) { LogFail "Fallo composer create-project" }
    LogOk "Proyecto Laravel creado en src/"

    LogInfo "Instalando paquetes Laravel adicionales..."
    docker compose run --rm --no-deps app bash -c "cd /var/www/html && composer require laravel/breeze laravel/reverb barryvdh/laravel-dompdf --no-interaction"
    if ($LASTEXITCODE -ne 0) { LogFail "Fallo composer require" }
    LogOk "Paquetes instalados: Breeze, Reverb, DomPDF"

    LogInfo "Instalando Breeze con Inertia + React + TypeScript..."
    docker compose run --rm --no-deps app bash -c "cd /var/www/html && php artisan breeze:install react --typescript --no-interaction"
    if ($LASTEXITCODE -ne 0) { LogFail "Fallo breeze:install" }
    LogOk "Breeze instalado"

    LogInfo "Instalando Reverb..."
    docker compose run --rm --no-deps app bash -c "cd /var/www/html && php artisan reverb:install --no-interaction"
    if ($LASTEXITCODE -ne 0) { LogWarn "reverb:install tuvo advertencias (puede ser normal)" }
    LogOk "Reverb configurado"

    LogInfo "Copiando .env al directorio Laravel y generando APP_KEY..."
    Copy-Item ".env.example" "src\.env" -Force
    docker compose run --rm --no-deps app bash -c "cd /var/www/html && php artisan key:generate --force"
    if ($LASTEXITCODE -ne 0) { LogFail "Fallo key:generate" }
    LogOk "APP_KEY generado"

} else {
    LogWarn "src/ ya contiene archivos. Omitiendo creacion de Laravel."
    if (-not (Test-Path "src\.env")) {
        Copy-Item ".env.example" "src\.env" -Force
        docker compose run --rm --no-deps app bash -c "cd /var/www/html && php artisan key:generate --force"
        LogOk "APP_KEY generado"
    }
}

# ---------------------------------------------------------
# 5. Levantar todos los servicios
# ---------------------------------------------------------
LogInfo "Levantando todos los servicios..."
docker compose up -d
if ($LASTEXITCODE -ne 0) { LogFail "Fallo docker compose up" }
LogOk "Servicios levantados"

# ---------------------------------------------------------
# 6. Esperar que app este disponible y migrar
# ---------------------------------------------------------
LogInfo "Esperando que el contenedor app este listo..."
$retries = 40
$ready = $false
do {
    Start-Sleep -Seconds 3
    $result = docker compose exec app php -r "echo 'ok';" 2>$null
    if ($result -eq "ok") { $ready = $true }
    $retries--
} while (-not $ready -and $retries -gt 0)

if (-not $ready) { LogFail "El contenedor app no respondio a tiempo" }
LogOk "Contenedor app disponible"

LogInfo "Ejecutando migraciones..."
docker compose exec app php artisan migrate --force
if ($LASTEXITCODE -ne 0) { LogFail "Fallo migrate" }
LogOk "Migraciones ejecutadas"

# ---------------------------------------------------------
# 7. Crear estructura Clean Architecture
# ---------------------------------------------------------
LogInfo "Creando estructura de directorios Clean Architecture..."
$dirs = @(
    "app/Domain/ExitSlip/Enums",
    "app/Domain/ExitSlip/ValueObjects",
    "app/Domain/ExitSlip/Repositories",
    "app/Domain/User/Enums",
    "app/Domain/User/Repositories",
    "app/Domain/Notification",
    "app/Application/ExitSlip/Actions",
    "app/Application/ExitSlip/DTOs",
    "app/Application/User",
    "app/Application/Notification",
    "app/Infrastructure/Persistence/Eloquent",
    "app/Infrastructure/Persistence/Repositories",
    "app/Infrastructure/Broadcasting/Events",
    "app/Infrastructure/PDF",
    "app/Infrastructure/Storage"
)
foreach ($dir in $dirs) {
    $fullPath = Join-Path "src" $dir
    New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
}
LogOk "Directorios de Clean Architecture creados"

# ---------------------------------------------------------
# 8. Copiar stubs de arquitectura
# ---------------------------------------------------------
LogInfo "Copiando stubs de Clean Architecture..."
$stubsBase = "src-stubs"
$targetBase = "src\app"

function CopyStub($rel) {
    $src = Join-Path $stubsBase $rel
    $dst = Join-Path $targetBase $rel
    $dstDir = Split-Path $dst -Parent
    New-Item -ItemType Directory -Path $dstDir -Force | Out-Null
    if (Test-Path $src) {
        Copy-Item $src $dst -Force
        Write-Host "  Copied: $rel" -ForegroundColor DarkGray
    } else {
        Write-Host "  MISSING: $rel" -ForegroundColor Yellow
    }
}

CopyStub "Domain\ExitSlip\ExitSlip.php"
CopyStub "Domain\ExitSlip\Enums\ExitSlipStatus.php"
CopyStub "Domain\ExitSlip\Enums\ExitReason.php"
CopyStub "Domain\ExitSlip\ValueObjects\TimeRange.php"
CopyStub "Domain\ExitSlip\Repositories\ExitSlipRepositoryInterface.php"
CopyStub "Domain\User\User.php"
CopyStub "Domain\User\Enums\UserRole.php"
CopyStub "Application\ExitSlip\DTOs\CreateExitSlipDTO.php"
CopyStub "Application\ExitSlip\Actions\CreateExitSlip.php"
CopyStub "Application\ExitSlip\Actions\SubmitExitSlip.php"
CopyStub "Application\ExitSlip\Actions\ApproveByAreaHead.php"
CopyStub "Application\ExitSlip\Actions\ApproveByHR.php"
CopyStub "Application\ExitSlip\Actions\RejectExitSlip.php"
CopyStub "Infrastructure\Broadcasting\Events\ReverbHealthCheck.php"
CopyStub "Infrastructure\Broadcasting\Events\ExitSlipStatusChanged.php"

# AppServiceProvider va directamente en app/Providers (ya existe en Laravel)
$spSrc = Join-Path $stubsBase "Providers\AppServiceProvider.php"
$spDst = "src\app\Providers\AppServiceProvider.php"
if (Test-Path $spSrc) {
    Copy-Item $spSrc $spDst -Force
    Write-Host "  Copied: Providers\AppServiceProvider.php" -ForegroundColor DarkGray
}

LogOk "Stubs copiados"

# ---------------------------------------------------------
# 9. Instalar dependencias npm
# ---------------------------------------------------------
LogInfo "Instalando dependencias npm..."
docker compose exec node sh -c "cd /var/www/html && npm install"
if ($LASTEXITCODE -ne 0) { LogWarn "npm install tuvo advertencias" }
LogOk "npm install completado"

# ---------------------------------------------------------
# 10. dump-autoload para verificar namespaces
# ---------------------------------------------------------
LogInfo "Ejecutando composer dump-autoload..."
docker compose exec app composer dump-autoload
if ($LASTEXITCODE -ne 0) { LogWarn "dump-autoload tuvo advertencias" }
LogOk "Autoload OK"

# ---------------------------------------------------------
# Resumen final
# ---------------------------------------------------------
Write-Host ""
Write-Host "======================================================" -ForegroundColor Green
Write-Host "  EPSEL Papeletas - Fase 0 COMPLETADA" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
Write-Host "  App (Laravel):   http://localhost:8000" -ForegroundColor Green
Write-Host "  Vite (HMR):      http://localhost:5173" -ForegroundColor Green
Write-Host "  pgAdmin:         http://localhost:5050" -ForegroundColor Green
Write-Host "  Reverb WS:       ws://localhost:8080" -ForegroundColor Green
Write-Host "  PostgreSQL:      localhost:5432" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Comandos utiles:" -ForegroundColor Cyan
Write-Host "  docker compose ps             - Ver estado de servicios" -ForegroundColor White
Write-Host "  docker compose logs -f        - Ver logs en vivo" -ForegroundColor White
Write-Host "  docker compose exec app bash  - Shell en el contenedor" -ForegroundColor White
Write-Host "  make reverb-test              - Probar evento WebSocket" -ForegroundColor White
