#!/usr/bin/env bash
# =============================================================================
# post-install.sh — Copia los stubs de Clean Architecture al proyecto Laravel
# Ejecutar DESPUÉS de que Laravel esté creado en src/
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STUBS_DIR="${SCRIPT_DIR}/src-stubs"
TARGET_DIR="${SCRIPT_DIR}/src/app"

if [ ! -d "$TARGET_DIR" ]; then
  echo "[ERROR] El directorio src/app no existe. Ejecuta setup.sh primero."
  exit 1
fi

echo "[EPSEL] Copiando archivos de arquitectura limpia..."

# Domain
mkdir -p "${TARGET_DIR}/Domain/ExitSlip/Enums"
mkdir -p "${TARGET_DIR}/Domain/ExitSlip/ValueObjects"
mkdir -p "${TARGET_DIR}/Domain/ExitSlip/Repositories"
mkdir -p "${TARGET_DIR}/Domain/User/Enums"
mkdir -p "${TARGET_DIR}/Domain/Notification"

cp -v "${STUBS_DIR}/Domain/ExitSlip/ExitSlip.php"                                   "${TARGET_DIR}/Domain/ExitSlip/"
cp -v "${STUBS_DIR}/Domain/ExitSlip/Enums/ExitSlipStatus.php"                       "${TARGET_DIR}/Domain/ExitSlip/Enums/"
cp -v "${STUBS_DIR}/Domain/ExitSlip/Enums/ExitReason.php"                           "${TARGET_DIR}/Domain/ExitSlip/Enums/"
cp -v "${STUBS_DIR}/Domain/ExitSlip/ValueObjects/TimeRange.php"                     "${TARGET_DIR}/Domain/ExitSlip/ValueObjects/"
cp -v "${STUBS_DIR}/Domain/ExitSlip/Repositories/ExitSlipRepositoryInterface.php"   "${TARGET_DIR}/Domain/ExitSlip/Repositories/"
cp -v "${STUBS_DIR}/Domain/User/User.php"                                            "${TARGET_DIR}/Domain/User/"
cp -v "${STUBS_DIR}/Domain/User/Enums/UserRole.php"                                 "${TARGET_DIR}/Domain/User/Enums/"

# Application
mkdir -p "${TARGET_DIR}/Application/ExitSlip/Actions"
mkdir -p "${TARGET_DIR}/Application/ExitSlip/DTOs"

cp -v "${STUBS_DIR}/Application/ExitSlip/DTOs/CreateExitSlipDTO.php"                "${TARGET_DIR}/Application/ExitSlip/DTOs/"
cp -v "${STUBS_DIR}/Application/ExitSlip/Actions/CreateExitSlip.php"                "${TARGET_DIR}/Application/ExitSlip/Actions/"
cp -v "${STUBS_DIR}/Application/ExitSlip/Actions/SubmitExitSlip.php"                "${TARGET_DIR}/Application/ExitSlip/Actions/"
cp -v "${STUBS_DIR}/Application/ExitSlip/Actions/ApproveByAreaHead.php"             "${TARGET_DIR}/Application/ExitSlip/Actions/"
cp -v "${STUBS_DIR}/Application/ExitSlip/Actions/ApproveByHR.php"                   "${TARGET_DIR}/Application/ExitSlip/Actions/"
cp -v "${STUBS_DIR}/Application/ExitSlip/Actions/RejectExitSlip.php"               "${TARGET_DIR}/Application/ExitSlip/Actions/"

# Infrastructure
mkdir -p "${TARGET_DIR}/Infrastructure/Broadcasting/Events"
mkdir -p "${TARGET_DIR}/Infrastructure/Persistence/Repositories"
mkdir -p "${TARGET_DIR}/Infrastructure/PDF"
mkdir -p "${TARGET_DIR}/Infrastructure/Storage"

cp -v "${STUBS_DIR}/Infrastructure/Broadcasting/Events/ReverbHealthCheck.php"       "${TARGET_DIR}/Infrastructure/Broadcasting/Events/"
cp -v "${STUBS_DIR}/Infrastructure/Broadcasting/Events/ExitSlipStatusChanged.php"   "${TARGET_DIR}/Infrastructure/Broadcasting/Events/"

# Providers
cp -v "${STUBS_DIR}/Providers/AppServiceProvider.php"                               "${TARGET_DIR}/../app/Providers/" 2>/dev/null \
  || cp -v "${STUBS_DIR}/Providers/AppServiceProvider.php" "${TARGET_DIR}/../Providers/"

echo "[OK] Archivos de Clean Architecture copiados exitosamente."
