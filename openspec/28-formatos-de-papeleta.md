# Formatos de papeleta administrables

## Objetivo

Permitir que Administración gestione el PDF de referencia que el personal consulta antes de crear una papeleta.

## Flujo

1. Administración abre **Formatos de papeleta** desde el menú lateral.
2. Revisa la vista previa del formato vigente.
3. Sube un archivo PDF de hasta 10 MB con un nombre de versión.
4. Puede activarlo al cargarlo o conservarlo en historial para revisarlo después.
5. Al activar una versión, el formato anteriormente activo deja de estar publicado.
6. Las personas solicitantes pueden abrir **Ver formato de papeleta vigente** desde el formulario de nueva papeleta.

## Formato base

Cuando no hay un PDF personalizado activo, la vista presenta una referencia del formato operativo que el sistema genera actualmente. Esto permite mantener visible el diseño vigente desde el primer uso.

## Seguridad y trazabilidad

- Los PDFs se guardan en el disco privado y se entregan solo a personas autenticadas.
- Solo el rol Administrador puede cargar, editar, activar o eliminar formatos.
- Al eliminar la versión activa, el portal vuelve al formato base protegido del sistema.
- Cargar, editar, activar y eliminar genera una entrada de auditoría.

## Alcance

El módulo publica un documento de referencia visual. La generación de papeletas reales mantiene sus reglas, datos y firmas actuales; adaptar automáticamente campos a un PDF externo requiere una futura configuración de mapeo de campos.

## Validación

- Migración `2026_10_19_100000_create_exit_slip_formats_table` ejecutada correctamente.
- `npm run typecheck` ejecutado sin errores.
- Sintaxis PHP y rutas del módulo verificadas con Artisan.
# Formato base vigente

El formato inicial que el módulo presenta ahora es `Autorizacion_salida_practicante_EPSEL.pdf`.
Está versionado en `src/resources/pdf/` y se entrega como referencia vigente cuando el administrador todavía no ha publicado una versión personalizada. Al activar una carga desde el módulo, esta reemplaza temporalmente la vista base para todo el personal.

## CRUD de versiones cargadas

- **Crear:** carga una nueva versión PDF y puede activarla de inmediato.
- **Editar:** actualiza el nombre y, si corresponde, sustituye el archivo PDF de una versión existente.
- **Eliminar:** elimina una versión cargada o el formato base. Si no queda ninguna versión publicada, el portal informa al personal que Administración está actualizando la nueva papeleta.

En la vista previa del formato vigente se muestran las acciones correspondientes. Si Administración retira el formato base y no hay una versión personalizada activa, la vista de Administración muestra un estado sin publicación y el formulario de papeletas informa al personal: “Actualmente el administrador está actualizando la nueva versión de papeleta. Ponte en contacto con él.”

