# Respaldos automáticos de PostgreSQL

## Programación

El Scheduler de Laravel ejecuta `backups:run-automatic` dos veces al día, a las **00:00** y **12:00** con zona horaria `America/Lima`.

## Almacenamiento y retención

- Cada copia se genera con `pg_dump` en formato custom `.dump`.
- Se conserva de forma privada en `storage/app/private/backups/automatic`.
- Se registra su nombre, tamaño y fecha en `scheduled_database_backups`.
- Se retienen las 30 copias más recientes; las anteriores se eliminan junto con su archivo.

## Administración

El módulo **Respaldos** lista las copias automáticas y permite descargarlas. Las descargas manuales conservan su comportamiento temporal y auditado actual.
