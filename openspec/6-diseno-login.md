# Rediseño del acceso — 29/09/2026

## Alcance

Se renovó exclusivamente la pantalla de inicio de sesión. Se conservan la mascota
animada y la fotografía seleccionadas por el usuario. El nuevo `LoginLayout` es
independiente de `GuestLayout`, que sigue atendiendo las otras pantallas de acceso.

- Composición de dos paneles en escritorio y formulario de una columna en móvil.
- Tipografía Figtree existente, jerarquía de títulos, espaciado y colores azul/verde.
- Campos con iconos, etiquetas visibles, autocompletado y foco perceptible.
- Botón de ingreso de ancho completo, estados de carga y protección contra doble envío.
- Mostrar/ocultar contraseña, aviso de Bloq Mayús y errores asociados a sus campos.
- CSS limitado a clases `login-*`, sin alterar los componentes de formularios del sistema.

No se modificaron rutas, autenticación, roles, credenciales ni base de datos.

## Archivos

- `src/resources/js/Pages/Auth/Login.tsx`
- `src/resources/js/Layouts/LoginLayout.tsx`
- `src/resources/js/Components/LoginIcon.tsx`
- `src/resources/css/login.css`

## Verificación

- `docker compose exec -T node npm run build`: TypeScript y Vite correctos.
- Revisión en Chrome a 1440, 617, 390 y 320 px; sin desbordamiento horizontal
  ni errores de JavaScript.
- Comprobación de mostrar/ocultar contraseña y de la casilla Recordarme.
- Credenciales ficticias rechazadas correctamente: error visible y asociado al campo,
  contraseña limpiada, botón habilitado nuevamente y enlace de recuperación operativo.
- Capturas locales de revisión en `src/storage/app/qa/login-*.png`.
