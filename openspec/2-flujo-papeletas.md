# Fases 3–6: implementación y operación

## Alcance

La numeración vigente es la del plan solicitado: 0 base, 1 dominio/BD,
2 autenticación/firmas, 3 formulario/vista previa/PDF, 4 aprobaciones,
5 notificaciones y 6 paneles/verificación. El README inicial usaba una
numeración diferente y describía varias piezas que aún no estaban conectadas.

El sistema implementa:

- Borradores editables, datos personales tomados del usuario autenticado,
  motivo y detalle obligatorio, fechas validadas en America/Lima y horario válido.
- Numeración anual transaccional, incluyendo creación concurrente de la secuencia.
- Envío con firma al jefe activo asignado; aprobación del jefe y luego de RRHH.
- Rechazo con motivo; vuelta a borrador que limpia firmas y aprobaciones antes de reenviar.
- Historial con el actor real de cada transición.
- PDF autenticado con las firmas registradas y fechas de aprobación. Los documentos
  que no están aprobados por RRHH indican que no autorizan la salida.
- Registro de salida/retorno por vigilancia en la fecha autorizada, sin duplicados.
- Bandejas paginadas y contadores por rol, administración de usuarios y campana responsive.
- Notificaciones persistentes y eventos privados Reverb después del commit; lectura
  individual o de todas las notificaciones. La campana consulta también al recuperar
  el foco y cada minuto para recuperar notificaciones después de una desconexión.

No se encontró una plantilla oficial adjunta en el repositorio: el PDF utiliza un
formato funcional con los campos existentes. Su fidelidad visual a un formato
institucional específico requiere comparar con dicho original. Las firmas son
imágenes estampadas con auditoría, no certificados criptográficos.

## Arquitectura y reglas

Se conservaron entidades y acciones en Domain/Application. La coordinación de
transacciones, Policies, almacenamiento y notificaciones reside en
`Infrastructure/ExitSlip/ExitSlipWorkflow.php`; los controladores validan y delegan.
El repositorio de usuarios existente devuelve modelos Eloquent: por ello la
independencia completa de Laravel descrita en el README original no era cierta
para toda la capa Application. No se realizó una reestructuración general.

Cada transición HTTP bloquea la fila antes de comprobar permisos y estado. Un
segundo intento vuelve a evaluar el estado persistido. El propietario no puede
aprobarse a sí mismo; el administrador no suplanta las firmas de jefe o RRHH.
Los borradores son privados salvo para su propietario y administración.

Las firmas se guardan en el disco privado; sustituir la firma del perfil conserva
la versión anterior utilizada por las papeletas. No deben borrarse estos archivos
sin comprobar todas sus referencias históricas. Los paths no se serializan a la UI.

Los canales privados comparan UUID completos y exigen usuario activo. Las
notificaciones solo pueden consultarse y marcarse por su destinatario. Las cuentas
desactivadas no pueden iniciar sesión ni seguir utilizando sesiones existentes.

## Puesta en marcha

```sh
docker compose up -d
docker compose exec app php artisan migrate --force
docker compose exec node npm ci
docker compose exec node npm run build
docker compose restart node queue-worker
```

La app local se sirve en http://localhost:8000. El navegador usa Vite en
http://localhost:5173 y Reverb en localhost:8080; PHP publica eventos a `reverb:8080`.
La configuración local necesita `BROADCAST_CONNECTION=reverb`,
`QUEUE_CONNECTION=database`, `APP_TIMEZONE=America/Lima` y credenciales Reverb
coherentes con sus variables `VITE_REVERB_*`. No compartir el secreto Reverb con Vite.

Antes del primer envío, el administrador debe asignar un jefe activo y los tres
participantes deben cargar su firma en **Mi perfil**. La creación pública de
usuarios conserva el rol de practicante. Administración crea jefes, RRHH y vigilancia.

## Verificación reproducible

Los tests PHP usan exclusivamente `epsel_papeletas_test` (configuración forzada en
`src/phpunit.xml`), nunca la base de uso diario. Crear esa base una sola vez:

```sh
docker compose exec db createdb -U epsel epsel_papeletas_test
docker compose exec app php artisan test
docker compose exec node npm run build
```

Para las pruebas de navegador, ejecutar después de los tests PHP, sin correr ambos
simultáneamente sobre la misma base:

```sh
docker compose exec -e DB_DATABASE=epsel_papeletas_test -e APP_ENV=testing app php tests/Browser/seed.php
docker compose run --rm --no-deps -p 8001:8001 -e DB_DATABASE=epsel_papeletas_test -e APP_ENV=testing -e APP_URL=http://localhost:8001 -e QUEUE_CONNECTION=database -e PHP_CLI_SERVER_WORKERS=4 -e SESSION_COOKIE=epsel_browser_test app php artisan serve --host=0.0.0.0 --port=8001 --no-reload
```

En otra terminal, iniciar la cola aislada y ejecutar Chrome desde el equipo anfitrión:

```sh
docker compose run --rm --no-deps -e DB_DATABASE=epsel_papeletas_test -e APP_ENV=testing app php artisan queue:work --sleep=1 --tries=3 --max-time=900
cd src
npm run test:e2e
```

Playwright usa Chrome instalado en el anfitrión y el bundle de producción. Los
usuarios y contraseñas de `tests/Browser/seed.php` son fixtures exclusivos de la
base de pruebas; el script rechaza ejecutarse en otra base. Detener los dos
contenedores temporales al terminar. Mantener Reverb activo durante la prueba.

Las pruebas cubren creación, fechas/horas, identidad falsificada, orden de
aprobaciones, repetición de acciones, acceso a PDF y canales ajenos, conservación
de firmas, rechazo/reenvío, vigilancia, paneles y recepción WebSocket en navegador.
No constituyen una prueba de carga ni una certificación de producción.
