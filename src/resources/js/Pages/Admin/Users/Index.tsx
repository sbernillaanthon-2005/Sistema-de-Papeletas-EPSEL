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
};

function WorkflowChart({ data }: { data: Props["workflow"] }) {
    const max = Math.max(...data.map((item) => item.value), 1);

    return (
        <div className="admin-bar-list" aria-label="Papeletas por etapa">
            {data.map((item) => (
                <Link
                    key={item.key}
                    className="admin-bar-row"
                    href={route("exit-slips.index", { estado: item.key })}
                    title={`Ver ${item.label.toLowerCase()} en la bandeja`}
                >
                    <span className="admin-bar-label">{item.label}</span>
                    <span className="admin-bar-track">
                        <span
                            className={`admin-bar-fill admin-bar-fill--${item.key}`}
                            style={{ width: `${(item.value / max) * 100}%` }}
                        />
                    </span>
                    <strong>{item.value}</strong>
                </Link>
            ))}
        </div>
    );
}

function MonthlyChart({ data }: { data: Props["monthly"] }) {
    const max = Math.max(...data.map((item) => item.value), 1);

    return (
        <div className="admin-month-chart" aria-label="Solicitudes creadas por mes">
            {data.map((item) => (
                <div className="admin-month-column" key={item.label}>
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
    );
}

function AccessChart({ data }: { data: Props["accessByRole"] }) {
    const max = Math.max(...data.map((item) => item.active + item.inactive), 1);

    return (
        <div className="admin-access-list" aria-label="Cuentas activas e inactivas por rol">
            {data.map((item) => {
                const total = item.active + item.inactive;
                return (
                    <Link
                        key={item.key}
                        className="admin-access-row"
                        href={route("admin.dashboard", { rol: item.key })}
                        title={`Filtrar usuarios con rol ${item.label}`}
                    >
                        <span className="admin-access-label">{item.label}</span>
                        <span className="admin-access-track">
                            <span
                                className="admin-access-active"
                                style={{ width: `${(item.active / max) * 100}%` }}
                            />
                            <span
                                className="admin-access-inactive"
                                style={{ width: `${(item.inactive / max) * 100}%` }}
                            />
                        </span>
                        <strong>{total}</strong>
                    </Link>
                );
            })}
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
}: Props) {
    const me = usePage().props.auth.user.id;
    const [creating, setCreating] = useState(false);
    const [editing, setEditing] = useState<Person | null>(null);
    const [deleting, setDeleting] = useState<Person | null>(null);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [isFetchingReniec, setIsFetchingReniec] = useState(false);
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

    const handleDniBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const dni = e.target.value;
        if (dni.length === 8) {
            setIsFetchingReniec(true);
            try {
                const response = await fetch(`/admin/reniec/${dni}`);
                const result = await response.json();
                if (result.success && result.data) {
                    const nombres = result.data.nombres || "";
                    const apellido_paterno = result.data.apellido_paterno || result.data.apellidoPaterno || "";
                    const apellido_materno = result.data.apellido_materno || result.data.apellidoMaterno || "";
                    const apellidos = `${apellido_paterno} ${apellido_materno}`.trim() || result.data.apellidos || "";
                    
                    if (nombres) create.setData(data => ({ ...data, nombres }));
                    if (apellidos) create.setData(data => ({ ...data, apellidos }));
                }
            } catch (e) {
                console.error("Error consultando DNI", e);
            } finally {
                setIsFetchingReniec(false);
            }
        }
    };
    const closeCreate = () => {
        if (!create.processing) {
            setCreating(false);
            create.reset();
            create.clearErrors();
            setPasswordVisible(false);
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
            <div className="portal-stack">
                <section className="portal-hero">
                    <div>
                        <p className="portal-hero-eyebrow">
                            ADMINISTRACIÓN DEL SISTEMA
                        </p>
                        <h2>Un equipo conectado.</h2>
                        <p>
                            Organiza los accesos, asigna áreas y vincula al
                            personal con su jefe responsable.
                        </p>
                    </div>
                    <button
                        className="portal-btn portal-btn-white"
                        onClick={() => setCreating(true)}
                    >
                        <PortalIcon name="plus" />
                        Nuevo usuario
                    </button>
                </section>
                <section
                    className="portal-stats"
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
                <section className="admin-insights" aria-label="Indicadores operativos">
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
                </section>
                <section className="portal-card">
                    <div className="portal-card-head">
                        <div>
                            <h2>Directorio de personal</h2>
                            <p>
                                Gestiona el acceso y la asignación de cada
                                usuario.
                            </p>
                        </div>
                        <span className="portal-badge">
                            {users.total} usuarios
                        </span>
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
                        {(
                            [
                                "nombres",
                                "apellidos",
                                "dni",
                                "cargo_designado",
                            ] as const
                        ).map((key) => (
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
                                <div className="relative flex items-center">
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
                                        onBlur={key === "dni" ? handleDniBlur : undefined}
                                        onChange={(e) =>
                                            create.setData(key, e.target.value)
                                        }
                                    />
                                    {key === "dni" && isFetchingReniec && (
                                        <div className="absolute right-3 flex items-center pointer-events-none">
                                            <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        </div>
                                    )}
                                </div>
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
                        <label className="flex items-center gap-3 text-sm">
                            <input
                                type="checkbox"
                                disabled={editing?.id === me}
                                checked={edit.data.activo}
                                onChange={(e) =>
                                    edit.setData("activo", e.target.checked)
                                }
                            />
                            Cuenta activa
                        </label>
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
