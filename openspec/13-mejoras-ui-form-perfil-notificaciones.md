# Registro de Cambios UI — Formulario, Perfil y NotificationBell

## Fecha: 02/10/2026 — Senior Full Stack Developer

## Archivos modificados
- ExitSlips/Form.tsx — Rediseño: formulario por pasos (stepper)
- Profile/Edit.tsx — Rediseño: perfil premium con badges de estado y tabs ARIA
- NotificationBell.tsx — Sonido Web Audio API + UI premium del panel
- portal.css — ~800 líneas aditivas (pf-*, pp-*, nb-*)

## Formulario por pasos
- Indicador de 3 pasos clicable (pf-steps/pf-step): numerado, ✓ al completar, linea conectora
- Radio-cards visuales para tipo de papeleta (emoji 🎓/💼)
- Chips pill para motivo de salida (🏠/🏥/📋/📌)
- Barra de progreso de caracteres (pf-char-bar) que cambia a rojo >90%
- Spinner CSS puro al procesar (pf-spinner)
- Cada panel se activa con borde teal al estar en foco (pf-panel--active)

## Perfil de usuario
- Hero con avatar grande, badges de estado firma/foto directamente visibles
- Tabs con ARIA completa: role=tablist/tab/tabpanel, aria-selected, aria-controls
- Iconos emoji por seccion: 📷 Foto, ✏️ Datos, ✍️ Firma, 🔑 Password, ⚠️ Zona riesgo
- Panel lateral de firma con lista de consejos y badge de estado sobre fondo blanco
- Sección de zona de riesgo con borde y fondo rosado diferenciado

## NotificationBell — Sonido
- Funcion playNotificationSound() con Web Audio API (sin archivos externos)
- 3 osciladores sine: do5/mi5/sol5 (523/659/784 Hz), ~500ms
- Solo suena cuando newUnread > prevUnreadRef.current Y no es carga inicial
- Badge con animacion CSS pulse (nb-badge-pulse)
- Panel premium con header, lista de items con punto indicador, estado vacío

## Build: TypeScript OK + Vite build 4.18s sin errores
