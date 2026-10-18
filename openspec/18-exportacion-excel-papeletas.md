# Exportación Excel de papeletas

## Objetivo

La bandeja de papeletas incluye el botón **Exportar Excel**. Genera un archivo compatible con Microsoft Excel con los registros visibles para la cuenta que realiza la descarga.

## Alcance y filtros

La exportación conserva los filtros activos de búsqueda, estado, fecha y, para Recursos Humanos, solicitante. Incluye código, solicitante, DNI, fecha y horario autorizados, motivo, detalle, estado y los movimientos de salida y retorno.

El servidor vuelve a aplicar el ámbito de acceso antes de generar el archivo: los solicitantes solo exportan sus propias papeletas, jefaturas las de su ámbito, RRHH las recibidas en su etapa, vigilancia las autorizadas para control y administración las que puede supervisar. El botón no concede acceso adicional.

## Formato

El archivo utiliza SpreadsheetML con extensión .xls, por lo que se abre directamente con Microsoft Excel, LibreOffice y aplicaciones compatibles. No se requiere instalar paquetes adicionales en el servidor.
