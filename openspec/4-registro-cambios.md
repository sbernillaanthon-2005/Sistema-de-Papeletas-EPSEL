# Registro de Cambios: Mejoras UX y Generación PDF

## 1. Contexto

Este documento actúa como un registro histórico y técnico (Changelog) enfocado en las recientes mejoras de la interfaz de usuario (Perfil) y la estabilización del renderizado de las papeletas (PDF) para el Sistema de Control de Papeletas EPSEL. Como programador senior, los cambios detallados a continuación han seguido un flujo de diagnóstico, ejecución controlada y construcción para producción.

---

## 2. Renderizado Dinámico de Firmas (Estado: Borrador)

### Problema
Al previsualizar el PDF de una papeleta que se encontraba en estado **BORRADOR** (`draft`), la firma del practicante no era inyectada en la vista ya que el modelo `ExitSlip` todavía no poseía guardada la ruta de la misma.

### Solución Técnica
*   **Archivos Afectados:** `app/Http/Controllers/ExitSlipController.php`
*   **Implementación:** Se incluyó una validación en el método `generatePdf()` que detecta si el estado de la papeleta es de borrador y si `$exitSlip->firma_practicante_path` es nulo.
*   En ese escenario, el controlador consulta la firma oficial asociada al perfil del usuario autenticado o creador de la papeleta (`User->signature->ruta_archivo`) y la inyecta al vuelo durante la lectura en base64 de las imágenes.
*   Se unificó el uso del disco `private` dentro de `getSignatureBase64()` garantizando la coherencia de lectura segura para los archivos subidos al storage.

---

## 3. Calibración y Renderizado de "Fecha Autorizada" (PDF)

### Problema
En la plantilla "Practicantes" (`Autorizacion_salida_practicante_EPSEL_Full_HD.png`), existían 6 cajilleros tanto para la "Fecha de Emisión" como para la "Fecha Autorizada". No obstante, el sistema extraía la fecha autorizada en formato largo `dmY` (8 dígitos, ej: `28092026`). Al forzar 8 dígitos sobre 6 cajilleros y manejar coordenadas incorrectas, los números se superponían y se salían de las cajas.

### Solución Técnica
*   **Archivos Afectados:**
    *   `resources/views/pdf/exit-slip.blade.php`
    *   `resources/views/calibrador.blade.php`
*   **Implementación:**
    1.  **Ajuste de Formato:** Se modificó la extracción PHP a 6 caracteres (`dmy` -> `280926`), usando los índices 0 al 5.
    2.  **Calibración CSS Inicial:** Se eliminaron las clases obsoletas de `exit-slip.blade.php` y se recalcularon los puntos de separación (`top` y `left`) asignando una distribución uniforme de `~27px` horizontales partiendo de la coordenada inicial.
    3.  **Herramienta de Calibración:** Se actualizó `calibrador.blade.php` igualando los mismos 6 dígitos, permitiendo así realizar ajustes milimétricos mediante *drag & drop* (arrastrar y soltar) con un mouse.
    4.  **Sincronización:** Una vez calibradas las coordenadas exportadas, se inyectaron de vuelta a `exit-slip.blade.php`.
*   **Prevención de Riesgos:** Durante el volcado de nuevas posiciones absolutas se garantizó no sobreescribir ni romper parámetros como `font-size: 20px`, `font-weight: bold`, `object-fit: contain` o las proporciones nativas de las firmas.

---

## 4. Protección y Modo Lectura del Frontend (Perfil React/Inertia)

### Problema
Los campos de perfil ("Nombres" y "Apellidos") y los campos de seguridad ("Contraseña Actual", "Nueva Contraseña") en la vista principal `Profile/Edit` se encontraban permanentemente abiertos para su escritura. Esto representaba un riesgo para la experiencia del usuario (UX), donde clics accidentales o teclazos podían alterar la información o lanzar peticiones no deseadas.

### Solución Técnica
*   **Archivos Afectados:**
    *   `resources/js/Pages/Profile/Partials/UpdateProfileInformationForm.tsx`
    *   `resources/js/Pages/Profile/Partials/UpdatePasswordForm.tsx`
*   **Implementación:**
    1.  **Estado Reactivo (`isEditing`):** Se implementó un estado por defecto inicializado en `false`.
    2.  **Atributo Disabled:** Se ligó el comportamiento de los campos de texto al valor negado del estado (`disabled={!isEditing}`).
    3.  **Habilitador Condicional:** Se agregó un botón secundario llamado **"Actualizar Datos"** para ambos componentes, visible únicamente cuando `isEditing` es falso. Al accionarlo, se desbloquean los campos y el componente revela dinámicamente los botones de acción ("Guardar" / "Cancelar").
    4.  **Botón Cancelar (Fail-safe):** En caso de retractarse, el botón "Cancelar" hace un reseteo de Inercia (`reset()`) que descarta los textos basuras ingresados para recuperar la última data y re-bloquear los inputs.
    5.  **Cierre Tras Éxito:** Únicamente usando la respuesta asincrónica `onSuccess()` se vuelve a deshabilitar el formulario.

---

## 5. Compilación del Frontend (Resolución Vite)

### Problema
A pesar de salvar los cambios sobre el código React TypeScript (`.tsx`), el navegador continuaba cargando el renderizado anterior.

### Solución Técnica
*   **Diagnóstico:** El archivo obsoleto `public/hot` se encontraba activo en el directorio. Este archivo fuerza a Laravel Vite a esperar la inyección de una memoria viva (`npm run dev`) e ignora el paquete estático (producción).
*   **Resolución:** Se eliminó el "lock-file" de Vite (`public/hot`).
*   **Integración Continua:** Se ejecutó una nueva resolución de dependencias (`npm install`) tras notar una advertencia de Typescript (tsc), finalizando con un `npm run build` en el directorio `src/`, lo cual sobrescribió todo el paquete final `public/build/assets/` permitiendo la distribución instantánea de los cambios descritos en la sección 4 al navegador.
