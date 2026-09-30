# Portal EPSEL por roles

## Interfaces

- Navegación lateral, menú móvil accesible, tipografía Figtree y paleta azul marino, turquesa y blanco.
- Administración: directorio con filtros de nombre/DNI, rol y acceso; indicadores globales; diálogos de creación, asignación de área/jefe y eliminación.
- Jefatura y RRHH: bandejas de revisión con estados, búsqueda, fecha autorizada y paginación del servidor.
- Vigilancia: papeletas autorizadas y finalizadas, indicador de personal fuera de sede y registro de salida/retorno.
- Practicantes y trabajadores: resumen personal, borradores, formulario, firma y vista previa PDF.
- Detalle: avance de etapas, historial con actor y fecha, acciones según permisos del servidor y rechazo con motivo obligatorio.
- Perfil: información personal, firma y seguridad en secciones independientes.
- Campana: icono uniforme, contador, cierre con Escape o clic exterior; conserva notificaciones y suscripciones existentes.

## Comportamiento y correcciones

El flujo conserva el envío manual del solicitante a RRHH después de la aprobación del jefe:

`draft → submitted → approved_by_area → submitted_to_hr → approved_by_hr → completed`

Se restablecen las políticas del servidor para crear, consultar, editar, generar PDF y cambiar estados. Las transiciones usan el servicio de flujo con bloqueo transaccional; no dependen de que el navegador oculte botones. RRHH recibe la notificación al enviarse la solicitud a su etapa. Vigilancia registra movimientos únicamente en la fecha autorizada.

Los filtros se aplican dentro del ámbito del usuario. Los indicadores se calculan antes del filtro, para mostrar el resumen de su bandeja completa. El formulario utiliza `worker` como plantilla del personal, valida el rango horario y utiliza la fecha de Lima. La eliminación de una firma del perfil conserva los archivos utilizados en papeletas ya firmadas.

## Validación

- `docker compose exec -T app php artisan test`: 34 pruebas y 434 aserciones aprobadas.
- `docker compose exec -T node npm run build`: comprobación TypeScript y compilación Vite.
- Archivos PHP revisados con Pint; componentes y estilos formateados con Prettier.
- Chrome: las seis cuentas verificadas en escritorio (1440 px) y móvil (390 px), con navegación, menú y perfil; formularios para los roles solicitantes y detalles disponibles. Sin errores de JavaScript ni desbordamiento de la página en estas comprobaciones. Las tablas amplias conservan desplazamiento horizontal dentro de su contenedor.
- Las pruebas del flujo cubren firmas, PDF, rechazo/corrección, envío manual a RRHH, vigilancia, aislamiento de permisos, filtros y paginación.

Las pruebas automatizadas de escritura usan la base `epsel_papeletas_test`. Las comprobaciones de las cuentas locales en navegador se limitan a navegación y apertura de formularios.
