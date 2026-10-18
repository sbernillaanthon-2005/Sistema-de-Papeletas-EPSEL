# Dashboard de administracion v2

## Objetivo

Reorganizar el panel administrativo para que la persona administradora pueda reconocer que requiere accion antes de entrar al directorio de usuarios.

## Estructura de lectura

1. Cabecera de control con el estado de accesos y papeletas pendientes.
2. Accesos rapidos para registrar usuarios, abrir bandeja, consultar auditoria y administrar respaldos.
3. Indicadores de personal y un bloque destacado para papeletas detenidas y recordatorios.
4. Analitica de flujo, demanda y cobertura por rol.
5. Directorio de personal con filtros y acciones administrativas.

## Diseno

La variante usa superficies de cristal, color institucional azul turquesa, tarjetas con profundidad constante, acciones principales claras y un modo oscuro equivalente. El diseno se mantiene adaptable en escritorio, tablet y movil; en pantallas pequenas los accesos se presentan en una sola columna.

## Interaccion

Los accesos rapidos llevan a modulos existentes. Las filas de los graficos conservan enlaces hacia sus vistas filtradas. El control de recordatorio mantiene su funcionamiento actual y los avisos continúan llegando mediante la campana en tiempo real.

## Validacion

Se ejecuto `npm run typecheck` sin errores.
