# Asistente de voz de navegación

## Alcance

El asistente está disponible en la barra superior de las páginas autenticadas. Usa la API nativa de reconocimiento de voz del navegador con idioma `es-PE`; el navegador solicita permiso para el micrófono y el audio no se almacena ni se envía al backend de EPSEL.

## Comandos

El asistente interpreta intenciones y palabras clave, por lo que no exige pronunciar una frase exacta. Ignora tildes, signos y expresiones de cortesía. Por ejemplo, "Muéstrame las salidas de Anthony" busca sus papeletas, "Quiero ver mi cuenta" abre el perfil y "Llévame a Recursos Humanos" abre el módulo de solicitantes para ese rol.

| Voz | Resultado |
| --- | --- |
| «Abrir bandeja» | Abre la bandeja de papeletas. |
| «Buscar papeleta de Anthony» | Abre la bandeja filtrada por Anthony. |
| «Mi perfil» | Abre el perfil propio. |
| «Nueva papeleta» | Abre el formulario para roles solicitantes. |
| «Solicitantes» | Abre el módulo de RRHH. |
| «Auditoría» / «Respaldos» | Abre los módulos del administrador. |
| «Notificaciones» | Abre la campana. |
| «Leer página» | Lee el contenido principal visible. |
| «Volver» | Regresa a la página anterior. |
| «Ayuda» | Enumera los comandos principales. |

Los comandos de administración se exponen solo a cuentas administradoras y los de RRHH solo a RRHH. La autorización final sigue ocurriendo en el servidor mediante rutas, middleware y políticas existentes.

## Accesibilidad y compatibilidad

El botón muestra si el sistema está escuchando, la transcripción parcial y los comandos sugeridos. Si el navegador no expone Web Speech Recognition, el asistente informa la incompatibilidad; Chrome y Edge actuales ofrecen el soporte más consistente. El resto del portal sigue siendo totalmente utilizable con teclado, enlaces y formularios habituales.
