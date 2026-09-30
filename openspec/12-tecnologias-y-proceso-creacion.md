# 12. Arquitectura, Tecnologías y Proceso de Creación

**Fecha de Revisión:** 30/09/2026
**Documentación Oficial para Administradores y Nuevos Desarrolladores**

Este documento detalla exhaustivamente la base tecnológica, el proceso de concepción, diseño e implementación del **Sistema de Papeletas EPSEL**. Su objetivo es servir como punto de partida y de referencia técnica central para cualquier *Senior Developer* o Arquitecto de Software que se incorpore al proyecto.

---

## 1. Stack Tecnológico (Core)

El sistema ha sido diseñado como una SPA (Single Page Application) moderna, utilizando un enfoque monolítico basado en componentes para reducir latencia y unificar el desarrollo bajo el stack **TALL / VILT** (Vue/Inertia/Laravel/Tailwind, pero usando React en lugar de Vue).

### 1.1 Backend
- **Framework:** Laravel 11.x (PHP 8.2+)
- **Arquitectura:** Domain Driven Design (DDD) parcial, separando fuertemente el dominio (`app/Domain/ExitSlip`), los repositorios (`app/Infrastructure/Persistence`) y el Workflow/Reglas de Negocio.
- **ORM:** Eloquent, pero abstraído mediante Repositories e Interfaces.
- **Autenticación:** Sistema propio basado en DNI (Reniec local/simulado), validado a través de custom requests (`LoginRequest`) y sesión segura HTTP-only.
- **Autorización:** `Gates` y `Policies` fuertemente acoplados (ej. `ExitSlipPolicy`) para restringir acciones exactas (crear, firmar, aprobar, rechazar, enviar a vigilancia) según el rol del usuario (Practicante, Trabajador, Jefe, RRHH, Vigilancia, Admin).
- **PDF Engine:** `dompdf/dompdf` combinado con `barryvdh/laravel-dompdf` para renderizado de plantillas `blade` (tanto la tradicional tabular para Staff, como la superposición CSS con imágenes HD para Practicantes).

### 1.2 Frontend
- **Librería/Framework:** React 18.x (TypeScript estricto).
- **Integración Backend/Frontend:** Inertia.js. Inertia permite compilar React y consumirlo desde rutas Laravel sin necesidad de crear APIs REST complejas (evitando la sobrecarga de JWT y doble enrutamiento).
- **Estilos:** Vanilla CSS moderno (`portal.css`, `app.css`) con principios de Glassmorphism, CSS Grid, variables CSS puras para paletas, eliminando TailwindCSS para maximizar la personalización y conseguir el "Look and Feel" corporativo de alto estándar.
- **Componentes:** Headless UI para diálogos accesibles sin sacrificar el estilo (Diálogos modales nativos).
- **Tooling:** Vite para HMR (Hot Module Replacement) y compilación optimizada.

### 1.3 Base de Datos
- **Motor:** MySQL / MariaDB / PostgreSQL compatible.
- **Seguridad e Integridad:** Alto uso de ENUMs a nivel de base de datos (`chk_exit_slips_estado`) para evitar inyección de estados inválidos. Relaciones foráneas estrictas (`ON DELETE SET NULL`, `ON DELETE CASCADE`).
- **Almacenamiento de Firmas:** Las firmas (`practitionerSignaturePath`, `hrSignaturePath`, `firmaVigilanciaPath`, etc.) se guardan como rutas en base de datos apuntando al disco local privado (`storage/app/signatures`).

### 1.4 DevOps & Entorno
- **Contenedores:** Docker & Docker Compose (`epsel_app` para PHP/Apache/Nginx, `epsel_node` para Vite/React, y el motor de base de datos).
- **Dependencias Clave:**
  - `spatie/laravel-permission` (aunque simplificado por roles nativos en la tabla usuarios).
  - `bensampo/laravel-enum` (para tipado estricto en PHP).

---

## 2. El Proceso de Creación (De la Idea a la Producción)

### Fase 1: Levantamiento y Análisis
El proyecto inició ante la necesidad de digitalizar las papeletas de salida físicas de la empresa EPSEL. Se detectó que el flujo físico se perdía, las firmas se atrasaban y Vigilancia no tenía un control en tiempo real. 

### Fase 2: Diseño del Dominio y Reglas de Negocio
Se modeló la papeleta (`ExitSlip`) no como un simple CRUD, sino como una **Máquina de Estados**.
Los estados transitables definidos son:
1. `DRAFT` (Borrador)
2. `SUBMITTED` (Enviado al Jefe)
3. `APPROVED_BY_AREA` (Aprobado por el Jefe)
4. `SUBMITTED_TO_HR` (Enviado a RRHH - para el caso de papeletas Staff)
5. `APPROVED_BY_HR` (Aprobado por RRHH)
6. `SUBMITTED_TO_SECURITY` (Enviado a Vigilancia - introducido recientemente para delegar el control de puerta)
7. `COMPLETED` (Finalizada)
8. `REJECTED` (Rechazada)
9. `CANCELLED` (Anulada)

Se implementó la clase `ExitSlipWorkflow` para centralizar la validación de qué rol puede realizar qué salto de estado.

### Fase 3: UI / UX y Frontend
Se decidió huir de las plantillas genéricas (Bootstrap/Tailwind por defecto). Se diseñó un portal interno con temática "Deep Blue & Glassmorphism". La experiencia del usuario (UX) prioriza:
- Visualización temporal interactiva (Timelines) para saber exactamente "dónde está mi papeleta".
- Firmas digitales dibujables en el navegador usando un `<canvas>` o subiendo imagen, transformadas a Base64 y enviadas de forma segura al backend.

### Fase 4: Integración del Módulo de Documentación y Admin
Dado que el sistema requiere una escalabilidad constante (posible adición de Recursos Logísticos, Vehículos, etc.), se desarrolló este módulo de "Documentación Técnica". 
- El módulo parsea dinámicamente, desde PHP con `Str::markdown()`, los archivos ubicados en el directorio `openspec/`.
- Permite a los administradores e ingenieros de software leer los requerimientos, los registros de cambios (Changelogs) y la arquitectura sin salir de la aplicación, directamente desde el navegador, garantizando que el conocimiento no se pierda.

### Fase 5: Calibración Visual (El Calibrador PDF)
Un reto importante fue superponer las firmas digitales sobre un formato físico HD escaneado que la empresa obligaba a usar. 
- En lugar de usar TCPDF complejo, se ingenió la herramienta `/calibrador`. Una vista visual interactiva de arrastrar y soltar (Drag & Drop) que genera automáticamente las coordenadas `top` y `left` en CSS absoluto para el PDF final de dompdf.

---

## 3. Escalabilidad y Futuro

- **Base de Datos:** Preparada para escalar horizontalmente. Las transacciones son atómicas con `DB::transaction()` y se implementó `lockForUpdate()` para prevenir colisiones o *Race Conditions* si un jefe y RRHH intentan aprobar al mismo milisegundo.
- **Extensibilidad Frontend:** Todos los componentes se encapsularon en `PortalUI.tsx` (Botones, Avatares, Badges), permitiendo construir nuevos módulos corporativos instantáneamente siguiendo la misma guía de estilos.
- **Seguridad Constante:** Todas las consultas verifican que el usuario no acceda a identificadores UUID (ID de la papeleta) que no le corresponden, bloqueado desde el inicio del Controller mediante `Gate::authorize()`.

Este sistema representa una ingeniería moderna y resiliente lista para crecer.
