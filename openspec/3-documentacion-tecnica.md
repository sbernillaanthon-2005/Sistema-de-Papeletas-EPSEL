# Documentación Técnica del Sistema de Papeletas EPSEL

## 1. Descripción General del Sistema
El **Sistema de Autorización de Salida de Practicantes de EPSEL S.A.** es una plataforma web integral diseñada para digitalizar y automatizar el ciclo de vida de las papeletas de salida de personal (específicamente enfocada en practicantes y trabajadores). 

El sistema elimina el uso de papel mediante un flujo de trabajo digital que incluye la emisión de solicitudes, la recolección de firmas digitales, aprobaciones jerárquicas y el control en garita por parte del personal de vigilancia.

## 2. Arquitectura Tecnológica
El proyecto está construido bajo una arquitectura moderna tipo **SPA (Single Page Application)** monolítica, utilizando el ecosistema de Laravel acoplado estrechamente con React a través de Inertia.js.

### Stack Tecnológico:
*   **Backend:** PHP 8.3 con Laravel 11.
*   **Patrón Arquitectónico:** Clean Architecture (Domain, Application, Infrastructure, Http) para abstraer las reglas de negocio del framework.
*   **Frontend:** React 18 con TypeScript y TailwindCSS.
*   **Capa de Puente (Bridge):** Inertia.js (permite desarrollar la UI en React como si fuera Blade, sin necesidad de construir una API REST separada).
*   **Base de Datos:** PostgreSQL 16.
*   **WebSockets (Tiempo Real):** Laravel Reverb.
*   **Generación de PDF:** Barryvdh/laravel-dompdf (motor HTML a PDF).
*   **Infraestructura:** Docker y Docker Compose (Nginx, PHP-FPM, Postgres, Reverb, Redis/Queue).

## 3. Módulos y Funcionalidades Principales

### 3.1. Autenticación y Gestión de Roles
El sistema cuenta con un modelo de seguridad robusto basado en roles. Las credenciales de acceso se manejan mediante Laravel Sanctum (autenticación basada en cookies de sesión).

**Roles Implementados:**
1.  **Administrador de Sistemas:** Acceso total a la plataforma. Puede crear usuarios, gestionar áreas y configurar parámetros globales.
2.  **Practicante / Trabajador:** Emisor de la papeleta. Solo puede crear borradores, subirlos y enviarlos a aprobación.
3.  **Jefe de Área (Jefe de Sistemas):** Revisor primario. Recibe la papeleta de sus subordinados, la evalúa, y la aprueba (estampando su firma) o la rechaza.
4.  **Especialista de RRHH:** Revisor secundario. Aprueba finalmente la papeleta validando los permisos de salida corporativos.
5.  **Control de Vigilancia:** Personal de garita. Tienen un panel específico para buscar papeletas aprobadas y registrar la hora de salida física y el retorno del empleado.

### 3.2. Gestión de Firmas Digitales
Una de las funcionalidades core del sistema es la gestión de firmas:
*   Cada usuario puede subir una imagen de su firma desde su **Perfil** o mediante un atajo directo en el formulario de la papeleta.
*   La imagen se almacena encriptada y protegida en el disco `private` (no es accesible por URL pública directa).
*   **Seguridad:** Las firmas solo se incrustan ("estampan") en el documento cuando el usuario ejecuta una acción de aprobación. Un borrador nunca muestra firmas.
*   **Persistencia Histórica:** Si un usuario actualiza su firma en el perfil, las papeletas antiguas mantienen la firma anterior mediante un sistema de snapshots.

### 3.3. Ciclo de Vida de la Papeleta (Workflow)
El estado de la papeleta es estrictamente transicional:
1.  **Borrador (DRAFT):** El practicante llena el formulario. Puede editarlo o eliminarlo libremente.
2.  **Enviado (SUBMITTED):** La papeleta se envía al jefe directo. El practicante pierde acceso de edición. La firma del practicante se estampa en este momento.
3.  **Aprobado por Área (APPROVED_BY_AREA):** El Jefe aprueba la solicitud. Su firma se adhiere al documento. Pasa a RRHH.
4.  **Aprobado por RRHH (APPROVED_BY_HR):** RRHH aprueba. El documento es legalmente válido y está listo para vigilancia.
5.  **Rechazado (REJECTED):** En cualquier punto de revisión (Jefe o RRHH), la solicitud puede ser rechazada con un motivo escrito. Regresa a estado Borrador (las firmas de aprobación previas se anulan).
6.  **Completado (COMPLETED):** El empleado ha salido y regresado por garita.

### 3.4. Motor de Plantillas y Calibración PDF
El sistema de PDF está construido sobre `dompdf`. 
Debido a la estricta necesidad de mantener el formato oficial de la empresa:
*   Se utiliza una plantilla de alta definición (`Autorizacion_salida_practicante_EPSEL_Full_HD.png`) como imagen de fondo embebida en base64.
*   Se desarrolló una **herramienta visual de calibración de coordenadas** (`/calibrador`) construida en Vanilla JS.
*   Esta herramienta permite mapear mediante *Drag & Drop* las coordenadas CSS absolutas de cada campo de texto (incluyendo dígitos individuales de fechas descompuestas para encajar milimétricamente en las casillas del formulario original).
*   El backend toma los datos del `ExitSlip`, los formatea inteligentemente (ej. separando Nombres y Apellidos automáticamente) y los inyecta en las coordenadas absolutas generadas.

### 3.5. Sistema de Notificaciones (Reverb + WebSockets)
La plataforma es altamente reactiva.
*   **Backend:** Utiliza el sistema de Eventos y Broadcasting de Laravel enviando payloads a través de **Laravel Reverb**.
*   **Frontend:** React escucha los canales privados (`App.Models.User.{id}`) usando Laravel Echo.
*   Cuando una papeleta cambia de estado (ej. un Jefe aprueba), el emisor recibe instantáneamente una alerta visual y un contador en el ícono de la "Campana", sin necesidad de recargar la página.
*   Las notificaciones persisten en la base de datos (marcadas como leídas/no leídas).

## 4. Estructura de la Base de Datos
Modelos principales del dominio:
*   `users`: Datos del empleado, relación con `areas` y rol (`role` enum).
*   `areas`: Catálogo de dependencias de EPSEL.
*   `exit_slips`: Almacena el snapshot de toda la información (motivo, fecha, horas autorizadas). Mantiene los UUID de los usuarios que la generaron, aprobaron y el registro de la secuencia autonumérica.
*   `signatures`: Tabla polimórfica/relacional para gestionar las versiones de las firmas subidas al almacenamiento privado.
*   `notifications`: Tabla polimórfica nativa de Laravel para persistir el historial de alertas por usuario.
*   `exit_slip_sequences`: Gestiona la correlación anual de los códigos de las papeletas (ej. PAP-2026...).

## 5. Pruebas y Aseguramiento de Calidad
El proyecto incorpora dos niveles de pruebas automatizadas:
1.  **Tests Unitarios e Integración (PHPUnit):** Prueban exhaustivamente la lógica del Dominio (transiciones de estado, autorizaciones, policies y validaciones de FormRequests).
2.  **Tests End-to-End (E2E):** Ejecutados con Laravel Dusk / Playwright sobre una base de datos aislada (`epsel_papeletas_test`), verificando flujos de usuario complejos en el navegador, incluyendo el funcionamiento de los WebSockets.

## 6. Conclusión y Conformidad
Actualmente el sistema es un producto maduro, estable y **listo para producción** que cumple con:
*   Digitalización del 100% del trámite de autorizaciones de salida.
*   Integridad documental (firmas auditables y control estricto de edición).
*   UX Premium: Interfaz moderna con animaciones y notificaciones asíncronas.
*   Adaptación de diseño exacto de los formatos físicos institucionales mediante PDF pixel-perfect.
