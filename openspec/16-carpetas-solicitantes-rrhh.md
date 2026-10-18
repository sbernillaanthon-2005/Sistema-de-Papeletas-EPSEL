# Carpetas de solicitantes en la bandeja de RRHH

## Propósito

La bandeja de papeletas de Recursos Humanos presenta un explorador de expedientes por solicitante. Cada carpeta agrupa únicamente las papeletas que RRHH ya tiene permitido consultar; abrirla aplica un filtro por usuario sobre la misma bandeja.

## Información de cada carpeta

- Nombre completo y DNI del solicitante.
- Número de papeletas visibles para RRHH.
- Indicador de papeletas en estado `submitted_to_hr`, que aún esperan firma o decisión de RRHH.
- Búsqueda local de carpetas por nombre o DNI.

La carpeta «Todas las papeletas» elimina el filtro y muestra nuevamente el ámbito completo. Los filtros de estado, fecha y texto continúan funcionando junto al filtro de carpeta.

## Mejoras de UX implementadas (2026-10-13)

### Buscador de carpetas (cliente-side)
- **Contador dinámico de resultados**: Muestra "N de M carpetas" al filtrar, o el total de solicitantes en reposo.
- **Botón X para limpiar**: Aparece solo cuando hay texto escrito, limpia el campo con un click.
- **Estado vacío elaborado**: Muestra icono, mensaje con el término buscado y botón "Limpiar búsqueda" en lugar de un texto plano.
- **Animación focus**: El campo obtiene borde coloreado y glow al recibir foco; el ícono de lupa cambia de color.
- **Scroll suave**: El grid de carpetas tiene scrollbar estilizada y altura máxima de 320px.

### Tarjetas de carpeta (diseño premium)
- Borde de 1.5px con transición de color en hover.
- Hover con `translateY(-2px)` y sombra profunda.
- Selección activa con gradiente sutil y doble borde (outline + box-shadow).
- Icono de carpeta con gradiente; al seleccionar se invierte a teal sólido con sombra.
- Chip de pendientes con gradiente amarillo y borde, más legible.
- Variante "Todas las papeletas" con paleta azul diferenciada.

### Buscador principal de la bandeja (servidor)
- **Debounce de 350ms**: La búsqueda se dispara automáticamente 350ms después de dejar de escribir, sin necesidad de presionar Enter o el botón "Filtrar".
- **Sin petición extra en montaje**: Se usa un flag `isMounted` para no disparar una petición redundante al cargar la página.
- El botón "Filtrar" permanece para envíos manuales y la tecla Enter sigue funcionando.

## Seguridad

El agrupamiento se calcula después de limitar el query a los estados permitidos para RRHH. No modifica `ExitSlipPolicy` ni concede acceso a borradores, solicitudes aún no derivadas a RRHH u otros documentos fuera de ese ámbito.

## Archivos modificados

| Archivo | Tipo de cambio |
|---|---|
| `resources/js/Pages/ExitSlips/Index.tsx` | UX: buscador carpetas + debounce bandeja |
| `resources/css/portal.css` | Estilos premium explorador de carpetas |

