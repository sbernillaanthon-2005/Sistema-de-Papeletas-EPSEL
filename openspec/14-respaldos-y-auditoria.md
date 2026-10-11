# Respaldos y auditoría administrativa

## Objetivo

Este módulo entrega al rol `admin` dos controles operativos: descargar un respaldo completo de la base PostgreSQL y consultar un registro central de actividad. No sustituye los historiales propios de cada papeleta; los complementa con trazabilidad de administración y seguridad.

## Acceso

Las rutas se ubican bajo `/admin` y utilizan el middleware `role:admin`:

| Ruta | Método | Propósito |
| --- | --- | --- |
| `/admin/backups` | GET | Consola interactiva de respaldos con monitoreo de estado y asistente de restauración. |
| `/admin/backups/download` | POST | Genera y descarga un respaldo binario completo de PostgreSQL. |
| `/admin/audit` | GET | Consulta filtrable del registro de auditoría. |

Los demás roles reciben la restricción de rol antes de llegar a los controladores.

## Respaldo de PostgreSQL

`App\Support\DatabaseBackup` utiliza `pg_dump` con formato personalizado de PostgreSQL:

```text
pg_dump --format=custom --no-owner --no-privileges
```

El resultado incluye esquema y datos de la conexión configurada por Laravel. Se genera en `storage/app/backups` con un nombre único, se entrega como archivo `.dump` y se borra al finalizar la respuesta. Por esa razón la aplicación no mantiene una colección de copias descargables ni expone respaldos mediante URL pública.

La imagen PHP instala `postgresql-client`, requisito para disponer de `pg_dump`. Tras modificar el Dockerfile se debe reconstruir el servicio:

```bash
docker compose up -d --build app reverb queue-worker
```

Una restauración debe hacerla personal técnico autorizado desde una ubicación segura. Ejemplo orientativo:

```bash
pg_restore --clean --if-exists --no-owner --dbname=DESTINO archivo.dump
```

El archivo contiene información del sistema. Debe conservarse cifrado, con acceso mínimo y fuera del repositorio. Nunca se registra la contraseña de la base ni se guarda en la tabla de auditoría.

## Auditoría central

La migración `2026_10_10_200000_create_audit_logs_table.php` crea `audit_logs`. Cada entrada registra:

- actor autenticado, cuando todavía exista la cuenta;
- acción y descripción legible;
- tipo e identificador del recurso afectado;
- contexto no sensible, como rol o formato del respaldo;
- dirección IP, agente de usuario y fecha.

`App\Support\AuditLogger` es el único punto para registrar estos eventos. Evita que los controladores dupliquen la estructura y recuerda no enviar contraseñas, tokens, archivos ni SQL en `metadata`.

Acciones incorporadas:

| Acción | Origen |
| --- | --- |
| `session.started` / `session.ended` | Inicio y cierre de sesión. |
| `user.created` | Alta de una cuenta desde Administración. |
| `user.updated` | Cambio de acceso, área o jefe asignado. |
| `user.deleted` | Eliminación de una cuenta. |
| `backup.downloaded` | Descarga exitosa de un respaldo. |

El historial de transiciones de una papeleta permanece en `exit_slip_transitions`; el registro central permite al administrador revisar en una sola pantalla la operación administrativa y de seguridad.

## Operación y límites

- La descarga depende de que PostgreSQL sea accesible desde el contenedor de la aplicación y de que `pg_dump` esté instalado.
- Si la exportación falla, no se emite una entrada `backup.downloaded`; la interfaz muestra un error genérico y el detalle se reporta solo en el log del servidor.
- El módulo no programa copias automáticas ni restaura bases desde la interfaz. Esas acciones requieren una política de retención, cifrado, almacenamiento externo y autorización independiente.
- La tabla de auditoría es de solo lectura en la interfaz. Su retención deberá definirse antes de producción según la política institucional.
