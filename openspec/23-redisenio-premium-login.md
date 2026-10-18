# Rediseño premium del login

## Objetivo

La pantalla de acceso se actualizó como una experiencia institucional de alto valor visual. Mantiene el acceso por DNI y contraseña, con prioridad en legibilidad, velocidad y seguridad de uso.

## Interacciones

- El DNI acepta únicamente ocho dígitos y muestra progreso durante el ingreso.
- Al completar el DNI se muestra un indicador visual de documento listo.
- El campo de contraseña conserva la visibilidad conmutable y la alerta de Bloq Mayús.
- El botón principal tiene respuesta de carga y una animación de brillo breve al pasar el cursor.
- La casilla Recordarme convive con una indicación clara de sesión protegida.

## Diseño

Se reforzaron la marca, superficie de formulario, profundidad de los campos, llamada a la acción y soporte institucional. La portada usa la imagen de EPSEL con degradados, anillos de profundidad y un mensaje de trazabilidad por etapas.

### Variante final: centro de control institucional

La composición final abandona la apariencia de formulario genérico: el acceso se presenta sobre una superficie oscura con capas de color corporativo, campos de alto contraste y una acción principal turquesa. El panel visual incorpora una consola de estado, señal de disponibilidad, textura de cuadrícula y anillos animados; estos elementos comunican que el portal está operativo sin distraer del ingreso.

## Accesibilidad y rendimiento

Los campos conservan etiquetas visibles, foco claro, mensajes vinculados de error y atributos de autocompletado. Las capas visuales son CSS; no añaden solicitudes de red. La preferencia de movimiento reducido desactiva animaciones, incluidos los anillos y el brillo del botón.
