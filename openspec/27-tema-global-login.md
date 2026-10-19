# Tema global incluido en el login

## Objetivo

Mantener una sola preferencia visual para todo el sistema, incluida la página de acceso.

## Funcionamiento

- La preferencia se guarda bajo la clave local `epsel-theme`.
- El portal autenticado y el login leen la misma clave.
- Al elegir modo oscuro en el portal, el login se abre en modo oscuro después de cerrar sesión o navegar a `/login`.
- Al elegir modo claro, el login utiliza superficies claras, campos claros y una portada con capas más luminosas.
- El login cuenta con un botón propio para alternar el tema antes de autenticarse.

## Accesibilidad

El botón expone una etiqueta y estado presionado para lectores de pantalla. Sus transiciones se desactivan cuando el navegador solicita movimiento reducido.
