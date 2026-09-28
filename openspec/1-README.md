# EPSEL Papeletas

**Sistema de Autorización de Salida de Practicantes — EPSEL S.A.**

Sistema web para gestionar el ciclo de vida completo de las papeletas de salida de practicantes: creación, firma digital, aprobación por Jefe de Área y Recursos Humanos, control de vigilancia y generación de PDF.

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | PHP 8.3 + Laravel 11 |
| Frontend | React + TypeScript + TailwindCSS (Vite) |
| SPA Bridge | Inertia.js |
| Autenticación | Laravel Sanctum (cookies/sesión) |
| Base de datos | PostgreSQL 16 |
| WebSockets | Laravel Reverb |
| Colas | Laravel Queue (driver: database) |
| PDF | barryvdh/laravel-dompdf |
| Contenedores | Docker + Docker Compose v2 |

---

## Servicios Docker

| Servicio | Puerto local | Descripción |
|----------|-------------|-------------|
| `nginx` | 8000 | Servidor web / Reverse proxy |
| `app` | — | PHP-FPM 8.3 (Laravel) |
| `db` | 5432 | PostgreSQL 16 |
| `pgadmin` | 5050 | pgAdmin 4 |
| `reverb` | 8080 | Laravel Reverb (WebSockets) |
| `queue-worker` | — | Worker de colas |
| `node` | 5173 | Vite (HMR en desarrollo) |

---

## Inicio Rápido

### Requisitos
- Docker Desktop (con Docker Compose v2)
- Git

### Instalación (primera vez)

**Windows (PowerShell):**
```powershell
git clone <repo-url> epsel-papeletas
cd epsel-papeletas
.\setup.ps1
```

**Linux / macOS / WSL:**
```bash
git clone <repo-url> epsel-papeletas
cd epsel-papeletas
bash setup.sh
```

### URLs tras el setup

| Servicio | URL |
|----------|-----|
| Aplicación | http://localhost:8000 |
| Vite HMR | http://localhost:5173 |
| pgAdmin | http://localhost:5050 |
| Reverb WS | ws://localhost:8080 |

**pgAdmin:** usuario `admin@epsel.pe` / contraseña `admin123`

---

## Comandos Comunes

```bash
# Ver ayuda de todos los comandos
make help

# Levantar servicios
make up

# Ver logs
make logs

# Shell en el contenedor app
make shell

# Migraciones
make migrate

# Tests PHP
make test

# Tests frontend
make test-fe

# Verificar salud de servicios
make healthcheck

# Probar evento Reverb WebSocket
make reverb-test
```

---

## Arquitectura

El proyecto sigue **Clean Architecture** adaptada a Laravel:

```
src/app/
├── Domain/            # Entidades, Value Objects, Enums, interfaces de repositorios
│   ├── ExitSlip/      # Papeleta de salida + reglas de negocio
│   ├── User/          # Usuario + roles
│   └── Notification/
├── Application/       # Casos de uso (Actions) y DTOs
│   └── ExitSlip/
│       ├── Actions/   # CreateExitSlip, SubmitExitSlip, ApproveByAreaHead, ApproveByHR, RejectExitSlip
│       └── DTOs/
├── Infrastructure/    # Implementaciones concretas (Eloquent, PDF, Storage, Events)
│   ├── Broadcasting/Events/
│   ├── Persistence/Repositories/
│   ├── PDF/
│   └── Storage/
└── Http/              # Controllers delgados, FormRequests, Resources, Policies
```

### Principios
- `Domain` y `Application` **no dependen** de Eloquent, Facades ni helpers de Laravel
- Los controllers solo validan (FormRequest), llaman un caso de uso y devuelven un Resource
- Los repositorios se enlazan en `AppServiceProvider` (DI por contenedor)
- Autorización con Policies/Gates por rol

---

## Flujo de la Papeleta

```
DRAFT → SUBMITTED → APPROVED_BY_AREA → APPROVED_BY_HR → COMPLETED
                 ↘                  ↘
                  REJECTED           REJECTED
```

---

## Variables de Entorno

Ver `.env.example` para todas las variables disponibles. Las más importantes:

```ini
APP_URL=http://localhost:8000
DB_HOST=db
REVERB_HOST=reverb
REVERB_PORT=8080
BROADCAST_CONNECTION=reverb
QUEUE_CONNECTION=database
```

---

## Fases del Proyecto

- [x] **Fase 0** — Infraestructura base (Docker, Laravel, Reverb, Clean Architecture)
- [x] **Fase 1** — Dominio y base de datos
- [x] **Fase 2** — Autenticación, roles y firmas
- [x] **Fase 3** — Formulario, vista previa y PDF funcional
- [x] **Fase 4** — Aprobación jefe → RRHH, firmas e historial
- [x] **Fase 5** — Notificaciones privadas con Reverb y campana
- [x] **Fase 6** — Paneles por rol, pulido y pruebas automatizadas

Detalles de alcance, operación y pruebas: [Flujo de papeletas](2-flujo-papeletas.md).
Incluye control de vigilancia. No se dispone de una plantilla oficial para certificar
que el PDF reproduzca exactamente su diseño.

---

## Licencia

Proyecto interno — EPSEL S.A. © 2026
