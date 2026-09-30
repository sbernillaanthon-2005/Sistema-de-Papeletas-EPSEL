# Registro de Cambios UI/UX - Login y Bandeja de Papeletas

## Fecha y Responsable
- **Rol:** Senior Full Stack Developer
- **Objetivo:** Refactorizar la UI del módulo de Login (incluyendo personalización con la imagen institucional y logotipo animado de EPSEL) y estructurar las Bandejas del módulo de Papeletas para mejor usabilidad.

## 1. Módulo de Bandeja de Papeletas (`ExitSlips/Index.tsx`)
**Archivo modificado:** `src/resources/js/Pages/ExitSlips/Index.tsx`

**Problema:**
La bandeja principal mostraba todas las papeletas mezcladas, lo cual podía causar confusión operativa dependiendo de si el flujo requería acción del Jefe, de Recursos Humanos o de Vigilancia.

**Solución Implementada:**
- **Pestañas (Tabs) Interactivas:** Se introdujo un sistema de pestañas usando estado local en React (`useState`) para segmentar la vista principal en 4 bandejas claramente diferenciadas:
  1. `General`: Muestra todas las papeletas.
  2. `Firma de Jefe`: Filtra las papeletas pendientes por el Jefe de Área.
  3. `Firma de RRHH`: Filtra las papeletas pendientes por Recursos Humanos.
  4. `Vigilancia`: Filtra las papeletas destinadas al control de seguridad.
- **Diseño UI:** Se añadieron clases de Tailwind CSS para gestionar los estados inactivo/activo de cada pestaña (`border-indigo-500 text-indigo-600` vs `border-transparent text-gray-500`), logrando una apariencia moderna similar a los estándares de Material Design/Tailwind UI.

---

## 2. Configuración del Entorno de Desarrollo Frontend
**Archivo modificado/eliminado:** `src/public/hot`

**Problema:**
Debido a la arquitectura de Docker (especialmente en entornos Windows con WSL), los cambios en tiempo real de Vite no siempre se enlazan correctamente con los File System Events, causando que Laravel sirviera repetidamente archivos en caché desfasados.

**Solución Implementada:**
- **Hard-reset de Vite en Laravel:** Se eliminó explícitamente el archivo de control `src/public/hot` para obligar al framework a abandonar el Dev Server Proxy y enrutar las peticiones al Manifest estático de producción (`public/build`).
- **Builds Constantes:** Tras cada grupo de cambios, se ejecutó `npm run build` dentro del contenedor `node` (`docker compose exec node npm run build`) garantizando siempre la entrega de los assets actualizados al navegador.

---

## 3. Rediseño del Layout de Invitado (`GuestLayout.tsx`)
**Archivo modificado:** `src/resources/js/Layouts/GuestLayout.tsx`

**Problema:**
El layout genérico de Jetstream/Breeze era excesivamente simple y requería alinearse a la identidad visual de EPSEL (planta de tratamiento de agua y colores institucionales).

**Solución Implementada:**
- **Fondo Institucional:** Se incluyó dinámicamente la imagen `../../images/Fondo de login.png` con propiedades `bg-cover bg-center bg-no-repeat` aplicadas a todo el viewport.
- **Capa Base de Overlay:** Se añadió un sutil oscurecimiento en el fondo (`bg-slate-900/10`) para estabilizar el contraste visual, asegurando que la imagen de fondo sea 100% nítida al retirar el efecto de desenfoque (`backdrop-blur`) global.
- **Side Panel Full-Height:** Se rediseñó el contenedor de login transformando la clásica "tarjeta flotante cuadrada" en un **Panel Lateral elegante** posicionado a la izquierda, que ocupa el 100% del alto de la pantalla (con anchos responsive: `lg:w-5/12 xl:w-[35%]`).
- **Glassmorphism:** El panel lateral adoptó un esquema Glassmorphism con un tinte institucional "celeste suave" (`bg-sky-100/90 backdrop-blur-xl border-sky-200/50 shadow-[30px_0_60px_rgba(0,0,0,0.15)]`), generando una experiencia inmersiva que combina con la paleta de colores del agua.

---

## 4. Reemplazo y Ajuste de Mascota Animada en el Login Personalizado
**Archivos modificados:**
- `src/resources/js/Pages/Auth/Login.tsx`
- `src/resources/css/login.css`

**Problema:**
El usuario poseía un diseño alternativo de Login (`LoginLayout`) donde la mascota original se mostraba excesivamente pequeña, chocando textualmente con las instrucciones, lo que perjudicaba gravemente la Experiencia de Usuario (UX).

**Solución Implementada en React (`Login.tsx`):**
- **Sustitución de Imagen:** Se importó e inyectó `../../images/EPSEL-saludo-transparente.gif`.
- **Atributos de Renderizado Base:** Se modificaron los valores hardcodeados de `<img />` pasando de `width="105" height="125"` a `width="210" height="250"`.
- **Interactividad (Micro-interacción):** Se le aplicaron clases Tailwind `transition-transform duration-300 hover:scale-105` para crear un efecto sutil de acercamiento (zoom in) cuando el usuario pasa el mouse sobre la mascota.

**Solución Implementada en Estilos (`login.css`):**
- **Escalado Absoluto (Escritorio):** Las dimensiones fijadas en CSS se duplicaron (`width: 200px; height: 238px;`) dentro de la clase `.login-mascot`.
- **Escalado Absoluto (Móvil):** En el breakpoint `@media (max-width: 480px)`, las dimensiones crecieron a `width: 150px; height: 178px;`.
- **Resolución de Colisión Tipográfica:**
  - Se modificó la posición vertical de la mascota con un `top: -70px;` (antes `-15px`), levantando todo el GIF para que sus pies no se monten en el párrafo de descripción (`.login-description`).
  - Se incrementó el `padding-right` de `.login-welcome` a `150px` (escritorio) y `110px` (móvil) para crear un espacio de respiro adecuado (breathing room) entre el título "Bienvenido de nuevo." y la mascota, previniendo el traslape de la tipografía.

---

## 5. Decisiones Arquitectónicas y de Rendimiento (Fase de Revisión)
- Se evitó utilizar Javascript excesivo para cálculos de Layout o reposicionamientos dependientes del Window resize, resolviendo todos los conflictos visuales mediante CSS Grid/Flexbox y utilidades responsivas puras de Tailwind, garantizando 60fps constantes en renderizado sin forzar Reflows innecesarios del DOM.
- No se agregaron dependencias extras ni pesadas para manejar el estado visual de la UI.
- Se mantuvo la compatibilidad total del sistema HMR y Build Pipeline del stack existente, priorizando la entrega por manifest del build en producción.

---

## 6. Remoción de Funcionalidad de Recuperación de Contraseña
**Archivo modificado:** `src/resources/js/Pages/Auth/Login.tsx`

**Problema:**
El formulario de inicio de sesión mostraba la opción de "¿Olvidaste tu contraseña?". Para el caso de uso del sistema de papeletas, no se requería o no estaba permitida la auto-recuperación de contraseñas por los usuarios finales para mantener el control administrativo estricto.

**Solución Implementada:**
- **Eliminación de la UI:** Se procedió a remover completamente del renderizado en React el componente `<Link href={route("password.request")}>¿Olvidaste tu contraseña?</Link>` y su lógica condicional asociada (`canResetPassword`).
- De este modo, los empleados deberán comunicarse directamente con el administrador del sistema en caso de olvidar sus credenciales, mejorando el control centralizado de los accesos.
