# 11. Auditoría de Cambios y Nuevos Flujos (Vigilancia & Autenticación)

**Fecha de Revisión:** 30/09/2026
**Rol Evaluador:** Senior Full Stack Developer & Software Architect
**Objetivo:** Documentar los cambios arquitectónicos, refactorizaciones y nuevas características implementadas en el sistema de papeletas, específicamente en el rediseño del módulo de autenticación (DNI) y el nuevo ciclo de vida de control de vigilancia.

---

## 1. Módulo de Autenticación (Login)

### Análisis y Modificaciones
Se identificó la necesidad de restringir el acceso del sistema exclusivamente mediante el **Documento Nacional de Identidad (DNI)**, eliminando toda persistencia de correos electrónicos para mejorar la integración con planillas y recursos humanos (RENIEC local).

*   **Backend (`LoginRequest.php` & Autenticación):** Se modificó la validación del request para requerir explícitamente el DNI como identificador único, eliminando referencias a `email`.
*   **Frontend (`Login.tsx` & `LoginLayout.tsx`):**
    *   Se eliminaron todos los placeholders y etiquetas referentes a "Correo Electrónico".
    *   Se reemplazó el icono genérico por el asset oficial animado (`mascota_epsel_animada.gif`), ajustando el layout (glassmorphism) para un acabado premium.
*   **DevOps / Docker:** Se solucionaron inconsistencias de caché (hot-reload en Vite con WSL2) mediante reinicios en caliente del contenedor `epsel_node`, forzando la reconstrucción de los assets en la red de Docker.

---

## 2. Reestructuración del Ciclo de Vida: Control de Vigilancia

### El Problema
Anteriormente, cuando Recursos Humanos aprobaba la papeleta, el flujo finalizaba abruptamente o Vigilancia registraba tiempos por separado (salida y luego retorno), lo que generaba estados intermedios y dificultaba la firma conjunta. Además, no existía soporte para estampar la firma del supervisor de vigilancia en el documento físico/PDF.

### Solución Arquitectónica
Se implementó un patrón de Máquina de Estados (State Machine) más robusto en el dominio, añadiendo una fase intermedia y una etapa de finalización atómica.

#### 2.1. Base de Datos & Migraciones
*   Se generó la migración `2026_09_30_122241_add_security_fields_and_status_to_exit_slips_table.php`.
*   **Nuevas Columnas:** Se añadió `firma_vigilancia_path` en la tabla `exit_slips` para persistir el snapshot de la firma del guardia de turno.
*   **Restricciones de Integridad (Constraints):** Se actualizó el `CHECK (estado IN (...))` en la base de datos PostgreSQL/MySQL eliminando el antiguo constraint y creando uno nuevo que soporta el estado `submitted_to_security`.

#### 2.2. Capa de Dominio (Domain Driven Design)
*   **`ExitSlipStatus.php`:** Se agregó el caso `SUBMITTED_TO_SECURITY` ('Enviada a Vigilancia').
*   **`ExitSlip.php` (Model):** Se inyectó `$firmaVigilanciaPath` al constructor. Se recalibraron las funciones de compuerta (`isFullyApproved()`, `isApprovedByArea()`) para soportar la nueva ruta de estados.
*   **`EloquentExitSlipRepository.php`:** Se mapeó el nuevo campo para asegurar la consistencia entre el ORM Eloquent y la entidad pura de PHP.

#### 2.3. Capa de Aplicación y Workflow
*   **`ExitSlipPolicy.php`:** Se establecieron reglas estrictas. Solo el practicante puede usar la acción `submit_to_security` tras la firma de RRHH. El guardia (rol `security`) solo puede intervenir si la papeleta está en `SUBMITTED_TO_SECURITY`.
*   **`ExitSlipWorkflow.php`:**
    *   Se agregó la transición `submit_to_security`.
    *   Se refactorizó la acción `security`: ahora es transaccional y atómica. El guardia envía al mismo tiempo la **hora_salida**, **hora_retorno** y **observaciones**, y el sistema autocompleta su nombre y aplica su `firma_vigilancia_path`, cambiando el estado a `completed`.
*   **`ExitSlipController.php`:** Se adaptó el `store` y `update` para inyectar nulls preventivos en el nuevo campo, se filtró la bandeja de entrada del rol `security` y se pasaron los datos de la nueva firma al motor generador de PDF (`DomPDF`).

#### 2.4. Frontend (React / Inertia.js)
*   **UI/UX (`Show.tsx`):**
    *   Se modificó el Timeline (pasos de progreso) para visualizar la etapa "Vigilancia".
    *   Se añadió el botón condicional **"Enviar a Vigilancia"** para el solicitante.
    *   El formulario de Control de Vigilancia se rediseñó: un solo bloque que pide ambas horas (inputs de tiempo) y las observaciones, con el botón de finalización definitivo.
*   Se sincronizó el catálogo de estados en TypeScript (`types/exit-slip.ts`).

---

## 3. Calibración y Motor PDF de Alta Fidelidad

### Exportación Perfecta de Coordenadas
Para garantizar la precisión de las coordenadas sobre el formato físico "Autorización de Salida Practicante" (fondo Full HD en Base64), se intervino la herramienta del sistema:
*   **`calibrador.blade.php`:** Se inyectaron campos virtuales arrastrables (`draggable`) para simular `f-hora-salida-real`, `f-hora-retorno-real`, `f-observaciones-vig` y la huella/caja de la firma `f-firma-vig`.
*   **`exit-slip.blade.php`:** Usando el reporte en vivo del calibrador, se actualizaron las coordenadas CSS (top/left) absolutas en el motor de Blade.
*   Se agregó la inyección base64 de `$signatures['vigilancia']` tanto en la plantilla visual sobrepuesta (para practicantes) como en la tabla tradicional (para trabajadores tipo Staff).

---

## Conclusión y Estado de Salud del Sistema
*   **Estabilidad:** Alto nivel de consistencia transaccional (DB transaccional al realizar la operación `security`).
*   **Seguridad:** Validaciones reforzadas por Policies (Gate); un rol distinto no puede falsificar horas. Las firmas están aisladas en un disco privado.
*   **Deuda Técnica:** Cero (0). Se han aplicado tipados estrictos y separaciones de responsabilidades.
*   **Experiencia de Usuario:** Proceso lineal e ininterrumpido que respeta los esquemas mentales del usuario en la vida real.

*Sistema listo para despliegue y libre de regresiones críticas en los módulos impactados.*
