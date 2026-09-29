# Registro de Cambios: Flujo de Recursos Humanos, Firmas y Administración

## 1. Contexto

Este documento es una extensión del registro técnico (Changelog) del Sistema de Control de Papeletas EPSEL. En esta fase, como programador senior, me he centrado en implementar el flujo avanzado de firmas, estabilizar la integridad de datos históricos, e incorporar módulos críticos de administración.

---

## 2. Gestión Dinámica de Firmas (Reemplazo y Actualización)

### Problema
El sistema permitía subir una firma inicial, pero no ofrecía un mecanismo para corregirla. Si un usuario (como el Especialista de RRHH o el Practicante) se equivocaba de imagen, quedaba bloqueado permanentemente con la firma incorrecta, ya que no existía una ruta de actualización (update).

### Solución Técnica
*   **Archivos Afectados:**
    *   `resources/js/Pages/Profile/Partials/UpdateSignatureForm.tsx`
    *   `app/Http/Controllers/SignatureController.php`
*   **Implementación:**
    1.  **UI/UX:** Se modificó el componente React para incluir un botón "Editar". Este botón activa un estado que vuelve a mostrar el campo de carga de archivos (File Input) y oculta temporalmente la firma guardada. Se añadió un cuadro de confirmación (confirm) para asegurar la intención del usuario.
    2.  **Lógica de Controlador:** En el `SignatureController`, se adaptó el método `store` para que funcione como un *Upsert* (Insertar/Actualizar). Si el usuario ya posee una firma (`$request->user()->signature`), el sistema primero purga físicamente el archivo antiguo usando `Storage::disk('private')->delete()`, y luego sube la nueva imagen, actualizando el registro en la base de datos sin dejar archivos "basura".

---

## 3. Corrección de Inmutabilidad de Datos (El problema de "Juan Practicante")

### Problema
A pesar de que los perfiles se habían actualizado con los nombres reales (Ej. "Anthony Jesus Senmache Bernilla"), la interfaz principal de la Papeleta y el PDF continuaban mostrando nombres antiguos o *placeholders* como "Juan Practicante".

### Solución Técnica
*   **Diagnóstico:** El sistema fue diseñado bajo el principio de **Inmutabilidad Histórica**. Cuando una papeleta se crea, toma una "fotografía" (`fullNameSnapshot`) de los datos del usuario en ese milisegundo exacto y la guarda para siempre. Esto garantiza que si alguien cambia de apellido el próximo año, las papeletas antiguas no se vean alteradas. El problema ocurrió porque las papeletas se crearon *antes* de que los perfiles se corrigieran.
*   **Implementación:** En lugar de alterar la arquitectura inmutable del código base (lo que rompería el cumplimiento histórico a largo plazo), se ejecutó un script correctivo (`fix_names.php`) a nivel de base de datos. Este script iteró sobre las papeletas existentes y actualizó directamente el campo `apellidos_nombres` en la tabla `exit_slips`, parchando el historial al estado real sin comprometer la lógica del software.

---

## 4. Implementación del Flujo de Envío a Recursos Humanos

### Problema
El practicante necesitaba una acción manual para derivar la papeleta a Recursos Humanos una vez firmada por el Jefe de Área, y RRHH requería su propia bandeja de notificaciones.

### Solución Técnica
*   **Archivos Afectados:**
    *   `app/Domain/ExitSlip/Enums/ExitSlipStatus.php`
    *   `database/migrations/2026_09_29_..._add_submitted_to_hr_status.php`
    *   `app/Domain/ExitSlip/ExitSlip.php`
    *   `app/Http/Controllers/ExitSlipController.php`
*   **Implementación:**
    1.  **Nuevo Estado y Migración:** Se añadió el enum `SUBMITTED_TO_HR` (Enviada a RRHH). Para reflejar esto en la base de datos, se generó y ejecutó una migración utilizando una consulta `DB::statement()` cruda que reemplazó la restricción `CHECK (estado IN (...))` de PostgreSQL, admitiendo este nuevo estado sin destruir los datos existentes.
    2.  **Máquina de Estados (Domain Driven Design):** Se actualizó el modelo de dominio `ExitSlip` agregando métodos booleanos estrictos (`canBeSubmittedToHR()`, `canBeApprovedByHR()`) garantizando que ninguna papeleta pueda "saltarse" pasos.
    3.  **Transiciones y Websockets:** Se añadió la acción `submit_to_hr` en el controlador. Al accionarla, el sistema actualiza el estado y hace un barrido de la base de datos buscando a todos los usuarios con el rol de `hr`, generando una fila en la tabla `notifications` para cada uno y disparando un evento por Websockets (Pusher/Reverb) para que sus campanitas suenen en tiempo real.

---

## 5. Resolución de Validación Silenciosa (Error de Aprobación RRHH)

### Problema
Cuando Recursos Humanos presionaba "Aprobar Papeleta", la página se recargaba pero no sucedía absolutamente nada. La papeleta se quedaba en estado "Enviada a RRHH" y el PDF se generaba sin su firma. Adicionalmente, durante el desarrollo se experimentó un error 500 (ParseError).

### Solución Técnica
*   **Diagnóstico y Reparación:** 
    1.  Al insertar la lógica de RRHH en el bloque condicional del controlador, se crearon accidentalmente dos sentencias `elseif ($action === 'approve')` consecutivas.
    2.  PHP evaluaba el primer bloque (exclusivo para Jefes de Área). Como el usuario de RRHH no era un Jefe, lo descartaba, y por reglas de programación, **se saltaba el segundo bloque completamente**, guardando la papeleta sin cambios.
    3.  **Corrección:** Se unificaron ambos bloques bajo una sola directiva `elseif` anidando las condiciones de `area_head` y `hr` en su interior. Durante la consolidación quedó una llave `}` huérfana, que desencadenó un error sintáctico, el cual fue purgado inmediatamente.

---

## 6. Panel de Administración: Localización y Eliminación

### Problema
En el panel del administrador, los roles de usuario se mostraban crudos en inglés (ej. "practitioner", "hr"), lo que mermaba la profesionalidad del sistema. Además, el panel permitía desactivar cuentas, pero no eliminarlas definitivamente si un trabajador cesaba.

### Solución Técnica
*   **Archivos Afectados:**
    *   `app/Models/User.php`
    *   `resources/js/Pages/Admin/Users/Index.tsx`
    *   `routes/web.php`
    *   `app/Http/Controllers/Admin/UserController.php`
*   **Implementación:**
    1.  **Traducción Dinámica (Accessors):** Se agregó el método `getRolLabelAttribute()` al modelo `User` en Laravel, mapeando automáticamente la etiqueta definida en el Enum (ej. `practitioner` -> "Practicante"). Este atributo virtual se inyectó nativamente a la serialización JSON del modelo usando `$appends`. En React, se actualizó la interfaz TypeScript de los usuarios para aceptar `rol_label` e inyectarlo en la tabla.
    2.  **Destrucción Segura:** Se creó la ruta `admin.users.destroy` (DELETE) y su respectivo método en el `UserController`. Se implementó una **regla de autoprotección** (`if ($user->id === $request->user()->id)`) para impedir que el administrador se elimine a sí mismo.
    3.  **Confirmación UX:** En la vista React, se agregó un botón "Eliminar" en color rojo (`text-red-600`) que lanza una alerta nativa del navegador interrumpiendo la ejecución (`confirm("¿Estás seguro...?")`) para evitar clics accidentales. Finalmente, se recompilaron los *assets* de Vite con `npm run build`.
