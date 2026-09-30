export type Block =
    | { type: "text"; text: string }
    | { type: "list"; items: string[]; ordered?: boolean }
    | { type: "table"; headers: string[]; rows: string[][] }
    | { type: "note"; title: string; text: string }
    | { type: "code"; label: string; text: string };
export type Section = { id: string; title: string; blocks: Block[] };
export type Chapter = {
    id: string;
    category: string;
    title: string;
    summary: string;
    sections: Section[];
};
const p = (text: string): Block => ({ type: "text", text });
const list = (items: string[], ordered = false): Block => ({
    type: "list",
    items,
    ordered,
});
const note = (title: string, text: string): Block => ({
    type: "note",
    title,
    text,
});
const table = (headers: string[], rows: string[][]): Block => ({
    type: "table",
    headers,
    rows,
});
const code = (label: string, text: string): Block => ({
    type: "code",
    label,
    text,
});

export const guide: Chapter[] = [
    {
        id: "vision",
        category: "Empieza aquí",
        title: "Entender el sistema",
        summary:
            "El propósito de EPSEL Papeletas, su alcance y la ruta para incorporarte al proyecto.",
        sections: [
            {
                id: "proposito",
                title: "Del permiso en papel a una solicitud trazable",
                blocks: [
                    p(
                        "EPSEL Papeletas reúne en una misma aplicación la solicitud de salida del personal, la revisión del jefe de área, la autorización de Recursos Humanos y el control de Vigilancia. El objetivo es que cada participante conozca qué debe hacer y que el solicitante pueda seguir el recorrido de su autorización.",
                    ),
                    p(
                        "La unidad central es la papeleta. No se trata únicamente de un formulario: contiene identidad y cargo del solicitante, motivo, fecha y horario, un estado vigente, referencias a las firmas y un historial de decisiones. El PDF representa esos datos en el formato de salida; las reglas que permiten avanzar viven en el servidor.",
                    ),
                    table(
                        ["Necesidad", "Respuesta del sistema"],
                        [
                            [
                                "Saber quién debe atender la solicitud",
                                "Bandejas filtradas por rol, responsable y estado.",
                            ],
                            [
                                "Evitar aprobaciones fuera de orden",
                                "Policies y transiciones verificadas dentro de una transacción.",
                            ],
                            [
                                "Conservar evidencia de una decisión",
                                "Actor, estado de origen, estado de destino y fecha en el historial.",
                            ],
                            [
                                "Entregar un documento de salida",
                                "PDF con datos de la papeleta y las imágenes de firma disponibles.",
                            ],
                        ],
                    ),
                ],
            },
            {
                id: "alcance",
                title: "Qué forma parte del portal",
                blocks: [
                    p(
                        "El portal atiende seis roles: administración, practicante, trabajador, jefe de área, Recursos Humanos y vigilancia. Las pantallas principales son acceso, directorio de usuarios, bandeja de papeletas, creación y edición de borradores, detalle con historial, perfil y documentación técnica.",
                    ),
                    p(
                        "El acceso utiliza DNI y contraseña. Los solicitantes preparan sus papeletas y las derivan de forma explícita entre etapas. El administrador organiza cuentas, áreas asignadas y jefes; no sustituye las firmas de los revisores. El perfil permite administrar información personal, fotografía, contraseña e imagen de firma.",
                    ),
                    note(
                        "Cómo interpretar esta guía",
                        "Esta edición del 30 de septiembre de 2026 integra la historia del proyecto y la lectura del código actual. Cuando una función está en transición o requiere verificación, se indica expresamente. No equivale a una certificación de producción ni a un resultado de pruebas en tiempo real.",
                    ),
                ],
            },
            {
                id: "recorrido",
                title: "Tu primera lectura como desarrollador",
                blocks: [
                    list(
                        [
                            "Comprende la evolución: identifica qué problema resolvió cada fase y qué cambió después del plan inicial.",
                            "Recorre arquitectura y roles: ubica dónde se valida la identidad, dónde se decide el permiso y qué interfaz consume los datos.",
                            "Estudia el flujo de la papeleta antes de modificar estados, firmas o consultas de bandeja.",
                            "Levanta el entorno y utiliza datos de prueba para reproducir una solicitud completa.",
                            "Consulta mantenimiento para reconocer diferencias actuales entre implementación, pruebas y documentación histórica.",
                        ],
                        true,
                    ),
                    p(
                        "Para seguir una petición real, comienza en routes/web.php, continúa por ExitSlipController, revisa ExitSlipPolicy y entra a ExitSlipWorkflow. Desde allí podrás seguir las acciones de aplicación, el repositorio Eloquent y la emisión de notificaciones. La respuesta vuelve a una página de resources/js/Pages mediante Inertia.",
                    ),
                ],
            },
        ],
    },
    {
        id: "evolucion",
        category: "Empieza aquí",
        title: "Historia y evolución",
        summary:
            "Las siete fases originales y las decisiones que dieron forma al portal actual.",
        sections: [
            {
                id: "plan-original",
                title: "El plan original: fases 0 a 6",
                blocks: [
                    p(
                        "La construcción se organizó primero por dependencias: preparar un entorno reproducible, definir los datos, controlar quién entra y después conectar la operación. Esta secuencia explica por qué existían clases y servicios antes de que todas las pantallas y transiciones estuvieran unidas.",
                    ),
                    table(
                        ["Fase", "Trabajo realizado", "Por qué era necesario"],
                        [
                            [
                                "0 · Base",
                                "Docker, Laravel, Nginx, PostgreSQL, Vite y preparación de Reverb.",
                                "Compartir un entorno de ejecución y separar los servicios.",
                            ],
                            [
                                "1 · Dominio y base de datos",
                                "Entidades, enums, rango horario, repositorios y migraciones.",
                                "Representar las reglas de una papeleta y sus relaciones.",
                            ],
                            [
                                "2 · Acceso y firmas",
                                "Sesiones, roles, usuarios activos y almacenamiento privado de imágenes.",
                                "Asociar cada solicitud y decisión con un usuario.",
                            ],
                            [
                                "3 · Formulario y PDF",
                                "Borrador editable, validaciones, vista previa y generación del documento.",
                                "Completar la información antes del envío.",
                            ],
                            [
                                "4 · Aprobaciones",
                                "Revisión por jefe y RRHH, rechazo, corrección e historial.",
                                "Conectar a los participantes sin saltos de estado.",
                            ],
                            [
                                "5 · Tiempo real",
                                "Notificaciones persistentes, eventos privados y campana.",
                                "Avisar cambios sin depender solo de una recarga manual.",
                            ],
                            [
                                "6 · Paneles y verificación",
                                "Bandejas por rol, filtros, administración y pruebas.",
                                "Convertir el flujo técnico en una experiencia utilizable.",
                            ],
                        ],
                    ),
                ],
            },
            {
                id: "documento-oficial",
                title: "La evolución del documento y del perfil",
                blocks: [
                    p(
                        "La primera versión generaba un PDF funcional con los campos del dominio. Más adelante se incorporó una imagen institucional como fondo de la plantilla de practicantes. Esto cambió el problema: además de generar un documento había que ubicar fechas, nombres y firmas dentro de casillas concretas.",
                    ),
                    p(
                        "Se introdujo un calibrador visual para arrastrar campos y obtener coordenadas CSS. Las fechas del formato de practicantes pasaron a representarse con seis dígitos —día, mes y año corto—, y la plantilla Blade recibió ajustes de posición. La plantilla de trabajadores conserva una estructura tabular.",
                    ),
                    p(
                        "También se añadieron fotografía y edición explícita del perfil. Los formularios muestran sus datos en modo lectura y se habilitan con una acción del usuario. La firma puede actualizarse; las papeletas necesitan mantener la referencia histórica de las imágenes que ya utilizaron.",
                    ),
                ],
            },
            {
                id: "derivaciones",
                title: "De la aprobación automática a la derivación explícita",
                blocks: [
                    p(
                        "El flujo inicial describía la aprobación del jefe seguida directamente por RRHH. La operación solicitó una decisión adicional del propietario: enviar a RRHH una vez obtenida la firma del jefe. Se incorporó submitted_to_hr en el enum, la restricción de PostgreSQL, las políticas y la interfaz.",
                    ),
                    p(
                        "La actualización más reciente aplica la misma idea a la entrega en garita. Después de la aprobación de RRHH, el propietario envía la papeleta a Vigilancia. El nuevo estado submitted_to_security habilita el control; el guardia introduce ambas horas, agrega observaciones y firma para finalizar en una sola operación.",
                    ),
                    note(
                        "Diferencia entre versiones",
                        "Los registros anteriores describen salida y retorno como dos acciones separadas. El código actual de ExitSlipWorkflow solicita hora_salida y hora_retorno juntas. Al mantener pruebas o integraciones, toma ese contrato como punto de partida y revisa sus efectos en indicadores y notificaciones.",
                    ),
                ],
            },
            {
                id: "experiencia",
                title: "Consolidación de la experiencia visual",
                blocks: [
                    p(
                        "El acceso evolucionó desde un formulario genérico hacia un diseño propio con imagen institucional, mascota, campos etiquetados y controles de contraseña. Posteriormente el ingreso se restringió a DNI. El enlace de recuperación se retiró del login, aunque sus rutas aún existen.",
                    ),
                    p(
                        "Las pantallas internas se unificaron con navegación lateral, menú móvil, azul marino, turquesa y blanco. Los listados pasaron de pestañas con filtrado local a búsquedas y paginación en el servidor. El detalle integra progreso, acciones autorizadas e historial. Esta guía reemplaza el antiguo índice de documentos por una explicación organizada para quien debe mantener el sistema.",
                    ),
                ],
            },
        ],
    },
    {
        id: "arquitectura",
        category: "Diseño y operación",
        title: "Arquitectura y tecnologías",
        summary:
            "Cómo viaja una petición entre React, Laravel, el dominio y PostgreSQL.",
        sections: [
            {
                id: "stack",
                title: "Una aplicación Laravel con interfaz React",
                blocks: [
                    p(
                        "La aplicación funciona como un monolito con interfaz React e Inertia. Laravel conserva las rutas, autenticación, autorización y acceso a datos. Inertia entrega propiedades a componentes TypeScript y gestiona la navegación sin exigir una API REST independiente para cada pantalla.",
                    ),
                    table(
                        [
                            "Pieza",
                            "Tecnología del repositorio",
                            "Responsabilidad",
                        ],
                        [
                            [
                                "Servidor",
                                "PHP 8.3 en Docker · Laravel 11",
                                "Peticiones, sesiones, validación y reglas de acceso.",
                            ],
                            [
                                "Interfaz",
                                "React 18 · TypeScript · Inertia 2",
                                "Páginas, formularios, navegación y estados de interacción.",
                            ],
                            [
                                "Diseño",
                                "Tailwind CSS 3 + CSS propio + Headless UI",
                                "Utilidades, estilos institucionales y diálogos accesibles.",
                            ],
                            [
                                "Persistencia",
                                "PostgreSQL 16 · Eloquent",
                                "Relaciones, restricciones, consultas y transacciones.",
                            ],
                            [
                                "Eventos",
                                "Reverb · Echo · pusher-js",
                                "Entrega de eventos por canales privados.",
                            ],
                            [
                                "Documentos",
                                "barryvdh/laravel-dompdf",
                                "Transformación de una vista Blade en PDF.",
                            ],
                            [
                                "Herramientas",
                                "Vite 6 · Pest / PHPUnit · Playwright · Pint",
                                "Compilación, pruebas de PHP y navegador, formato.",
                            ],
                        ],
                    ),
                    p(
                        "Composer declara PHP ^8.2 como mínimo, mientras la imagen del entorno utiliza PHP 8.3. Sanctum está instalado, pero el login web revisado usa Auth::attempt y sesiones de Laravel. Los roles son enums nativos; no se encontraron dependencias de Spatie Permission ni de BenSampo Enum en composer.json. Tailwind sigue presente y se utiliza junto al CSS propio.",
                    ),
                ],
            },
            {
                id: "capas",
                title: "Responsabilidades por capa",
                blocks: [
                    table(
                        [
                            "Ubicación dentro de src/",
                            "Qué contiene",
                            "Cuándo modificarla",
                        ],
                        [
                            [
                                "app/Domain",
                                "ExitSlip, enums, TimeRange e interfaces de repositorios y servicios.",
                                "Cuando cambia una regla o un concepto del negocio.",
                            ],
                            [
                                "app/Application",
                                "Acciones como SubmitExitSlip, ApproveByAreaHead y ApproveByHR.",
                                "Cuando cambia un caso de uso y los datos que conserva.",
                            ],
                            [
                                "app/Infrastructure",
                                "Repositorios Eloquent, workflow, almacenamiento y broadcasting.",
                                "Cuando cambia persistencia, coordinación transaccional o integración.",
                            ],
                            [
                                "app/Http y app/Policies",
                                "Controllers, middleware, requests y permisos.",
                                "Cuando cambia el contrato HTTP o quién puede ejecutar una operación.",
                            ],
                            [
                                "resources/js",
                                "Páginas React, componentes, layouts y tipos.",
                                "Cuando cambia la experiencia o la representación de los datos.",
                            ],
                            [
                                "resources/views/pdf",
                                "La plantilla Blade de la papeleta.",
                                "Cuando cambia el formato impreso.",
                            ],
                        ],
                    ),
                    note(
                        "Separación práctica, no aislamiento absoluto",
                        "La estructura distingue dominio, aplicación e infraestructura, pero algunas acciones importan modelos y servicios de Laravel. ExitSlipController también construye entidades y consultas. Evita describir el proyecto como una arquitectura totalmente independiente del framework.",
                    ),
                ],
            },
            {
                id: "peticion",
                title: "Qué ocurre al aprobar una papeleta",
                blocks: [
                    list(
                        [
                            "Show.tsx muestra «Aprobar y firmar» cuando el servidor entrega can.approve. El usuario envía un POST a la ruta de transición.",
                            "La ruta ejecuta ExitSlipController::transition. Se valida el nombre de la acción y cualquier dato requerido.",
                            "ExitSlipWorkflow abre DB::transaction, recupera la fila con lockForUpdate y ejecuta Gate::forUser(...)->authorize.",
                            "Según el rol se llama a ApproveByAreaHead o ApproveByHR. La firma debe existir en el almacenamiento privado.",
                            "El repositorio guarda el nuevo estado y registra la transición con el actor de la decisión.",
                            "El notificador crea las alertas y despacha un evento después del commit. La respuesta HTTP vuelve a la pantalla y la campana actualiza su información.",
                        ],
                        true,
                    ),
                    p(
                        "El bloqueo hace que dos peticiones sobre la misma papeleta se evalúen contra el estado persistido. El botón deshabilitado durante el envío mejora la interacción, pero la protección contra acciones repetidas depende de estas comprobaciones del servidor.",
                    ),
                ],
            },
        ],
    },
    {
        id: "roles",
        category: "Diseño y operación",
        title: "Roles y recorrido de pantallas",
        summary: "Qué hace cada usuario y cómo se relacionan sus módulos.",
        sections: [
            {
                id: "matriz",
                title: "Responsabilidades de los seis roles",
                blocks: [
                    table(
                        ["Rol", "Trabajo principal", "Límite importante"],
                        [
                            [
                                "Administrador",
                                "Gestiona cuentas, asignaciones y consulta papeletas y esta guía.",
                                "No se autoasigna facultad para firmar como jefe o RRHH.",
                            ],
                            [
                                "Practicante",
                                "Crea borradores, carga firma, envía y consulta su historial.",
                                "Solo modifica sus borradores; no aprueba sus solicitudes.",
                            ],
                            [
                                "Trabajador",
                                "Mismo recorrido de solicitud con plantilla de personal.",
                                "La plantilla worker no cambia las etapas de aprobación.",
                            ],
                            [
                                "Jefe de área",
                                "Revisa solicitudes que lo tienen asignado; también puede crear las propias.",
                                "No aprueba su propia papeleta ni la de otro jefe.",
                            ],
                            [
                                "Recursos Humanos",
                                "Revisa las papeletas entregadas a su etapa.",
                                "La aprobación requiere submitted_to_hr.",
                            ],
                            [
                                "Vigilancia",
                                "Completa el control de las papeletas entregadas a garita.",
                                "Requiere submitted_to_security, firma y fecha autorizada.",
                            ],
                        ],
                    ),
                ],
            },
            {
                id: "pantallas",
                title: "De la entrada al detalle",
                blocks: [
                    list(
                        [
                            "Acceso: el DNI identifica al usuario. LoginRequest exige una cuenta activa y limita intentos por DNI e IP. El controlador de sesión deriva al panel apropiado.",
                            "Directorio: el administrador filtra por nombre, DNI, rol o acceso. Los diálogos permiten crear usuarios y actualizar área, jefe y estado activo. El borrado de usuarios es lógico mediante SoftDeletes.",
                            "Bandeja: ExitSlipController define el ámbito por rol antes de aplicar búsqueda, estado y fecha. Los listados se paginan y sus indicadores se calculan antes de filtrar.",
                            "Formulario: permite seleccionar plantilla, fecha de emisión, cargo, motivo, detalle y horario. Al guardar se obtiene un borrador; guardar no equivale a enviar.",
                            "Detalle: reúne datos, progreso, historial, PDF y acciones can.*. Es el lugar desde el que se realizan las derivaciones y aprobaciones.",
                            "Perfil: separa información personal, fotografía, firma y seguridad. La imagen de firma también se puede cargar desde el formulario de papeleta.",
                        ],
                        true,
                    ),
                    p(
                        "El catálogo de áreas ya existe en la base. El panel revisado permite asignar áreas, pero no presenta un CRUD completo para crearlas. Tampoco debe suponerse que un botón oculto equivale a una restricción: cada endpoint necesita su policy o middleware.",
                    ),
                ],
            },
            {
                id: "identidad",
                title: "Consulta de DNI y datos personales",
                blocks: [
                    p(
                        "La creación de usuarios incorpora una consulta de DNI desde el panel administrativo. ReniecController funciona como intermediario HTTP con el proveedor Decolecta. Es una ayuda para completar nombres y apellidos, no el mecanismo con el que se autentican las cuentas.",
                    ),
                    p(
                        "El formulario consulta el servicio al salir del campo DNI con ocho caracteres. La disponibilidad y exactitud de la respuesta dependen del proveedor. El administrador debe revisar los datos antes de guardar y el servidor debe seguir validando el registro independientemente de esa consulta.",
                    ),
                    note(
                        "Configuración por revisar",
                        "La integración actual contiene una credencial de respaldo escrita en el controlador. Debe retirarse del código y gestionarse mediante configuración privada antes de un despliegue. Esta guía no expone ni utiliza esa credencial y no da por validado el servicio externo.",
                    ),
                ],
            },
        ],
    },
    {
        id: "flujo",
        category: "Diseño y operación",
        title: "Ciclo de vida de una papeleta",
        summary:
            "Estados, responsables, firmas y reglas para avanzar o corregir una solicitud.",
        sections: [
            {
                id: "estados",
                title: "El recorrido vigente, paso a paso",
                blocks: [
                    table(
                        ["Estado", "Qué significa", "Siguiente acción"],
                        [
                            [
                                "draft",
                                "Borrador editable por su propietario.",
                                "El propietario ejecuta submit con firma y jefe activo.",
                            ],
                            [
                                "submitted",
                                "Solicitud enviada al jefe asignado.",
                                "El jefe aprueba o rechaza con motivo.",
                            ],
                            [
                                "approved_by_area",
                                "El jefe ya firmó.",
                                "El propietario ejecuta submit_to_hr.",
                            ],
                            [
                                "submitted_to_hr",
                                "Solicitud entregada a Recursos Humanos.",
                                "RRHH aprueba o rechaza con motivo.",
                            ],
                            [
                                "approved_by_hr",
                                "La autorización cuenta con firma de RRHH.",
                                "El propietario ejecuta submit_to_security.",
                            ],
                            [
                                "submitted_to_security",
                                "Papeleta entregada a Vigilancia.",
                                "Vigilancia registra ambas horas y firma el control.",
                            ],
                            [
                                "completed",
                                "Control de vigilancia finalizado.",
                                "Consulta del historial y generación de PDF.",
                            ],
                            [
                                "rejected",
                                "Un revisor indicó una corrección.",
                                "El propietario ejecuta revert para recuperar el borrador.",
                            ],
                        ],
                    ),
                    p(
                        "El código actual no incluye un estado cancelled. La derivación manual a RRHH y a Vigilancia se decide por propietario y estado; no está limitada únicamente a practicantes ni a una plantilla específica.",
                    ),
                ],
            },
            {
                id: "reglas",
                title: "Condiciones que no deben saltarse",
                blocks: [
                    list([
                        "Enviar al jefe requiere que la cuenta tenga un jefe activo con rol area_head, distinto del solicitante, y una firma registrada. La fecha autorizada no puede haber vencido.",
                        "Aprobar requiere el rol y estado correctos. El jefe debe ser el asignado en la papeleta. Ningún usuario puede aprobar su propia solicitud.",
                        "Enviar a RRHH o Vigilancia corresponde al propietario después de la aprobación anterior. Una nueva petición vuelve a comprobar el estado.",
                        "Rechazar requiere un comentario. La vuelta a borrador es otra acción explícita; permite corregir y reiniciar la revisión.",
                        "Finalizar en Vigilancia exige fecha autorizada igual al día de Lima, hora de salida y retorno válidas, y la firma del guardia. El nombre del supervisor se toma de la cuenta.",
                    ]),
                    p(
                        "La entrada HTTP de vigilancia valida hora_retorno posterior a hora_salida. Este contrato no contempla un retorno al día siguiente. Si la operación necesita turnos nocturnos, hay que modelar fecha y hora completas antes de relajar la validación.",
                    ),
                ],
            },
            {
                id: "rechazo",
                title: "Corrección, historial y ejemplo de uso",
                blocks: [
                    p(
                        "Ejemplo: una trabajadora prepara una salida por trámite personal, guarda el borrador y revisa su PDF. Al enviarlo se fija su firma y llega la revisión al jefe. Si el jefe rechaza por horario incompleto, el motivo queda en el historial. La trabajadora devuelve la solicitud a borrador, corrige y vuelve a enviarla; la firma anterior del jefe no debe mantenerse como una aprobación válida del contenido corregido.",
                    ),
                    p(
                        "Si el jefe aprueba, la trabajadora pulsa «Enviar a RRHH». Tras la firma de RRHH todavía debe pulsar «Enviar a Vigilancia». Finalmente, Vigilancia completa salida, retorno y observaciones y ejecuta el cierre firmado. El historial permite reconstruir las transiciones sin depender de la última notificación recibida.",
                    ),
                    code(
                        "Contrato HTTP · ejemplos de rutas",
                        "POST /exit-slips/{id}/actions/submit\nPOST /exit-slips/{id}/actions/approve\nPOST /exit-slips/{id}/actions/submit_to_hr\nPOST /exit-slips/{id}/actions/submit_to_security\nPOST /exit-slips/{id}/actions/reject\nPOST /exit-slips/{id}/actions/revert\nPOST /exit-slips/{id}/actions/security",
                    ),
                ],
            },
        ],
    },
    {
        id: "datos",
        category: "Referencia técnica",
        title: "Modelo de datos y persistencia",
        summary:
            "Las relaciones que sostienen las cuentas, el historial y las papeletas.",
        sections: [
            {
                id: "entidades",
                title: "Tablas principales y relaciones",
                blocks: [
                    table(
                        ["Tabla", "Contenido", "Relación clave"],
                        [
                            [
                                "areas",
                                "Catálogo de dependencias.",
                                "Un área agrupa usuarios.",
                            ],
                            [
                                "users",
                                "DNI, nombres, rol, estado activo, área y jefe.",
                                "area_id apunta a areas; jefe_id apunta a otro usuario.",
                            ],
                            [
                                "signatures",
                                "Ruta de la firma actual, MIME y hash SHA-256.",
                                "user_id identifica al dueño de la firma.",
                            ],
                            [
                                "exit_slips",
                                "Solicitud, estado, datos capturados, responsables y firmas.",
                                "user_id identifica al propietario; jefe_asignado_id al revisor.",
                            ],
                            [
                                "exit_slip_transitions",
                                "Origen, destino, actor, comentario y fecha.",
                                "exit_slip_id vincula cada evento con su papeleta.",
                            ],
                            [
                                "notifications",
                                "Título, mensaje, tipo y fecha de lectura.",
                                "user_id es el destinatario; exit_slip_id es la referencia.",
                            ],
                            [
                                "exit_slip_sequences",
                                "Último correlativo de cada año.",
                                "Lo utiliza el generador anual disponible en infraestructura.",
                            ],
                        ],
                    ),
                    p(
                        "Las notificaciones del proyecto usan un modelo propio; no son la tabla polimórfica estándar de Laravel. Las firmas se relacionan con usuarios mediante user_id. Para comprender un campo, consulta primero la migración y luego su cast o relación en el modelo Eloquent.",
                    ),
                ],
            },
            {
                id: "integridad",
                title: "Enums, restricciones e información histórica",
                blocks: [
                    p(
                        "Los enums PHP definen rol, estado, motivo y plantilla. PostgreSQL añade restricciones CHECK para impedir valores fuera de los catálogos. Introducir un estado requiere sincronizar enum, migración, dominio, policy, workflow, consultas de bandeja, tipos de TypeScript y pruebas.",
                    ),
                    p(
                        "La papeleta conserva apellidos_nombres y designado como datos capturados. Esto permite representar a la persona cuando se emitió la solicitud. Hay excepciones concretas: las vistas de borrador y enviado consultan el nombre actual del usuario, y el envío actualiza ese nombre. No debe suponerse una inmutabilidad absoluta de todos los campos desde la creación.",
                    ),
                    p(
                        "Los usuarios utilizan SoftDeletes. Borrar una cuenta desde la aplicación no equivale a ejecutar un DELETE físico en PostgreSQL. Las migraciones sí definen relaciones con cascadeOnDelete y nullOnDelete para borrados físicos: tenlo presente al preparar tareas de limpieza o restauración.",
                    ),
                ],
            },
            {
                id: "codigos",
                title: "Numeración: implementación disponible y camino utilizado",
                blocks: [
                    p(
                        "Existe un generador de correlativos anuales y una tabla de secuencias, pero el método store actual de ExitSlipController crea códigos con prefijo PAP, fecha Ymd y cuatro caracteres aleatorios. La existencia del generador no significa que todas las solicitudes web pasen por él.",
                    ),
                    note(
                        "Antes de cambiar la numeración",
                        "Determina qué contrato debe ser oficial, revisa códigos existentes y preserva su unicidad. Si se vuelve al correlativo anual, conecta explícitamente el generador al caso de creación y verifica concurrencia. No renumeres documentos históricos como efecto secundario de un cambio visual.",
                    ),
                ],
            },
        ],
    },
    {
        id: "firmas-pdf",
        category: "Referencia técnica",
        title: "Firmas y documento PDF",
        summary:
            "Qué se almacena, cuándo se estampa y cómo se construye el formato institucional.",
        sections: [
            {
                id: "almacenamiento",
                title: "Una imagen de firma con control de acceso",
                blocks: [
                    p(
                        "El usuario carga una imagen PNG o JPEG. SignatureController valida el archivo y UploadSignature coordina su almacenamiento mediante SignatureStorageInterface. El disco private apunta a storage/app/private. La base almacena la ruta, el tipo y un hash; el PDF recibe la imagen convertida a una URL de datos base64.",
                    ),
                    p(
                        "Guardar en un disco privado evita exponer directamente el archivo por la ruta pública de fotos, pero no significa que el contenido esté cifrado. El hash SHA-256 tampoco es una firma criptográfica ni un certificado. El mecanismo implementado es una imagen estampada asociada a una acción y a su auditoría.",
                    ),
                    p(
                        "El endpoint GET /signatures/{id} comprueba que el usuario autenticado sea el dueño. Un revisor ve la firma incorporada en la papeleta o PDF autorizado, no necesita acceso a la descarga privada de la firma de otra cuenta.",
                    ),
                ],
            },
            {
                id: "versiones",
                title: "Conservación de firmas y puntos de control",
                blocks: [
                    p(
                        "Al enviar o aprobar, la papeleta conserva una ruta de firma. Al reemplazar la firma del perfil, UploadSignature escribe una imagen nueva y actualiza el registro actual; no elimina automáticamente la imagen anterior. Esto protege las referencias usadas en documentos previos.",
                    ),
                    p(
                        "La eliminación de la firma del perfil comprueba referencias históricas de practicante, jefe, RRHH y gerente antes de borrar el archivo. El nuevo campo firma_vigilancia_path debe incluirse también en esa revisión. Mantén sincronizados el mapeo del repositorio, los atributos del modelo y las reglas de conservación cuando agregues un firmante.",
                    ),
                    note(
                        "Dos validaciones aún por unificar",
                        "El controlador acepta imágenes hasta 10 MB, mientras UploadSignature rechaza archivos superiores a 2 MB. Para trabajar con la implementación actual utiliza imágenes de hasta 2 MB. La interfaz, el controlador y la acción deben acordar un único límite y un error de validación consistente.",
                    ),
                ],
            },
            {
                id: "renderizado",
                title: "Del modelo al documento",
                blocks: [
                    list(
                        [
                            "ExitSlipController::generatePdf recupera la entidad y autoriza generatePdf mediante la policy.",
                            "Reúne las rutas de firma disponibles y lee sus imágenes desde el disco privado. Para un borrador o enviado sin firma capturada, puede usar la firma actual del solicitante.",
                            "Entrega datos y firmas a resources/views/pdf/exit-slip.blade.php. La plantilla distingue practicante y trabajador.",
                            "DomPDF renderiza en A4 horizontal con recursos remotos deshabilitados y devuelve el PDF al navegador.",
                        ],
                        true,
                    ),
                    p(
                        "La vista de practicantes usa una imagen de fondo institucional y coordenadas absolutas. El calibrador permite ajustar posiciones visualmente; esos valores deben trasladarse a la plantilla Blade. Los cambios se revisan en un PDF real, porque una posición correcta en el navegador no garantiza el mismo resultado al imprimir.",
                    ),
                    note(
                        "Vista previa y autorización son conceptos distintos",
                        "Un borrador puede mostrar la firma del perfil en su vista previa. La presencia de una imagen no demuestra por sí sola que exista aprobación: consulta el estado, los actores y el historial. La validez jurídica del documento no se determina por utilizar DomPDF.",
                    ),
                ],
            },
        ],
    },
    {
        id: "tiempo-real",
        category: "Referencia técnica",
        title: "Notificaciones y tiempo real",
        summary:
            "Persistencia, colas, canales privados y recuperación de las alertas.",
        sections: [
            {
                id: "entrega",
                title: "Primero se guarda; después se avisa",
                blocks: [
                    p(
                        "ExitSlipNotifier crea una notificación para el propietario cada vez que se ejecuta una transición. Cuando el estado es submitted incorpora al jefe asignado; cuando es submitted_to_hr incorpora a las cuentas activas de RRHH. El código revisado todavía no añade a Vigilancia como destinatario de submitted_to_security.",
                    ),
                    p(
                        "NotificationCreated implementa ShouldBroadcast y ShouldDispatchAfterCommit. La emisión espera a que la transacción termine y se procesa mediante broadcasting. El evento expone el identificador de la notificación, no una copia completa de la papeleta.",
                    ),
                    code(
                        "Canal y evento",
                        "Canal privado: App.Models.User.{uuid}\nEvento: .notification.created\nConsulta: GET /notifications\nLectura: PATCH /notifications/{id}/read\nLectura completa: PATCH /notifications/all/read",
                    ),
                ],
            },
            {
                id: "cliente",
                title: "La campana y la actualización del portal",
                blocks: [
                    p(
                        "NotificationBell utiliza Laravel Echo y pusher-js para conectarse a Reverb. La autorización del canal pasa por /broadcasting/auth. Al recibir un evento, vuelve a consultar las notificaciones y recarga propiedades seleccionadas de Inertia: papeletas, conteos, permisos e historial.",
                    ),
                    p(
                        "La campana también consulta al recuperar el foco y cada 60 segundos. Esa consulta recupera notificaciones almacenadas si la conexión se interrumpió; no equivale a refrescar continuamente todas las bandejas. Marcar una notificación como leída queda asociado a su destinatario.",
                    ),
                    note(
                        "Navegador y contenedor usan destinos distintos",
                        "El navegador debe alcanzar el host y puerto públicos de Reverb. PHP puede publicar a través del nombre de servicio reverb dentro de Docker. Las variables VITE_* forman parte del bundle del navegador; nunca deben contener secretos de servidor.",
                    ),
                ],
            },
            {
                id: "diagnostico-eventos",
                title: "Si el aviso no llega",
                blocks: [
                    list(
                        [
                            "Comprueba si se creó la fila de notificación para el destinatario esperado.",
                            "Verifica el proceso queue-worker y los trabajos fallidos; una cola detenida puede retrasar la entrega.",
                            "Comprueba Reverb, host, puerto y respuesta de autorización del canal privado.",
                            "Verifica que la cuenta siga activa y que el canal corresponda al UUID completo.",
                            "Si el cambio usa un estado nuevo, revisa la selección de destinatarios en ExitSlipNotifier y las propiedades recargadas por NotificationBell.",
                        ],
                        true,
                    ),
                ],
            },
        ],
    },
    {
        id: "entorno",
        category: "Mantener y extender",
        title: "Entorno y puesta en marcha",
        summary:
            "Servicios, comandos de trabajo y diagnóstico del build local.",
        sections: [
            {
                id: "servicios",
                title: "Cómo se ejecuta en Docker",
                blocks: [
                    table(
                        ["Servicio", "Función", "Acceso local habitual"],
                        [
                            [
                                "nginx",
                                "Entrada HTTP y recursos públicos.",
                                "localhost:8000",
                            ],
                            [
                                "app",
                                "PHP-FPM y comandos Artisan.",
                                "Acceso interno desde Nginx.",
                            ],
                            [
                                "db",
                                "PostgreSQL 16.",
                                "Puerto 5432 según variables de Compose.",
                            ],
                            [
                                "pgadmin",
                                "Administración de PostgreSQL.",
                                "localhost:5050",
                            ],
                            [
                                "node",
                                "Vite y compilación de React.",
                                "localhost:5173 cuando HMR está activo.",
                            ],
                            ["reverb", "Servidor WebSocket.", "localhost:8080"],
                            [
                                "queue-worker",
                                "Procesamiento de trabajos.",
                                "Proceso interno sin interfaz web.",
                            ],
                        ],
                    ),
                    p(
                        "El Compose revisado utiliza colas de Laravel con base de datos y no define un servicio Redis. PostgreSQL es el motor concreto del entorno; las consultas ILIKE y las migraciones de restricciones deben revisarse antes de plantear una portabilidad a otro motor.",
                    ),
                ],
            },
            {
                id: "arranque",
                title: "Preparar una copia de desarrollo",
                blocks: [
                    p(
                        "Desde la raíz del repositorio, revisa los archivos de ejemplo de configuración y los scripts setup.ps1 o setup.sh. Configura valores privados localmente y conserva APP_TIMEZONE=America/Lima para la operación. Los comandos siguientes describen el recorrido de una copia nueva; las migraciones modifican la base configurada y deben ejecutarse con ese destino verificado.",
                    ),
                    code(
                        "Terminal · raíz del repositorio",
                        "docker compose up -d\ndocker compose exec app composer install\ndocker compose exec app php artisan migrate\ndocker compose exec node npm ci\ndocker compose exec node npm run build\ndocker compose exec app php artisan storage:link",
                    ),
                    p(
                        "La clave de aplicación se genera una sola vez para una instalación nueva sin APP_KEY. No la regeneres en una instalación existente. El enlace de storage publica fotografías del disco public; no debe usarse para exponer el disco private de firmas.",
                    ),
                    p(
                        "Antes de probar un envío, prepara cuentas activas, asigna el jefe del solicitante y carga las firmas de quienes participan en el circuito. Los datos de prueba deben permanecer separados de los registros de uso diario.",
                    ),
                ],
            },
            {
                id: "assets",
                title: "Por qué un cambio puede no verse",
                blocks: [
                    p(
                        "Laravel usa public/hot para saber si debe solicitar recursos al servidor de desarrollo de Vite. Si ese archivo apunta a un servidor que no está disponible, recompilar el bundle por sí solo puede no cambiar lo que carga el navegador. Revisa si estás trabajando en modo HMR o mediante public/build/manifest.json y utiliza un modo coherente.",
                    ),
                    p(
                        "El historial del proyecto registra problemas de actualización de archivos en Docker sobre Windows. Para verificar una entrega se ha utilizado npm run build, que primero ejecuta TypeScript y después Vite. Si cambian variables VITE_*, vuelve a compilar; sus valores se incorporan a los recursos del navegador.",
                    ),
                    code(
                        "Diagnóstico · comandos de lectura",
                        "docker compose ps\ndocker compose logs --tail=100 app nginx\ndocker compose logs --tail=100 queue-worker reverb\ndocker compose exec app php artisan migrate:status\ndocker compose exec app php artisan route:list",
                    ),
                ],
            },
        ],
    },
    {
        id: "mantenimiento",
        category: "Mantener y extender",
        title: "Pruebas y mantenimiento",
        summary:
            "Cómo validar un cambio y qué revisar después de las últimas ampliaciones.",
        sections: [
            {
                id: "verificacion",
                title: "Evidencia histórica y comprobación actual",
                blocks: [
                    p(
                        "La entrega del portal por roles registró 34 pruebas y 434 aserciones aprobadas, además de revisión de las seis cuentas en escritorio y móvil. Ese resultado corresponde a aquella versión. Después cambiaron la entrada de login a dni y el contrato de vigilancia; no debe presentarse aquel número como garantía automática del código más reciente.",
                    ),
                    p(
                        "La suite PHP usa epsel_papeletas_test mediante phpunit.xml. Antes de ejecutarla confirma la base aislada y las migraciones. Las pruebas de navegador tienen sus propios fixtures y un servidor de prueba; no ejecutes un reinicio de base contra los datos de operación.",
                    ),
                    code(
                        "Validación de desarrollo",
                        "docker compose exec app php artisan test\ndocker compose exec node npm run build\n# En el entorno aislado de navegador, con sus fixtures preparados:\ncd src\nnpm run test:e2e",
                    ),
                    p(
                        "Una comprobación completa del flujo necesita caso satisfactorio, rechazo y reenvío, acceso con rol incorrecto, doble envío y documento PDF. La compilación verifica tipos y recursos, pero no confirma por sí sola reglas de negocio, entrega WebSocket o correspondencia visual del PDF.",
                    ),
                ],
            },
            {
                id: "pendientes",
                title: "Puntos concretos para la siguiente revisión",
                blocks: [
                    table(
                        [
                            "Área",
                            "Hallazgo en el código revisado",
                            "Comprobación necesaria",
                        ],
                        [
                            [
                                "Vigilancia",
                                "Workflow solicita ambas horas y submitted_to_security; hay pruebas que aún envían movimiento=salida/retorno.",
                                "Actualizar escenarios de entrada, orden de estados y firma del supervisor.",
                            ],
                            [
                                "Bandeja de vigilancia",
                                "El índice del servidor usa el estado nuevo; la configuración de tarjetas aún referencia approved_by_hr.",
                                "Alinear filtros rápidos e indicadores con la operación actual.",
                            ],
                            [
                                "Notificaciones",
                                "El notificador selecciona propietario, jefe y RRHH, sin rama para Vigilancia.",
                                "Definir destinatarios activos y probar su recepción.",
                            ],
                            [
                                "Firma de vigilancia",
                                "El nuevo campo requiere revisión en fillable/hidden y en la conservación al eliminar firmas.",
                                "Evitar pérdida de referencias y exposición accidental de rutas.",
                            ],
                            [
                                "Carga de firma",
                                "El límite HTTP y el de la acción no coinciden.",
                                "Unificar tamaño permitido y errores visibles.",
                            ],
                            [
                                "Acceso y recuperación",
                                "Se retiró el enlace de recuperación, pero las rutas permanecen registradas.",
                                "Definir y verificar la política de recuperación completa.",
                            ],
                            [
                                "Herramienta PDF",
                                "/calibrador está fuera del grupo autenticado en routes/web.php.",
                                "Decidir su acceso según el entorno antes del despliegue.",
                            ],
                            [
                                "Consulta DNI",
                                "Existe configuración sensible de respaldo en el controlador.",
                                "Externalizar la credencial y validar la integración sin exponerla.",
                            ],
                        ],
                    ),
                    p(
                        "Estos puntos provienen de la lectura del código y no sustituyen la ejecución de una auditoría de seguridad o de una prueba de carga. La guía los registra para que el siguiente desarrollador sepa dónde concentrar su revisión; este módulo de documentación no modifica esos flujos.",
                    ),
                ],
            },
            {
                id: "extender",
                title: "Cómo introducir una nueva etapa sin romper el recorrido",
                blocks: [
                    list(
                        [
                            "Define quién ejecuta la acción, su estado de origen y destino, qué datos necesita y cómo se corrige un rechazo.",
                            "Actualiza el enum y la restricción de base mediante una migración compatible con los registros existentes.",
                            "Implementa la policy y la transición dentro del workflow. Conserva el bloqueo de fila y el historial con actor.",
                            "Actualiza repositorio, atributos Eloquent y firmas si aparecen campos nuevos. Verifica qué información se expone a la interfaz.",
                            "Alinea consultas, indicadores, tipos TypeScript, botones, progreso y PDF. Incluye destinatarios de notificación.",
                            "Ejecuta las pruebas pertinentes, revisa el flujo en navegador y actualiza esta guía con la diferencia entre versión anterior y actual.",
                        ],
                        true,
                    ),
                ],
            },
            {
                id: "mapa-codigo",
                title: "Mapa de lectura del repositorio",
                blocks: [
                    code(
                        "Puntos de entrada · rutas relativas a src/",
                        "routes/web.php\napp/Http/Controllers/ExitSlipController.php\napp/Policies/ExitSlipPolicy.php\napp/Infrastructure/ExitSlip/ExitSlipWorkflow.php\napp/Application/ExitSlip/Actions/\napp/Infrastructure/Persistence/Eloquent/EloquentExitSlipRepository.php\napp/Infrastructure/Notifications/ExitSlipNotifier.php\nresources/js/Pages/ExitSlips/\nresources/js/Components/NotificationBell.tsx\nresources/views/pdf/exit-slip.blade.php\ntests/Feature/ExitSlip/WorkflowTest.php",
                    ),
                    p(
                        "El contenido editorial de esta guía se mantiene en resources/js/Pages/Admin/Documentation/guide.ts y la interfaz en Index.tsx. DocumentationController sirve la página mediante Inertia. El módulo ya no convierte ni expone archivos de especificación en cada petición; su contenido debe mantenerse junto a los cambios funcionales.",
                    ),
                ],
            },
        ],
    },
];

export const workflow = [
    {
        label: "Borrador",
        state: "draft",
        actor: "Solicitante",
        detail: "Completa motivo, fecha y horario. Puede editar antes de enviar.",
        action: "Guardar y revisar el PDF",
        source: "ExitSlipController::store / update",
    },
    {
        label: "Jefatura",
        state: "submitted",
        actor: "Jefe asignado",
        detail: "El envío requiere firma del solicitante y un jefe activo. El revisor aprueba o rechaza con un motivo.",
        action: "Aprobar y firmar",
        source: "SubmitExitSlip · ApproveByAreaHead",
    },
    {
        label: "Firma del jefe",
        state: "approved_by_area",
        actor: "Solicitante",
        detail: "La aprobación del jefe queda registrada. El propietario decide cuándo derivar a Recursos Humanos.",
        action: "Enviar a RRHH",
        source: "ExitSlipWorkflow · submit_to_hr",
    },
    {
        label: "Revisión RRHH",
        state: "submitted_to_hr",
        actor: "Recursos Humanos",
        detail: "Las cuentas activas de RRHH reciben la solicitud y pueden aprobarla o devolverla con un motivo.",
        action: "Aprobar y firmar",
        source: "ApproveByHR · ExitSlipPolicy",
    },
    {
        label: "Autorizada",
        state: "approved_by_hr",
        actor: "Solicitante",
        detail: "La firma de RRHH está registrada. El propietario debe entregar la solicitud a la etapa de control.",
        action: "Enviar a Vigilancia",
        source: "ExitSlipWorkflow · submit_to_security",
    },
    {
        label: "Vigilancia",
        state: "submitted_to_security",
        actor: "Control de vigilancia",
        detail: "En la fecha autorizada, el guardia ingresa salida, retorno y observaciones. El sistema toma su nombre y firma.",
        action: "Finalizar y firmar control",
        source: "ExitSlipWorkflow · security",
    },
    {
        label: "Finalizada",
        state: "completed",
        actor: "Consulta autorizada",
        detail: "El control está cerrado. La papeleta, su historial y el PDF permanecen disponibles según los permisos.",
        action: "Consultar historial y PDF",
        source: "ExitSlipPolicy::view / generatePdf",
    },
];

export const layers = [
    {
        title: "Interfaz",
        tech: "React + Inertia",
        detail: "Presenta datos y recoge intenciones del usuario. Los permisos can.* vienen del servidor; no se decide una aprobación solo en React.",
        path: "resources/js/Pages/ExitSlips/Show.tsx",
    },
    {
        title: "Entrada HTTP",
        tech: "Laravel + Policies",
        detail: "Las rutas y middleware comprueban la sesión. El controlador valida el contrato y la policy autoriza la acción contra el registro concreto.",
        path: "routes/web.php · ExitSlipController · ExitSlipPolicy",
    },
    {
        title: "Proceso",
        tech: "Workflow + Actions",
        detail: "Coordina la transacción, bloquea la fila y ejecuta el caso de uso. Las entidades y enums describen las reglas y el estado resultante.",
        path: "app/Infrastructure/ExitSlip/ExitSlipWorkflow.php",
    },
    {
        title: "Persistencia",
        tech: "Eloquent + PostgreSQL",
        detail: "Conserva la papeleta y el historial. Tras confirmar la transacción se despacha el evento que actualizará a sus destinatarios.",
        path: "EloquentExitSlipRepository · ExitSlipNotifier",
    },
];

export function chapterText(chapter: Chapter): string {
    return [
        chapter.title,
        chapter.summary,
        ...chapter.sections.flatMap((section) => [
            section.title,
            ...section.blocks.map((block) =>
                block.type === "table"
                    ? block.rows.flat().join(" ")
                    : block.type === "list"
                      ? block.items.join(" ")
                      : block.type === "note"
                        ? `${block.title} ${block.text}`
                        : block.text,
            ),
        ]),
    ].join(" ");
}
