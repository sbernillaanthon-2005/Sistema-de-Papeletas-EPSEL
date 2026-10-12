# Seguimiento operativo y recordatorios de firma

## Objetivo

El administrador puede detectar de inmediato qué papeletas no completaron el circuito, en qué etapa se detuvieron y quién debe intervenir. El tablero diferencia una **firma pendiente** de una **derivación pendiente** para no atribuir incorrectamente una responsabilidad.

## Etapas y responsable

| Estado | Etapa visible | Responsable |
| --- | --- | --- |
| `submitted` | Firma del jefe de área | Jefe asignado a la papeleta |
| `approved_by_area` | Derivación a RRHH | Solicitante |
| `submitted_to_hr` | Firma de Recursos Humanos | Usuarios activos de RRHH |
| `approved_by_hr` | Derivación a Vigilancia | Solicitante |
| `submitted_to_security` | Registro y firma de Vigilancia | Usuarios activos de Vigilancia |

Los estados completado, rechazado y borrador no se consideran detenidos. Cada registro lleva al detalle de la papeleta.

## Recordatorios

El control **“Recordar cada”** del dashboard permite elegir un intervalo de 1 a 1,440 minutos. Laravel Scheduler evalúa el trabajo cada minuto, pero el comando `exit-slips:send-reminders` solo crea otra alerta si transcurrió el intervalo configurado desde el último aviso de esa papeleta y ese destinatario.

La notificación se persiste con tipo `SIGNATURE_REMINDER`, se publica en el canal privado de Laravel Reverb y aparece en la campana sin requerir una recarga. Solo se emite para las etapas que realmente requieren firma: jefe, RRHH y vigilancia.

## Operación en producción

El servicio Docker `scheduler` mantiene `php artisan schedule:work` activo. En una instalación sin Docker se requiere ese proceso o un cron que ejecute `php artisan schedule:run` cada minuto. Reverb y el worker de cola deben operar como los demás servicios de tiempo real. Para una verificación manual se puede ejecutar:

```bash
php artisan exit-slips:send-reminders
```

La configuración queda registrada en Auditoría con la acción `exit_slip.reminder_interval_updated`.
