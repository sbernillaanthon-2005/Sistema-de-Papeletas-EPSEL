import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import { Pagination } from "@/types/exit-slip";
import { useRef, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { DialogTitle } from "@headlessui/react";
import Modal from "@/Components/Modal";
import EditUserModal from "./EditUserModal";
import PortalIcon from "@/Components/PortalIcon";
import {
    Avatar,
    StatCard,
    StatusBadge,
    PaginationBar,
    roleLabels,
} from "@/Components/PortalUI";
import adminHeroBanner from "../../../../images/Banner azul de agua con mascota EPSel.png";
type Person = {
    id: string;
    nombres: string;
    apellidos: string;
    dni: string;
    rol: string;
    custom_role_id?: string | null;
    rol_label?: string;
    activo: boolean;
    area_id: string | null;
    jefe_id: string | null;
    jefe_responsable_nombre: string | null;
    area?: { nombre: string };
    jefe?: { nombres: string; apellidos: string };
    profile_photo_url?: string;
};
type Props = {
    users: Pagination<Person>;
    areas: { id: string; nombre: string }[];
    responsibleHeads: string[];
    registeredHeads: { id: string; nombre: string }[];
    roles: { value: string; label: string; base_role?: string }[];
    summary: { total: number; active: number; heads: number; areas: number };
    filters: { q?: string; rol?: string; activo?: string };
    workflow: { key: string; label: string; value: number }[];
    monthly: { key: string; label: string; value: number }[];
    accessByRole: { key: string; label: string; active: number; inactive: number }[];
    pendingWorkflow: { id: string; code: string; requester: string; stage: string; responsible: string; requires_signature: boolean }[];
    reminderInterval: number;
};
gsap.registerPlugin(useGSAP);

function PendingWorkflow({ data, reminderInterval }: { data: Props["pendingWorkflow"]; reminderInterval: number }) {
    const reminder = useForm({ minutes: reminderInterval });
    const signing = data.filter((item) => item.requires_signature);
    const presets = [15, 30, 60, 120];

    return (
        <section className="adm-v3-sla-panel" aria-label="Seguimiento de firmas pendientes">
            <div className="adm-v3-sla-head">
                <div className="adm-v3-sla-title-group">
                    <span className={`adm-v3-sla-icon ${data.length > 0 ? "is-pending" : ""}`}>
                        <PortalIcon name={data.length > 0 ? "alert" : "shield"} />
                    </span>
                    <div className="adm-v3-sla-titles">
                        <h3>
                            <span>Monitor de firmas y flujo de aprobación</span>
                            <span className={`adm-v3-hero-badge ${data.length > 0 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                                {data.length === 0 ? "Flujo al día" : `${data.length} en espera`}
                            </span>
                        </h3>
                        <p>
                            {data.length === 0
                                ? "No hay papeletas detenidas. Todas las solicitudes avanzan a tiempo en cada etapa."
                                : `${signing.length} esperando firma de jefatura/RRHH · ${data.length} pendientes en total`}
                        </p>
                    </div>
                </div>

                <form
                    className="adm-v3-sla-reminder-form"
                    onSubmit={(event) => {
                        event.preventDefault();
                        reminder.put(route("admin.reminder-settings.update"), { preserveScroll: true });
                    }}
                >
                    <span className="adm-v3-sla-reminder-lbl">
                        <PortalIcon name="clock" />
                        Recordar cada:
                    </span>
                    <div className="adm-v3-sla-presets">
                        {presets.map((m) => (
                            <button
                                key={m}
                                type="button"
                                className={`adm-v3-sla-preset-pill ${reminder.data.minutes === m ? "is-active" : ""}`}
                                onClick={() => reminder.setData("minutes", m)}
                            >
                                {m}m
                            </button>
                        ))}
                    </div>
                    <input
                        id="reminder-minutes"
                        type="number"
                        min="1"
                        max="1440"
                        className="adm-v3-sla-input"
                        value={reminder.data.minutes}
                        onChange={(event) => reminder.setData("minutes", Number(event.target.value))}
                        title="Minutos entre recordatorios"
                    />
                    <span className="text-xs text-slate-500">min</span>
                    <button
                        type="submit"
                        className="portal-btn portal-btn-primary adm-v3-sla-save-btn"
                        disabled={reminder.processing}
                    >
                        {reminder.processing ? "Guardando..." : "Guardar"}
                    </button>
                </form>
            </div>

            {data.length ? (
                <div className="pending-list">
                    {data.map((item) => (
                        <Link
                            key={item.id}
                            href={route("papeletas.show", item.code)}
                            className="pending-row"
                            title={`Abrir ${item.code}`}
                        >
                            <span className="pending-code">{item.code}</span>
                            <span className="pending-route">
                                <b>{item.requester}</b>
                                <i />
                                <strong className={item.requires_signature ? "pending-stage pending-stage--signature" : "pending-stage"}>
                                    {item.stage}
                                </strong>
                                <i />
                                <b>{item.responsible}</b>
                            </span>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="adm-v3-sla-empty">
                    <PortalIcon name="check" />
                    <span>Todas las firmas se encuentran al día. El flujo de aprobación institucional no presenta retrasos ni cuellos de botella.</span>
                </div>
            )}
        </section>
    );
}

function WorkflowChart({ data }: { data: Props["workflow"] }) {
    const max = Math.max(...data.map((item) => item.value), 1);
    const total = data.reduce((sum, item) => sum + item.value, 0);
    return (
        <div className="admin-chart-content">
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
            <div className="admin-month-chart" aria-label={"Solicitudes creadas por mes. " + total + " solicitudes durante los últimos seis meses."}>
            {data.map((item) => (
                <div className={"admin-month-column " + (item.value === max && item.value > 0 ? "is-peak" : "")} key={item.key} aria-label={item.label + ": " + item.value + " solicitudes"}>
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

type RegisteredItem = { key: string; label: string; id?: string };

function RegisteredList({ label, items, emptyMessage, endpoint }: { label: string; items: RegisteredItem[]; emptyMessage: string; endpoint: string }) {
    const [expanded, setExpanded] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");
    const [busyId, setBusyId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const save = (id: string) => {
        if (!editingName.trim()) return;
        setBusyId(id);
        setError("");
        router.put(`${endpoint}/${id}`, { nombre: editingName.trim() }, {
            preserveScroll: true,
            onSuccess: () => setEditingId(null),
            onError: (errors) => setError(errors.nombre || errors.registro || "No se pudo guardar el cambio."),
            onFinish: () => setBusyId(null),
        });
    };
    const removeItem = (item: RegisteredItem) => {
        if (!item.id || !window.confirm(`¿Eliminar «${item.label}»?`)) return;
        setBusyId(item.id);
        setError("");
        router.delete(`${endpoint}/${item.id}`, {
            preserveScroll: true,
            onError: (errors) => setError(errors.registro || "No se pudo eliminar el registro."),
            onFinish: () => setBusyId(null),
        });
    };
    return <div className="admin-registered-heads">
        <button type="button" className="admin-registered-heads-toggle" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
            <span className="admin-registered-heads-label">{label} <strong>{items.length}</strong></span>
            <span className="admin-registered-heads-action">{expanded ? "Ocultar lista" : "Ver lista"} <PortalIcon name="chevron" /></span>
        </button>
        {expanded && <div className="admin-registered-heads-list">
            {error && <p className="portal-error" role="alert">{error}</p>}
            {items.length ? <ul>{items.map((item) => <li key={item.key} className="admin-registered-item">
                {editingId === item.id ? <>
                    <input aria-label={`Editar ${item.label}`} value={editingName} maxLength={255} onChange={(event) => setEditingName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); save(item.id!); } if (event.key === "Escape") setEditingId(null); }} />
                    <button type="button" className="admin-registered-save" disabled={busyId === item.id || !editingName.trim()} onClick={() => save(item.id!)}>Guardar</button>
                    <button type="button" className="admin-registered-cancel" onClick={() => setEditingId(null)}>Cancelar</button>
                </> : <>
                    <span>{item.label}</span>
                    {item.id ? <div className="admin-registered-actions">
                        <button type="button" aria-label={`Editar ${item.label}`} title="Editar" disabled={!!busyId} onClick={() => { setEditingId(item.id!); setEditingName(item.label); setError(""); }}><PortalIcon name="edit" /></button>
                        <button type="button" className="admin-registered-delete" aria-label={`Eliminar ${item.label}`} title="Eliminar" disabled={!!busyId} onClick={() => removeItem(item)}><PortalIcon name="trash" /></button>
                    </div> : <small className="admin-registered-system">{endpoint.endsWith("roles") ? "Rol del sistema" : "Cuenta existente"}</small>}
                </>}
            </li>)}</ul> : <p>{emptyMessage}</p>}
        </div>}
    </div>;
}

export default function Index({
    users,
    areas,
    responsibleHeads,
    registeredHeads,
    roles,
    summary,
    filters,
    workflow,
    monthly,
    accessByRole,
    pendingWorkflow,
    reminderInterval,
}: Props) {
    const me = usePage().props.auth.user.id;
    const dashboardRef = useRef<HTMLDivElement>(null);
    useGSAP(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        const timeline = gsap.timeline({ defaults: { ease: "power2.out" } });
        timeline.from(".adm-v3-hero", { y: 12, opacity: 0, duration: .45, clearProps: "all" })
            .from(".adm-v3-kpis-grid .adm-v3-kpi-card", { y: 14, opacity: 0, duration: .4, stagger: .08, clearProps: "all" }, "-=.2")
            .from(".adm-v3-sla-panel, .adm-v3-insight-card, .adm-v3-directory-card", { y: 12, opacity: 0, duration: .4, stagger: .08, clearProps: "all" }, "-=.12")
            .from(".admin-bar-fill, .admin-access-active", { scaleX: 0, duration: .65, stagger: .05, transformOrigin: "left center", clearProps: "transform" }, "-=.12")
            .from(".admin-month-fill", { scaleY: 0, duration: .65, stagger: .08, transformOrigin: "center bottom", clearProps: "transform" }, "<");
    }, { scope: dashboardRef });
    const [creating, setCreating] = useState(false);
    const [creatingArea, setCreatingArea] = useState(false);
    const [creatingRole, setCreatingRole] = useState(false);
    const [creatingHead, setCreatingHead] = useState(false);
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
        jefe_responsable_nombre: "",
    });
    const areaForm = useForm({ nombre: "" });
    const roleForm = useForm({ nombre: "" });
    const headForm = useForm({ nombre: "" });
    const remove = useForm({});
    const selectedBaseRole = roles.find((item) => item.value === create.data.rol)?.base_role || create.data.rol;

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
        setEditing(person);
    };
    return (
        <AuthenticatedLayout header={<h1>Usuarios y accesos</h1>}>
            <Head title="Administración de usuarios" />
            <div className="portal-stack admin-dashboard admin-dashboard-v3" data-admin-dashboard="true" ref={dashboardRef}>
                {/* ── Signature Executive Hero Banner ── */}
                <section className="adm-v3-hero" aria-label="Centro de control institucional">
                    <img
                        className="adm-v3-hero-bg"
                        src={adminHeroBanner}
                        alt=""
                        aria-hidden="true"
                    />
                    <div className="adm-v3-hero-content">
                        <p className="adm-v3-hero-eyebrow">
                            <span className="adm-v3-hero-pulse-dot" />
                            GOBIERNO INSTITUCIONAL · CENTRO DE CONTROL
                        </p>
                        <h2 className="adm-v3-hero-title">
                            Centro de control <span>y gobierno de accesos</span>
                        </h2>
                        <p className="adm-v3-hero-desc">
                            Administra los accesos de los usuarios, organiza las dependencias jerárquicas y supervisa la trazabilidad y firmas del sistema en tiempo real.
                        </p>
                        <div className="adm-v3-hero-badges">
                            <span className="adm-v3-hero-badge">
                                <PortalIcon name="check" />
                                Sistema operativo al 100%
                            </span>
                            <span className="adm-v3-hero-badge">
                                <PortalIcon name="users" />
                                {summary.active} cuentas activas
                            </span>
                            <span className="adm-v3-hero-badge">
                                <PortalIcon name="shield" />
                                {summary.heads} jefaturas asignadas
                            </span>
                            <span className="adm-v3-hero-badge">
                                <PortalIcon name="grid" />
                                {summary.areas} áreas orgánicas
                            </span>
                        </div>
                    </div>

                    <div className="adm-v3-hero-actions" aria-label="Acciones de administración">
                        <button
                            type="button"
                            className="adm-v3-btn-primary"
                            onClick={() => setCreating(true)}
                        >
                            <PortalIcon name="plus" />
                            Registrar nuevo usuario
                        </button>
                        <div className="adm-v3-catalogs-row">
                            <button
                                type="button"
                                className="adm-v3-catalog-btn"
                                onClick={() => setCreatingArea(true)}
                                title="Crear nueva área de trabajo"
                            >
                                <PortalIcon name="grid" />
                                Nueva área
                            </button>
                            <button
                                type="button"
                                className="adm-v3-catalog-btn"
                                onClick={() => setCreatingRole(true)}
                                title="Registrar nuevo rol personalizado"
                            >
                                <PortalIcon name="shield" />
                                Nuevo rol
                            </button>
                            <button
                                type="button"
                                className="adm-v3-catalog-btn"
                                onClick={() => setCreatingHead(true)}
                                title="Registrar nuevo jefe responsable"
                            >
                                <PortalIcon name="users" />
                                Nuevo jefe
                            </button>
                        </div>
                    </div>
                </section>

                {/* ── Modern Telemetry KPI Cards ── */}
                <section className="adm-v3-kpis-grid" aria-label="Resumen de usuarios">
                    <article className="adm-v3-kpi-card">
                        <div className="adm-v3-kpi-card-top">
                            <div className="adm-v3-kpi-icon-wrap tone-cyan">
                                <PortalIcon name="users" />
                            </div>
                            <span className="adm-v3-kpi-badge">Directorio</span>
                        </div>
                        <div className="adm-v3-kpi-card-main">
                            <span className="adm-v3-kpi-value">{summary.total}</span>
                            <span className="adm-v3-kpi-label">Usuarios registrados</span>
                            <span className="adm-v3-kpi-hint">Personal con cuenta en el sistema</span>
                        </div>
                    </article>

                    <article className="adm-v3-kpi-card">
                        <div className="adm-v3-kpi-card-top">
                            <div className="adm-v3-kpi-icon-wrap tone-emerald">
                                <PortalIcon name="check" />
                            </div>
                            <span className="adm-v3-kpi-badge">100% activo</span>
                        </div>
                        <div className="adm-v3-kpi-card-main">
                            <span className="adm-v3-kpi-value">{summary.active}</span>
                            <span className="adm-v3-kpi-label">Cuentas activas</span>
                            <span className="adm-v3-kpi-hint">Con acceso institucional habilitado</span>
                        </div>
                    </article>

                    <article className="adm-v3-kpi-card">
                        <div className="adm-v3-kpi-card-top">
                            <div className="adm-v3-kpi-icon-wrap tone-amber">
                                <PortalIcon name="shield" />
                            </div>
                            <span className="adm-v3-kpi-badge">Aprobadores</span>
                        </div>
                        <div className="adm-v3-kpi-card-main">
                            <span className="adm-v3-kpi-value">{summary.heads}</span>
                            <span className="adm-v3-kpi-label">Jefes de área</span>
                            <span className="adm-v3-kpi-hint">Responsables activos de aprobación</span>
                        </div>
                    </article>

                    <article className="adm-v3-kpi-card">
                        <div className="adm-v3-kpi-card-top">
                            <div className="adm-v3-kpi-icon-wrap tone-purple">
                                <PortalIcon name="grid" />
                            </div>
                            <span className="adm-v3-kpi-badge">Estructura</span>
                        </div>
                        <div className="adm-v3-kpi-card-main">
                            <span className="adm-v3-kpi-value">{summary.areas}</span>
                            <span className="adm-v3-kpi-label">Áreas registradas</span>
                            <span className="adm-v3-kpi-hint">Subgerencias y departamentos EPSEL</span>
                        </div>
                    </article>
                </section>

                {/* ── SLA Monitor / Recordatorios ── */}
                <PendingWorkflow data={pendingWorkflow} reminderInterval={reminderInterval} />

                {/* ── Analytics Section V3 ── */}
                <section className="adm-v3-analytics-grid" aria-label="Indicadores operativos">
                    <article className="adm-v3-insight-card">
                        <div className="adm-v3-insight-head">
                            <div>
                                <p className="adm-v3-insight-tag">OPERACIÓN EN CURSO</p>
                                <h2 className="adm-v3-insight-title">Flujo de papeletas</h2>
                                <p className="adm-v3-insight-desc">Identifica dónde se acumulan las solicitudes.</p>
                            </div>
                            <div className="admin-insight-heading-actions">
                                <Link href={route("exit-slips.index")} className="admin-insight-link">
                                    Ver bandeja <PortalIcon name="arrow" />
                                </Link>
                                <span className="adm-v3-insight-badge">
                                    {workflow.reduce((sum, item) => sum + item.value, 0)} en proceso
                                </span>
                            </div>
                        </div>
                        <WorkflowChart data={workflow} />
                    </article>

                    <article className="adm-v3-insight-card">
                        <div className="adm-v3-insight-head">
                            <div>
                                <p className="adm-v3-insight-tag">DEMANDA MENSUAL</p>
                                <h2 className="adm-v3-insight-title">Solicitudes por mes</h2>
                                <p className="adm-v3-insight-desc">Compara la carga de los últimos seis meses.</p>
                            </div>
                            <span className="adm-v3-insight-badge">
                                {monthly.reduce((peak, item) => item.value > peak.value ? item : peak, monthly[0])?.label}: {monthly.reduce((peak, item) => item.value > peak.value ? item : peak, monthly[0])?.value} reg.
                            </span>
                        </div>
                        <MonthlyChart data={monthly} />
                    </article>

                    <article className="adm-v3-insight-card">
                        <div className="adm-v3-insight-head">
                            <div>
                                <p className="adm-v3-insight-tag">GOBIERNO DE ACCESOS</p>
                                <h2 className="adm-v3-insight-title">Cobertura por rol</h2>
                                <p className="adm-v3-insight-desc">Verde: activo · Gris: sin acceso.</p>
                            </div>
                        </div>
                        <AccessChart data={accessByRole} />
                    </article>
                </section>

                {/* ── Directorio de personal V3 ── */}
                <section className="adm-v3-directory-card">
                    <div className="adm-v3-directory-head">
                        <div className="adm-v3-directory-title-wrap">
                            <span className="adm-v3-directory-icon">
                                <PortalIcon name="users" />
                            </span>
                            <div className="adm-v3-directory-titles">
                                <h2>Directorio de personal</h2>
                                <p>Gestiona el acceso, área asignada y edición de cada colaborador del sistema.</p>
                            </div>
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
                                                {person.rol_label || roleLabels[person.rol] || person.rol}
                                            </td>
                                            <td>
                                                <div>
                                                    {person.area?.nombre ||
                                                        "Sin área asignada"}
                                                </div>
                                                <div className="portal-cell-muted mt-1">
                                                    {person.jefe_responsable_nombre || (person.jefe ? `${person.jefe.nombres} ${person.jefe.apellidos}` : "Sin jefe asignado")}
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
                                                        className="portal-icon-button user-action-edit"
                                                        aria-label={`Editar usuario ${person.nombres} ${person.apellidos}`}
                                                        title="Editar usuario"
                                                        onClick={() =>
                                                            openEdit(person)
                                                        }
                                                    >
                                                        <PortalIcon name="edit" />
                                                    </button>
                                                    {person.id !== me && (
                                                        <button
                                                            className="portal-icon-button user-action-delete"
                                                            aria-label={`Eliminar a ${person.nombres}`}
                                                            title="Eliminar usuario"
                                                            onClick={() => {
                                                                remove.clearErrors();
                                                                setDeleting(
                                                                    person,
                                                                );
                                                            }}
                                                        >
                                                            <PortalIcon name="trash" />
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
            <Modal show={creatingHead} onClose={() => { if (!headForm.processing) { setCreatingHead(false); headForm.reset(); headForm.clearErrors(); } }} maxWidth="lg">
                <form className="portal-modal" onSubmit={(event) => {
                    event.preventDefault();
                    headForm.post(route("admin.responsible-heads.store"), {
                        preserveScroll: true,
                        onSuccess: () => { setCreatingHead(false); headForm.reset(); },
                    });
                }}>
                    <div className="portal-modal-head"><div><DialogTitle>Nuevo jefe responsable</DialogTitle><p>Registra un nombre para asignarlo al personal.</p></div><button type="button" aria-label="Cerrar" disabled={headForm.processing} onClick={() => { setCreatingHead(false); headForm.reset(); headForm.clearErrors(); }}>×</button></div>
                    <div className="portal-field"><label htmlFor="standalone-head-name">Nombre del jefe</label><input id="standalone-head-name" required maxLength={255} value={headForm.data.nombre} onChange={(event) => headForm.setData("nombre", event.target.value)} placeholder="Ej.: Jefe de Operaciones" />{headForm.errors.nombre && <small className="portal-error" role="alert">{headForm.errors.nombre}</small>}</div>
                    <RegisteredList label="Jefes registrados" items={responsibleHeads.map((name) => ({ key: name, label: name, id: registeredHeads.find((head) => head.nombre.toLocaleLowerCase() === name.toLocaleLowerCase())?.id }))} endpoint="/admin/responsible-heads" emptyMessage="Aún no hay jefes responsables registrados." />
                    <div className="admin-role-creator-actions admin-head-form-actions"><button type="button" className="portal-btn portal-btn-light" disabled={headForm.processing} onClick={() => { setCreatingHead(false); headForm.reset(); headForm.clearErrors(); }}>Cancelar</button><button type="submit" className="portal-btn portal-btn-primary" disabled={headForm.processing || !headForm.data.nombre.trim()}>{headForm.processing ? "Guardando…" : "Guardar jefe"}</button></div>
                </form>
            </Modal>
            <Modal show={creatingRole} onClose={() => { if (!roleForm.processing) { setCreatingRole(false); roleForm.reset(); roleForm.clearErrors(); } }} maxWidth="lg">
                <form className="portal-modal" onSubmit={(event) => {
                    event.preventDefault();
                    roleForm.post(route("admin.roles.store"), {
                        preserveScroll: true,
                        onSuccess: () => { setCreatingRole(false); roleForm.reset(); },
                    });
                }}>
                    <div className="portal-modal-head"><div><DialogTitle>Registrar nuevo rol</DialogTitle><p>Aparecerá en la lista de roles al registrar usuarios.</p></div><button type="button" aria-label="Cerrar" disabled={roleForm.processing} onClick={() => { setCreatingRole(false); roleForm.reset(); roleForm.clearErrors(); }}>×</button></div>
                    <div className="portal-field"><label htmlFor="standalone-role-name">Nombre del rol</label><input id="standalone-role-name" required maxLength={80} value={roleForm.data.nombre} onChange={(event) => roleForm.setData("nombre", event.target.value)} placeholder="Ej.: Supervisor de operaciones" />{roleForm.errors.nombre && <small className="portal-error" role="alert">{roleForm.errors.nombre}</small>}</div>
                    <RegisteredList label="Roles registrados" items={roles.map((role) => ({ key: role.value, label: role.label, id: role.value.startsWith("custom:") ? role.value.slice(7) : undefined }))} endpoint="/admin/roles" emptyMessage="Aún no hay roles registrados." />
                    <div className="admin-role-creator-actions admin-head-form-actions"><button type="button" className="portal-btn portal-btn-light" disabled={roleForm.processing} onClick={() => { setCreatingRole(false); roleForm.reset(); roleForm.clearErrors(); }}>Cancelar</button><button type="submit" className="portal-btn portal-btn-primary" disabled={roleForm.processing || !roleForm.data.nombre.trim()}>{roleForm.processing ? "Guardando…" : "Guardar rol"}</button></div>
                </form>
            </Modal>
            <Modal show={creatingArea} onClose={() => { if (!areaForm.processing) { setCreatingArea(false); areaForm.reset(); areaForm.clearErrors(); } }} maxWidth="lg">
                <form className="portal-modal" onSubmit={(event) => {
                    event.preventDefault();
                    areaForm.post(route("admin.areas.store"), {
                        preserveScroll: true,
                        onSuccess: () => { setCreatingArea(false); areaForm.reset(); },
                    });
                }}>
                    <div className="portal-modal-head"><div><DialogTitle>Nueva área</DialogTitle><p>Aparecerá en la lista de áreas al registrar usuarios.</p></div><button type="button" aria-label="Cerrar" disabled={areaForm.processing} onClick={() => { setCreatingArea(false); areaForm.reset(); areaForm.clearErrors(); }}>×</button></div>
                    <div className="portal-field"><label htmlFor="standalone-area-name">Nombre del área</label><input id="standalone-area-name" required maxLength={255} value={areaForm.data.nombre} onChange={(event) => areaForm.setData("nombre", event.target.value)} placeholder="Ej.: Oficina de Operaciones" />{areaForm.errors.nombre && <small className="portal-error" role="alert">{areaForm.errors.nombre}</small>}</div>
                    <RegisteredList label="Áreas registradas" items={areas.map((area) => ({ key: area.id, label: area.nombre, id: area.id }))} endpoint="/admin/areas" emptyMessage="Aún no hay áreas registradas." />
                    <div className="admin-role-creator-actions admin-head-form-actions"><button type="button" className="portal-btn portal-btn-light" disabled={areaForm.processing} onClick={() => { setCreatingArea(false); areaForm.reset(); areaForm.clearErrors(); }}>Cancelar</button><button type="submit" className="portal-btn portal-btn-primary" disabled={areaForm.processing || !areaForm.data.nombre.trim()}>{areaForm.processing ? "Guardando…" : "Guardar área"}</button></div>
                </form>
            </Modal>
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
                        {(["nombres", "apellidos", "dni"] as const).map((key) => (
                            <div className="portal-field relative" key={key}>
                                <label htmlFor={`create-${key}`}>
                                    {
                                        {
                                            nombres: "Nombres",
                                            apellidos: "Apellidos",
                                            dni: "DNI",
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
                            <label htmlFor="create-head">Jefe responsable (opcional)</label>
                            <select
                                id="create-head"
                                value={create.data.jefe_responsable_nombre}
                                onChange={(event) => create.setData("jefe_responsable_nombre", event.target.value)}
                                aria-invalid={!!create.errors.jefe_responsable_nombre}
                            >
                                <option value="">Sin jefe asignado</option>
                                {responsibleHeads.map((name) => <option key={name} value={name}>{name}</option>)}
                            </select>
                            {create.errors.jefe_responsable_nombre && <small className="portal-error" role="alert">{create.errors.jefe_responsable_nombre}</small>}
                        </div>
                        <div className="portal-field">
                            <label htmlFor="create-role">Rol del usuario</label>
                            <select
                                id="create-role"
                                value={create.data.rol}
                                onChange={(e) => create.setData("rol", e.target.value)}
                            >
                                {roles.map((r) => (
                                    <option key={r.value} value={r.value}>
                                        {r.label}
                                    </option>
                                ))}
                            </select>
                            {create.errors.rol && <small className="portal-error" role="alert">{create.errors.rol}</small>}
                        </div>
                        <div className="portal-field">
                            <label htmlFor="create-area">
                                Área{" "}
                                {selectedBaseRole === "area_head"
                                    ? "(obligatoria)"
                                    : "(opcional)"}
                            </label>
                            <select
                                id="create-area"
                                required={selectedBaseRole === "area_head"}
                                value={create.data.area_id}
                                onChange={(e) => create.setData("area_id", e.target.value)}
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
            <EditUserModal
                show={!!editing}
                user={editing}
                roles={roles}
                areas={areas}
                responsibleHeads={responsibleHeads}
                me={me}
                onClose={() => setEditing(null)}
            />
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
