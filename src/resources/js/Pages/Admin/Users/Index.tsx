import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import { Pagination } from "@/types/exit-slip";
import { useState } from "react";
import { DialogTitle } from "@headlessui/react";
import Modal from "@/Components/Modal";
import PortalIcon from "@/Components/PortalIcon";
import {
    Avatar,
    StatCard,
    StatusBadge,
    PaginationBar,
    roleLabels,
} from "@/Components/PortalUI";
type Person = {
    id: string;
    nombres: string;
    apellidos: string;
    dni: string;
    rol: string;
    activo: boolean;
    area_id: string | null;
    jefe_id: string | null;
    area?: { nombre: string };
    jefe?: { nombres: string; apellidos: string };
    profile_photo_url?: string;
};
type Props = {
    users: Pagination<Person>;
    areas: { id: string; nombre: string }[];
    roles: { value: string; label: string }[];
    heads: Person[];
    summary: { total: number; active: number; heads: number; areas: number };
    filters: { q?: string; rol?: string; activo?: string };
    workflow: { key: string; label: string; value: number }[];
    monthly: { label: string; value: number }[];
    accessByRole: { key: string; label: string; active: number; inactive: number }[];
    pendingWorkflow: { id: string; code: string; requester: string; stage: string; responsible: string; requires_signature: boolean }[];
    reminderInterval: number;
};

function PendingWorkflow({ data, reminderInterval }: { data: Props["pendingWorkflow"]; reminderInterval: number }) {
    const reminder = useForm({ minutes: reminderInterval });
    const signing = data.filter((item) => item.requires_signature);
    return <section className="portal-card pending-workflow admin-priority-panel" aria-label="Seguimiento de firmas pendientes">
        <div className="pending-workflow-head"><div><p>CONTROL DE PROCESO</p><h2>Papeletas pendientes de completar</h2><span>{signing.length} esperando una firma · {data.length} detenidas en total</span></div>
            <form className="reminder-control" onSubmit={(event) => { event.preventDefault(); reminder.put(route("admin.reminder-settings.update"), { preserveScroll: true }); }}>
                <label htmlFor="reminder-minutes">Recordar cada</label><input id="reminder-minutes" type="number" min="1" max="1440" value={reminder.data.minutes} onChange={(event) => reminder.setData("minutes", Number(event.target.value))} /><span>min</span><button className="portal-btn portal-btn-primary" disabled={reminder.processing}>Guardar</button>
            </form>
        </div>
        <div className="pending-legend"><span><i className="pending-dot pending-dot--signature" /> Requiere firma</span><span><i className="pending-dot" /> Requiere derivación</span><span>Los recordatorios llegan por la campana en tiempo real.</span></div>
        {data.length ? <div className="pending-list">{data.map((item) => <Link key={item.id} href={route("exit-slips.show", item.id)} className="pending-row" title={`Abrir ${item.code}`}><span className="pending-code">{item.code}</span><span className="pending-route"><b>{item.requester}</b><i /><strong className={item.requires_signature ? "pending-stage pending-stage--signature" : "pending-stage"}>{item.stage}</strong><i /><b>{item.responsible}</b></span><span className={item.requires_signature ? "pending-chip pending-chip--signature" : "pending-chip"}>{item.requires_signature ? "Firma pendiente" : "Pendiente"}</span></Link>)}</div> : <div className="pending-empty"><PortalIcon name="check" /> No hay papeletas detenidas. El flujo está al día.</div>}
    </section>;
}

function WorkflowChart({ data }: { data: Props["workflow"] }) {
    const max = Math.max(...data.map((item) => item.value), 1);
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const peak = data.reduce((current, item) =>
        item.value > current.value ? item : current,
    data[0]);

    return (
        <div className="admin-chart-content">
            <div className="admin-chart-summary">
                <div><strong>{total}</strong><span>papeletas en proceso</span></div>
                <span className="admin-chart-peak">{peak?.value ? "Mayor carga: " + peak.label : "Sin acumulaciones"}</span>
            </div>
            <div className="admin-bar-list" aria-label={"Papeletas por etapa. " + total + " papeletas en total."}>
            {data.map((item) => (
                <Link
                    key={item.key}
                    className="admin-bar-row"
                    href={route("exit-slips.index", { estado: item.key })}
                    title={`Ver ${item.label.toLowerCase()} en la bandeja`}
                >
                    <span className="admin-bar-label"><i className={"admin-bar-dot admin-bar-dot--" + item.key} />{item.label}</span>
                    <span className="admin-bar-track">
                        <span
                            className={`admin-bar-fill admin-bar-fill--${item.key}`}
                            style={{ width: `${(item.value / max) * 100}%` }}
                        />
                    </span>
                    <strong>{item.value}<small>{total ? Math.round((item.value / total) * 100) + "%" : "0%"}</small></strong>
                </Link>
            ))}
            </div>
        </div>
    );
}

function MonthlyChart({ data }: { data: Props["monthly"] }) {
    const max = Math.max(...data.map((item) => item.value), 1);
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const peak = data.reduce((current, item) =>
        item.value > current.value ? item : current,
    data[0]);

    return (
        <div className="admin-chart-content">
            <div className="admin-chart-summary">
                <div><strong>{total}</strong><span>solicitudes en 6 meses</span></div>
                <span className="admin-chart-peak">{peak?.value ? peak.label + ": " + peak.value + " registradas" : "Sin solicitudes registradas"}</span>
            </div>
            <div className="admin-month-chart" aria-label={"Solicitudes creadas por mes. " + total + " solicitudes durante los últimos seis meses."}>
            {data.map((item) => (
                <div className={"admin-month-column " + (item.value === max && item.value > 0 ? "is-peak" : "")} key={item.label} aria-label={item.label + ": " + item.value + " solicitudes"}>
                    <strong>{item.value}</strong>
                    <span className="admin-month-track">
                        <span
                            className="admin-month-fill"
                            style={{ height: `${Math.max((item.value / max) * 100, item.value ? 8 : 0)}%` }}
                            title={`${item.label}: ${item.value} solicitudes`}
                        />
                    </span>
                    <span>{item.label}</span>
                </div>
            ))}
            </div>
        </div>
    );
}

function AccessChart({ data }: { data: Props["accessByRole"] }) {
    const activeTotal = data.reduce((sum, item) => sum + item.active, 0);
    const accountTotal = data.reduce(
        (sum, item) => sum + item.active + item.inactive,
        0,
    );
    const coverage = accountTotal
        ? Math.round((activeTotal / accountTotal) * 100)
        : 0;

    return (
        <div className="admin-chart-content">
            <div className="admin-chart-summary">
                <div><strong>{coverage}%</strong><span>cobertura de acceso</span></div>
                <span className="admin-chart-peak">{activeTotal} activas de {accountTotal || 0} cuentas</span>
            </div>
            <div className="admin-access-list" aria-label={"Cobertura por rol. " + activeTotal + " cuentas activas de " + (accountTotal || 0) + "."}>
            {data.map((item) => {
                const total = item.active + item.inactive;
                const percentage = total
                    ? Math.round((item.active / total) * 100)
                    : 0;
                return (
                    <Link
                        key={item.key}
                        className="admin-access-row"
                        href={route("admin.dashboard", { rol: item.key })}
                        title={`Filtrar usuarios con rol ${item.label}`}
                    >
                        <span className="admin-access-label">{item.label}<small>{percentage}% activo</small></span>
                        <span className="admin-access-track">
                            <span
                                className="admin-access-active"
                                style={{ width: percentage + "%" }}
                            />
                            <span
                                className="admin-access-inactive"
                                style={{ width: 100 - percentage + "%" }}
                            />
                        </span>
                        <strong>{item.active}<small>/{total}</small></strong>
                    </Link>
                );
            })}
            </div>
        </div>
    );
}

export default function Index({
    users,
    areas,
    roles,
    heads,
    summary,
    filters,
    workflow,
    monthly,
    accessByRole,
    pendingWorkflow,
    reminderInterval,
}: Props) {
    const me = usePage().props.auth.user.id;
    const [creating, setCreating] = useState(false);
    const [editing, setEditing] = useState<Person | null>(null);
    const [deleting, setDeleting] = useState<Person | null>(null);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [isFetchingReniec, setIsFetchingReniec] = useState(false);
    const [dniLookupState, setDniLookupState] = useState<"idle" | "success" | "manual">("idle");
    const [query, setQuery] = useState(filters.q || "");
    const [role, setRole] = useState(filters.rol || "");
    const [active, setActive] = useState(filters.activo || "");
    const create = useForm({
        nombres: "",
        apellidos: "",
        dni: "",
        password: "",
        rol: "worker",
        area_id: "",
        cargo_designado: "",
    });
    const edit = useForm({ activo: true, area_id: "", jefe_id: "" });
    const remove = useForm({});

    const lookupDni = async () => {
        const dni = create.data.dni.trim();
        if (!/^\d{8}$/.test(dni)) {
            setDniLookupState("manual");
            return;
        }

        setIsFetchingReniec(true);
        setDniLookupState("idle");
        try {
            const response = await fetch(`/admin/reniec/${dni}`);
            const result = await response.json();
            const nombres = result?.data?.nombres || "";
            const apellidoPaterno = result?.data?.apellido_paterno || result?.data?.apellidoPaterno || "";
            const apellidoMaterno = result?.data?.apellido_materno || result?.data?.apellidoMaterno || "";
            const apellidos = `${apellidoPaterno} ${apellidoMaterno}`.trim() || result?.data?.apellidos || "";

            if (response.ok && result?.success && (nombres || apellidos)) {
                create.setData((data) => ({ ...data, nombres, apellidos }));
                setDniLookupState("success");
                return;
            }
        } catch (error) {
            console.warn("No se pudo consultar el DNI", error);
        } finally {
            setIsFetchingReniec(false);
        }

        setDniLookupState("manual");
    };
    const closeCreate = () => {
        if (!create.processing) {
            setCreating(false);
            create.reset();
            create.clearErrors();
            setPasswordVisible(false);
            setDniLookupState("idle");
        }
    };
    const openEdit = (person: Person) => {
        edit.clearErrors();
        edit.setData({
            activo: person.activo,
            area_id: person.area_id || "",
            jefe_id: person.jefe_id || "",
        });
        setEditing(person);
    };
    return (
        <AuthenticatedLayout header={<h1>Usuarios y accesos</h1>}>
            <Head title="Administración de usuarios" />
            <div className="portal-stack admin-dashboard admin-dashboard-v2">
                <section className="portal-hero admin-dashboard-hero">
                    <div className="admin-dashboard-hero-copy">
                        <p className="portal-hero-eyebrow">
                            ADMINISTRACIÓN DEL SISTEMA
                        </p>
                        <h2>Un equipo conectado.</h2>
                        <p>
                            Organiza los accesos, asigna áreas y vincula al
                            personal con su jefe responsable.
                        </p>
                        <div className="admin-dashboard-hero-signals" aria-label="Resumen operativo">
                            <span><i className="admin-live-dot" /> {summary.active} cuentas con acceso</span>
                            <span><PortalIcon name="clock" /> {pendingWorkflow.length} papeletas por atender</span>
                        </div>
                    </div>
                    <div className="admin-dashboard-hero-actions">
                        <Link href={route("exit-slips.index")} className="admin-dashboard-hero-link">
                            Ver papeletas <PortalIcon name="arrow" />
                        </Link>
                        <button
                            className="portal-btn portal-btn-white"
                            onClick={() => setCreating(true)}
                        >
                            <PortalIcon name="plus" />
                            Nuevo usuario
                        </button>
                    </div>
                </section>
                <section className="admin-command-deck" aria-label="Accesos rápidos de administración">
                    <button type="button" className="admin-command-card admin-command-card--primary" onClick={() => setCreating(true)}>
                        <span className="admin-command-icon"><PortalIcon name="plus" /></span>
                        <span><small>ACCIÓN PRINCIPAL</small><strong>Registrar usuario</strong><em>Crear una cuenta y definir sus permisos.</em></span>
                    </button>
                    <Link href={route("exit-slips.index")} className="admin-command-card">
                        <span className="admin-command-icon"><PortalIcon name="file" /></span>
                        <span><small>OPERACIÓN</small><strong>Revisar bandeja</strong><em>{pendingWorkflow.length} papeletas necesitan seguimiento.</em></span>
                        <PortalIcon name="arrow" />
                    </Link>
                    <Link href={route("admin.audit.index")} className="admin-command-card">
                        <span className="admin-command-icon"><PortalIcon name="shield" /></span>
                        <span><small>CONTROL</small><strong>Ver auditoría</strong><em>Consulta las acciones registradas del sistema.</em></span>
                        <PortalIcon name="arrow" />
                    </Link>
                    <Link href={route("admin.backups.index")} className="admin-command-card">
                        <span className="admin-command-icon"><PortalIcon name="download" /></span>
                        <span><small>RESGUARDO</small><strong>Gestionar respaldos</strong><em>Descarga una copia segura de la base de datos.</em></span>
                        <PortalIcon name="arrow" />
                    </Link>
                </section>
                <section
                    className="portal-stats admin-dashboard-kpis"
                    aria-label="Resumen de usuarios"
                >
                    <StatCard
                        label="Usuarios registrados"
                        value={summary.total}
                        hint="Personal con cuenta en el sistema"
                        icon="users"
                        tone="blue"
                    />
                    <StatCard
                        label="Cuentas activas"
                        value={summary.active}
                        hint="Con acceso habilitado"
                        icon="check"
                        tone="green"
                    />
                    <StatCard
                        label="Jefes de área"
                        value={summary.heads}
                        hint="Responsables activos"
                        icon="shield"
                    />
                    <StatCard
                        label="Áreas registradas"
                        value={summary.areas}
                        hint="Estructura de la organización"
                        icon="grid"
                        tone="amber"
                    />
                </section>
                <PendingWorkflow data={pendingWorkflow} reminderInterval={reminderInterval} />
                <section className="admin-analytics-section" aria-label="Indicadores operativos">
                    <div className="admin-section-heading">
                        <div>
                            <p>VISTA DE DECISIÓN</p>
                            <h2>Operación en una mirada</h2>
                        </div>
                        <span>Selecciona una fila para profundizar.</span>
                    </div>
                    <div className="admin-insights">
                    <article className="portal-card admin-insight-card admin-insight-card--flow">
                        <div className="admin-insight-head">
                            <div>
                                <p>OPERACIÓN</p>
                                <h2>Flujo de papeletas</h2>
                                <span>Identifica dónde se acumulan las solicitudes.</span>
                            </div>
                            <Link href={route("exit-slips.index")} className="admin-insight-link">
                                Ver bandeja <PortalIcon name="arrow" />
                            </Link>
                        </div>
                        <WorkflowChart data={workflow} />
                    </article>
                    <article className="portal-card admin-insight-card">
                        <div className="admin-insight-head">
                            <div>
                                <p>DEMANDA</p>
                                <h2>Solicitudes por mes</h2>
                                <span>Compara la carga de los últimos seis meses.</span>
                            </div>
                        </div>
                        <MonthlyChart data={monthly} />
                    </article>
                    <article className="portal-card admin-insight-card">
                        <div className="admin-insight-head">
                            <div>
                                <p>GOBIERNO DE ACCESOS</p>
                                <h2>Cobertura por rol</h2>
                                <span>Verde: activo · Gris: sin acceso.</span>
                            </div>
                        </div>
                        <AccessChart data={accessByRole} />
                    </article>
                    </div>
                </section>
                <section className="portal-card admin-directory">
                    <div className="portal-card-head admin-directory-head">
                        <div>
                            <p className="admin-directory-eyebrow">DIRECTORIO Y GOBIERNO</p>
                            <h2>Directorio de personal</h2>
                            <p>
                                Gestiona el acceso y la asignación de cada
                                usuario.
                            </p>
                        </div>
                        <div className="admin-directory-summary">
                            <span>{summary.active} activas</span>
                            <span className="portal-badge">
                                {users.total} usuarios
                            </span>
                        </div>
                    </div>
                    <form
                        className="portal-toolbar"
                        onSubmit={(e) => {
                            e.preventDefault();
                            router.get(
                                route("admin.dashboard"),
                                { q: query, rol: role, activo: active },
                                { preserveState: true, preserveScroll: true },
                            );
                        }}
                    >
                        <div className="portal-search">
                            <PortalIcon name="search" />
                            <input
                                aria-label="Buscar personal"
                                placeholder="Buscar nombre, apellido o DNI…"
                                maxLength={120}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>
                        <select
                            aria-label="Filtrar por rol"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        >
                            <option value="">Todos los roles</option>
                            <option value="admin">Administración</option>
                            {roles.map((r) => (
                                <option key={r.value} value={r.value}>
                                    {r.label}
                                </option>
                            ))}
                        </select>
                        <select
                            aria-label="Filtrar por acceso"
                            value={active}
                            onChange={(e) => setActive(e.target.value)}
                        >
                            <option value="">Todos los accesos</option>
                            <option value="1">Activos</option>
                            <option value="0">Inactivos</option>
                        </select>
                        <button className="portal-btn portal-btn-primary">
                            <PortalIcon name="filter" />
                            Filtrar
                        </button>
                        {(filters.q || filters.rol || filters.activo) && (
                            <button
                                type="button"
                                className="portal-btn portal-btn-light"
                                onClick={() => {
                                    setQuery("");
                                    setRole("");
                                    setActive("");
                                    router.get(
                                        route("admin.dashboard"),
                                        {},
                                        { preserveState: true },
                                    );
                                }}
                            >
                                Limpiar
                            </button>
                        )}
                    </form>
                    {users.data.length ? (
                        <div className="portal-table-wrap">
                            <table className="portal-table">
                                <thead>
                                    <tr>
                                        <th>Usuario</th>
                                        <th>Rol</th>
                                        <th>Área / responsable</th>
                                        <th>Acceso</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.data.map((person) => (
                                        <tr key={person.id}>
                                            <td>
                                                <div className="portal-person">
                                                    <Avatar
                                                        name={`${person.nombres} ${person.apellidos}`}
                                                        photo={
                                                            person.profile_photo_url
                                                        }
                                                        small
                                                    />
                                                    <div>
                                                        <strong>
                                                            {person.nombres}{" "}
                                                            {person.apellidos}
                                                        </strong>
                                                        <small>
                                                            DNI {person.dni}
                                                        </small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                {roleLabels[person.rol] ||
                                                    person.rol}
                                            </td>
                                            <td>
                                                <div>
                                                    {person.area?.nombre ||
                                                        "Sin área asignada"}
                                                </div>
                                                <div className="portal-cell-muted mt-1">
                                                    {person.jefe
                                                        ? `${person.jefe.nombres} ${person.jefe.apellidos}`
                                                        : "Sin jefe asignado"}
                                                </div>
                                            </td>
                                            <td>
                                                <StatusBadge
                                                    state={
                                                        person.activo
                                                            ? "active"
                                                            : "inactive"
                                                    }
                                                    label={
                                                        person.activo
                                                            ? "Activo"
                                                            : "Inactivo"
                                                    }
                                                />
                                            </td>
                                            <td>
                                                <div className="flex gap-2">
                                                    <button
                                                        className="portal-icon-button"
                                                        aria-label={`Editar acceso de ${person.nombres}`}
                                                        title="Editar acceso"
                                                        onClick={() =>
                                                            openEdit(person)
                                                        }
                                                    >
                                                        <PortalIcon name="edit" />
                                                    </button>
                                                    {person.id !== me && (
                                                        <button
                                                            className="portal-icon-button"
                                                            aria-label={`Eliminar a ${person.nombres}`}
                                                            title="Eliminar usuario"
                                                            onClick={() => {
                                                                remove.clearErrors();
                                                                setDeleting(
                                                                    person,
                                                                );
                                                            }}
                                                        >
                                                            <PortalIcon name="close" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="portal-empty">
                            <PortalIcon name="users" />
                            <strong>No encontramos usuarios</strong>
                            <p>
                                Prueba otro nombre o ajusta los filtros del
                                directorio.
                            </p>
                        </div>
                    )}
                    <PaginationBar page={users} />
                </section>
                <aside className="portal-tip">
                    <PortalIcon name="shield" />
                    <p>
                        Asigna un jefe activo de la misma área para que el
                        personal pueda enviar sus papeletas a revisión.
                    </p>
                </aside>
            </div>
            <Modal show={creating} onClose={closeCreate}>
                <form
                    className="portal-modal"
                    onSubmit={(e) => {
                        e.preventDefault();
                        create.post(route("admin.users.store"), {
                            preserveScroll: true,
                            onSuccess: () => {
                                setCreating(false);
                                create.reset();
                                setPasswordVisible(false);
                            },
                        });
                    }}
                >
                    <div className="portal-modal-head">
                        <div>
                            <DialogTitle>Nuevo usuario</DialogTitle>
                            <p>
                                Registra al personal y configura su acceso
                                inicial.
                            </p>
                        </div>
                        <button
                            type="button"
                            aria-label="Cerrar"
                            onClick={closeCreate}
                            disabled={create.processing}
                        >
                            ×
                        </button>
                    </div>
                    <div className="portal-form-grid">
                        {(["nombres", "apellidos", "dni", "cargo_designado"] as const).map((key) => (
                            <div className="portal-field relative" key={key}>
                                <label htmlFor={`create-${key}`}>
                                    {
                                        {
                                            nombres: "Nombres",
                                            apellidos: "Apellidos",
                                            dni: "DNI",
                                            cargo_designado: "Cargo",
                                        }[key]
                                    }
                                </label>
                                <div className={key === "dni" ? "portal-dni-control" : "relative flex items-center"}>
                                    <input
                                        id={`create-${key}`}
                                        required
                                        className="w-full"
                                        maxLength={key === "dni" ? 8 : 255}
                                        inputMode={
                                            key === "dni" ? "numeric" : undefined
                                        }
                                        pattern={
                                            key === "dni" ? "[0-9]{8}" : undefined
                                        }
                                        value={create.data[key]}
                                        onChange={(e) => {
                                            const value = key === "dni"
                                                ? e.target.value.replace(/\D/g, "").slice(0, 8)
                                                : e.target.value;
                                            create.setData(key, value);
                                            if (key === "dni") setDniLookupState("idle");
                                        }}
                                    />
                                    {key === "dni" && (
                                        <button
                                            type="button"
                                            className="portal-dni-lookup"
                                            disabled={isFetchingReniec || create.data.dni.length !== 8}
                                            onClick={lookupDni}
                                        >
                                            {isFetchingReniec ? <><span className="portal-dni-spinner" /> Consultando</> : <><PortalIcon name="search" /> Consultar DNI</>}
                                        </button>
                                    )}
                                </div>
                                {key === "dni" && <p className={`portal-dni-feedback ${dniLookupState}`} aria-live="polite">
                                    {dniLookupState === "success" && "Datos encontrados. Verifica los campos antes de crear la cuenta."}
                                    {dniLookupState === "manual" && "No se encontraron datos para este DNI. Completa Nombres y Apellidos manualmente."}
                                    {dniLookupState === "idle" && "Ingresa los 8 dígitos y selecciona Consultar DNI."}
                                </p>}
                            </div>
                        ))}
                        <div className="portal-field">
                            <label htmlFor="create-role">Rol del usuario</label>
                            <select
                                id="create-role"
                                value={create.data.rol}
                                onChange={(e) =>
                                    create.setData("rol", e.target.value)
                                }
                            >
                                {roles.map((r) => (
                                    <option key={r.value} value={r.value}>
                                        {r.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="portal-field">
                            <label htmlFor="create-area">
                                Área{" "}
                                {create.data.rol === "area_head"
                                    ? "(obligatoria)"
                                    : "(opcional)"}
                            </label>
                            <select
                                id="create-area"
                                required={create.data.rol === "area_head"}
                                value={create.data.area_id}
                                onChange={(e) =>
                                    create.setData("area_id", e.target.value)
                                }
                            >
                                <option value="">Seleccionar área</option>
                                {areas.map((area) => (
                                    <option key={area.id} value={area.id}>
                                        {area.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="portal-field portal-data-wide">
                            <label htmlFor="create-password">
                                Contraseña inicial
                            </label>
                            <div className="flex gap-2">
                                <input
                                    id="create-password"
                                    required
                                    minLength={8}
                                    autoComplete="new-password"
                                    type={passwordVisible ? "text" : "password"}
                                    value={create.data.password}
                                    onChange={(e) =>
                                        create.setData(
                                            "password",
                                            e.target.value,
                                        )
                                    }
                                />
                                <button
                                    type="button"
                                    className="portal-btn portal-btn-light"
                                    aria-pressed={passwordVisible}
                                    onClick={() =>
                                        setPasswordVisible(!passwordVisible)
                                    }
                                >
                                    {passwordVisible ? "Ocultar" : "Mostrar"}
                                </button>
                            </div>
                            <p className="mt-2 text-xs text-slate-500">
                                Mínimo 8 caracteres. El usuario podrá cambiarla
                                en su perfil.
                            </p>
                        </div>
                    </div>
                    {Object.values(create.errors).length > 0 && (
                        <div className="portal-error" role="alert">
                            {Object.values(create.errors).map((error, i) => (
                                <p key={i}>{error}</p>
                            ))}
                        </div>
                    )}
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            className="portal-btn portal-btn-light"
                            onClick={closeCreate}
                            disabled={create.processing}
                        >
                            Cancelar
                        </button>
                        <button
                            className="portal-btn portal-btn-primary"
                            disabled={create.processing}
                        >
                            {create.processing ? "Creando…" : "Crear usuario"}
                        </button>
                    </div>
                </form>
            </Modal>
            <Modal
                show={!!editing}
                onClose={() => !edit.processing && setEditing(null)}
                maxWidth="lg"
            >
                <form
                    className="portal-modal"
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (editing) {
                            edit.transform((data) => ({
                                ...data,
                                area_id: data.area_id || null,
                                jefe_id: data.jefe_id || null,
                            }));
                            edit.put(route("admin.users.update", editing.id), {
                                preserveScroll: true,
                                onSuccess: () => setEditing(null),
                            });
                        }
                    }}
                >
                    <div className="portal-modal-head">
                        <div>
                            <DialogTitle>Editar acceso</DialogTitle>
                            <p>
                                {editing?.nombres} {editing?.apellidos}
                            </p>
                        </div>
                        <button
                            type="button"
                            aria-label="Cerrar"
                            disabled={edit.processing}
                            onClick={() => setEditing(null)}
                        >
                            ×
                        </button>
                    </div>
                    <div className="space-y-5">
                        <div className="portal-field">
                            <label htmlFor="edit-area">Área</label>
                            <select
                                id="edit-area"
                                value={edit.data.area_id}
                                onChange={(e) =>
                                    edit.setData({
                                        ...edit.data,
                                        area_id: e.target.value,
                                        jefe_id: "",
                                    })
                                }
                            >
                                <option value="">Sin área asignada</option>
                                {areas.map((area) => (
                                    <option key={area.id} value={area.id}>
                                        {area.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="portal-field">
                            <label htmlFor="edit-head">Jefe responsable</label>
                            <select
                                id="edit-head"
                                value={edit.data.jefe_id}
                                onChange={(e) =>
                                    edit.setData("jefe_id", e.target.value)
                                }
                            >
                                <option value="">Sin jefe asignado</option>
                                {heads
                                    .filter(
                                        (head) =>
                                            head.area_id ===
                                                edit.data.area_id &&
                                            head.id !== editing?.id,
                                    )
                                    .map((head) => (
                                        <option key={head.id} value={head.id}>
                                            {head.nombres} {head.apellidos}
                                        </option>
                                    ))}
                            </select>
                        </div>
                        <div className={`account-status-control ${edit.data.activo ? "is-active" : "is-inactive"}`}>
                            <div className="account-status-copy">
                                <span className="account-status-eyebrow">ESTADO DE ACCESO</span>
                                <strong>{edit.data.activo ? "Cuenta activa" : "Cuenta desactivada"}</strong>
                                <p>{edit.data.activo
                                    ? "Puede iniciar sesión y recibir notificaciones del sistema."
                                    : "No podrá iniciar sesión ni recibir nuevas notificaciones hasta volver a activarla."}</p>
                            </div>
                            <label className="account-status-switch">
                                <input
                                    type="checkbox"
                                    disabled={editing?.id === me}
                                    checked={edit.data.activo}
                                    onChange={(e) => edit.setData("activo", e.target.checked)}
                                />
                                <span aria-hidden="true" />
                                <em>{edit.data.activo ? "Activa" : "Desactivada"}</em>
                            </label>
                            {editing?.id === me && <small>Tu propia cuenta no puede desactivarse.</small>}
                        </div>
                    </div>
                    {Object.values(edit.errors).length > 0 && (
                        <p className="portal-error" role="alert">
                            {Object.values(edit.errors).join(" ")}
                        </p>
                    )}
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            className="portal-btn portal-btn-light"
                            disabled={edit.processing}
                            onClick={() => setEditing(null)}
                        >
                            Cancelar
                        </button>
                        <button
                            className="portal-btn portal-btn-primary"
                            disabled={edit.processing}
                        >
                            Guardar cambios
                        </button>
                    </div>
                </form>
            </Modal>
            <Modal
                show={!!deleting}
                onClose={() => !remove.processing && setDeleting(null)}
                maxWidth="md"
            >
                <div className="portal-modal">
                    <div className="portal-modal-head">
                        <DialogTitle>Eliminar usuario</DialogTitle>
                    </div>
                    <p className="text-sm leading-7">
                        Se eliminará la cuenta de{" "}
                        <strong>
                            {deleting?.nombres} {deleting?.apellidos}
                        </strong>
                        . Si solo necesitas suspender su acceso, puedes
                        desactivarla desde «Editar acceso».
                    </p>
                    {Object.values(remove.errors).length > 0 && (
                        <p className="portal-error" role="alert">
                            {Object.values(remove.errors).join(" ")}
                        </p>
                    )}
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            className="portal-btn portal-btn-light"
                            disabled={remove.processing}
                            onClick={() => setDeleting(null)}
                        >
                            Cancelar
                        </button>
                        <button
                            className="portal-btn portal-btn-danger"
                            disabled={remove.processing}
                            onClick={() =>
                                deleting &&
                                remove.delete(
                                    route("admin.users.destroy", deleting.id),
                                    {
                                        preserveScroll: true,
                                        onSuccess: () => setDeleting(null),
                                    },
                                )
                            }
                        >
                            Eliminar usuario
                        </button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
