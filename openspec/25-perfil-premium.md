# Perfil premium

## Objetivo

Convertir la vista de perfil en una ficha institucional elegante que permita reconocer el estado de la cuenta y editar datos sin perder claridad.

## Experiencia

- La cabecera presenta la identidad de la persona, su rol, una marca de cuenta activa y atributos institucionales.
- Las pestañas conservan la separacion entre informacion personal, firma y seguridad. El administrador no visualiza la pestaña de firma.
- La seccion de identidad ofrece contexto antes de editar la fotografia o los datos personales.
- Los formularios incorporan superficies, foco y estados deshabilitados con mayor contraste visual.
- El modo oscuro cuenta con superficies y bordes especificos para mantener legibilidad.

## Accesibilidad

La estructura usa pestañas con roles ARIA, controles con etiquetas existentes y estados de foco visibles. Los efectos de elevacion se eliminan para personas que solicitan movimiento reducido.

## Validacion

Se ejecuto `npm run typecheck` sin errores de TypeScript.
