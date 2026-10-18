# Tailwind CSS y renovacion visual del portal

## Objetivo

Incorporar Tailwind CSS mediante el plugin oficial de Vite y renovar la apariencia compartida del portal sin sustituir las reglas funcionales existentes.

## Integracion

- Se instalan `tailwindcss` y `@tailwindcss/vite`.
- Vite registra el plugin oficial antes del plugin de Laravel.
- `resources/css/app.css` usa `@import "tailwindcss"` y define tokens EPSEL para color y tipografia.
- La aplicacion conserva las hojas de estilo especializadas del portal y del login; Tailwind complementa el sistema con utilidades y tokens, en lugar de duplicar toda la interfaz.

## Diseno aplicado

El contenedor autenticado incorpora la capa `portal-tailwind-shell`. Esta capa entrega una navegacion lateral institucional en azul profundo, superficies translucidas, una barra superior con efecto de cristal, tarjetas con profundidad consistente, acciones principales con gradiente turquesa y estados oscuros equivalentes. Las animaciones de elevacion usan solo transformacion y se desactivan cuando el sistema solicita movimiento reducido.

## Validacion esperada

La compilacion `npm run build` debe finalizar sin errores de TypeScript ni de Vite. El modo claro y oscuro se verifican desde el control de tema del encabezado.
