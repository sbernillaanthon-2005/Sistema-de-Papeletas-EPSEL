import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { PageProps } from "@/types";
import { useState } from "react";
import PortalIcon from "@/Components/PortalIcon";
import {
    Avatar,
    StatCard,
    StatusBadge,
    PaginationBar,
    formatDate,
} from "@/Components/PortalUI";
import { statuses } from "@/types/exit-slip";

interface Slip {
    id: string;
    codigo: string;
    fecha_autorizada: string;
    motivo_label: string;
    estado: string;
    estado_label: string;
    apellidos_nombres: string;
    hora_salida?: string;
    hora_retorno?: string;
}
type Page = {
    current_page: number;
    last_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};
const content: Record<
    string,
    { title: string; intro: string; pending: string; hint: string }
> = {
    admin: {
        title: "Supervisión de papeletas",
        intro: "Consulta el recorrido de las solicitudes y su estado en cada etapa.",
        pending: "submitted",
        hint: "Pendientes de revisión del jefe",
    },
    hr: {
        title: "Gestión de Recursos Humanos",
        intro: "Revisa las solicitudes recibidas, valida su información y completa la autorización.",
        pending: "submitted_to_hr",
        hint: "Esperan tu revisión en RRHH",
    },
    security: {
        title: "Control de salidas y retornos",
        intro: "Verifica las autorizaciones y registra los movimientos del personal.",
        pending: "approved_by_hr",
        hint: "Autorizadas para el control de acceso",
    },
    area_head: {
        title: "Gestión de tu equipo",
        intro: "Revisa las solicitudes de tu equipo y mantén sus autorizaciones al día.",
        pending: "submitted",
        hint: "Solicitudes enviadas a jefatura",
    },
    practitioner: {
        title: "Mi espacio de practicante",
        intro: "Crea tu papeleta y acompaña cada paso de su aprobación, desde un solo lugar.",
        pending: "draft",
        hint: "Borradores por completar y enviar",
    },
    worker: {
        title: "Mi espacio de trabajo",
        intro: "Gestiona tus permisos de salida y consulta el avance de tus solicitudes.",
        pending: "draft",
        hint: "Borradores por completar y enviar",
    },
};
export default function Index({
    auth,
    exitSlips = [],
    pagination,
    counts = {},
    inTransit = 0,
    filters = {},
    canCreate,
}: PageProps<{
    exitSlips: Slip[];
    pagination: Page;
    counts: Record<string, number>;
    inTransit: number;
    filters: { q?: string; estado?: string; fecha?: string };
    canCreate: boolean;
}>) {
    const config = content[auth.user.rol] || content.worker;
    const [query, setQuery] = useState(filters.q || "");
    const [date, setDate] = useState(filters.fecha || "");
    const [state, setState] = useState(filters.estado || "");
    const [busy, setBusy] = useState(false);
    const apply = (estado = state, q = query, fecha = date) =>
        router.get(
            route("exit-slips.index"),
            { q, estado, fecha },
            {
                preserveState: true,
                preserveScroll: true,
                onStart: () => setBusy(true),
                onFinish: () => setBusy(false),
            },
        );
    const total = Object.values(counts).reduce(
        (sum, value) => sum + Number(value),
        0,
    );
    return (
        <AuthenticatedLayout header={<h1>{config.title}</h1>}>
            <Head title={config.title} />
            <div className="portal-stack">
                <section className="portal-hero">
                    <div>
                        <p className="portal-hero-eyebrow">TU PORTAL EPSEL</p>
                        <h2>Hola, {auth.user.nombres.split(" ")[0]}.</h2>
                        <p>{config.intro}</p>
                    </div>
                    {canCreate && (
                        <Link
                            className="portal-btn portal-btn-white"
                            href={route("exit-slips.create")}
                        >
                            <PortalIcon name="plus" />
                            Nueva papeleta
                        </Link>
                    )}
                </section>
                <section
                    className="portal-stats"
                    aria-label="Resumen de papeletas"
                >
                    <StatCard
                        label="Total de papeletas"
                        value={total}
                        hint="Dentro de tu ámbito de acceso"
                        icon="file"
                        tone="blue"
                    />
                    <StatCard
                        label={
                            auth.user.rol === "security"
                                ? "Autorizadas"
                                : "Por atender"
                        }
                        value={Number(counts[config.pending] || 0)}
                        hint={config.hint}
                        icon="clock"
                        tone="amber"
                    />
                    <StatCard
                        label={
                            auth.user.rol === "security"
                                ? "Fuera de sede"
                                : "Aprobadas por RRHH"
                        }
                        value={
                            auth.user.rol === "security"
                                ? inTransit
                                : Number(counts.approved_by_hr || 0)
                        }
                        hint={
                            auth.user.rol === "security"
                                ? "Con salida y sin retorno registrado"
                                : "Con autorización completa"
                        }
                        icon="check"
                        tone="green"
                    />
                    <StatCard
                        label="Finalizadas"
                        value={Number(counts.completed || 0)}
                        hint="Salida y retorno registrados"
                        icon="shield"
                    />
                </section>
                <section className="portal-card" aria-busy={busy}>
                    <div className="portal-card-head">
                        <div>
                            <h2>
                                {auth.user.rol === "security"
                                    ? "Registro de movimientos"
                                    : "Bandeja de papeletas"}
                            </h2>
                            <p>Información actualizada para tu rol.</p>
                        </div>
                        <span className="portal-badge">
                            {pagination.total} registros
                        </span>
                    </div>
                    <div
                        className="portal-tabs"
                        aria-label="Vistas de papeletas"
                    >
                        {[
                            ["", "Todas"],
                            [config.pending, "Por atender"],
                            ["completed", "Finalizadas"],
                        ].map(([value, label]) => (
                            <button
                                key={value}
                                className={state === value ? "active" : ""}
                                aria-pressed={state === value}
                                onClick={() => {
                                    setState(value);
                                    apply(value);
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <form
                        className="portal-toolbar"
                        onSubmit={(event) => {
                            event.preventDefault();
                            apply();
                        }}
                    >
                        <div className="portal-search">
                            <PortalIcon name="search" />
                            <input
                                aria-label="Buscar por código o solicitante"
                                placeholder="Buscar código o solicitante…"
                                value={query}
                                maxLength={120}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>
                        <select
                            aria-label="Filtrar por estado"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                        >
                            <option value="">Todos los estados</option>
                            {Object.entries(statuses).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                        <input
                            aria-label="Fecha autorizada"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                        <button
                            className="portal-btn portal-btn-primary"
                            disabled={busy}
                        >
                            <PortalIcon name="filter" />
                            Filtrar
                        </button>
                        {(filters.q || filters.estado || filters.fecha) && (
                            <button
                                type="button"
                                className="portal-btn portal-btn-light"
                                onClick={() => {
                                    setQuery("");
                                    setDate("");
                                    setState("");
                                    apply("", "", "");
                                }}
                            >
                                Limpiar
                            </button>
                        )}
                    </form>
                    {exitSlips.length ? (
                        <div className="portal-table-wrap">
                            <table className="portal-table">
                                <thead>
                                    <tr>
                                        <th>Papeleta</th>
                                        <th>Solicitante</th>
                                        <th>Fecha autorizada</th>
                                        <th>
                                            {auth.user.rol === "security"
                                                ? "Movimientos"
                                                : "Motivo"}
                                        </th>
                                        <th>Estado</th>
                                        <th>
                                            <span className="sr-only">
                                                Acciones
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {exitSlips.map((slip) => (
                                        <tr key={slip.id}>
                                            <td>
                                                <Link
                                                    className="portal-cell-code"
                                                    href={route(
                                                        "exit-slips.show",
                                                        slip.id,
                                                    )}
                                                >
                                                    <span>
                                                        <PortalIcon name="file" />
                                                    </span>
                                                    {slip.codigo}
                                                </Link>
                                            </td>
                                            <td>
                                                <div className="portal-person">
                                                    <Avatar
                                                        name={
                                                            slip.apellidos_nombres
                                                        }
                                                        small
                                                    />
                                                    <strong>
                                                        {slip.apellidos_nombres}
                                                    </strong>
                                                </div>
                                            </td>
                                            <td>
                                                {formatDate(
                                                    slip.fecha_autorizada,
                                                )}
                                            </td>
                                            <td className="portal-cell-muted">
                                                {auth.user.rol ===
                                                "security" ? (
                                                    <>
                                                        <div>
                                                            Salida:{" "}
                                                            {slip.hora_salida ||
                                                                "Pendiente"}
                                                        </div>
                                                        <div>
                                                            Retorno:{" "}
                                                            {slip.hora_retorno ||
                                                                "Pendiente"}
                                                        </div>
                                                    </>
                                                ) : (
                                                    slip.motivo_label
                                                )}
                                            </td>
                                            <td>
                                                <StatusBadge
                                                    state={slip.estado}
                                                    label={slip.estado_label}
                                                />
                                            </td>
                                            <td>
                                                <Link
                                                    className="portal-row-link"
                                                    href={route(
                                                        "exit-slips.show",
                                                        slip.id,
                                                    )}
                                                    aria-label={`Ver papeleta ${slip.codigo}`}
                                                >
                                                    Ver detalle
                                                    <PortalIcon name="arrow" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="portal-empty">
                            <PortalIcon name="file" />
                            <strong>
                                {total
                                    ? "No encontramos coincidencias"
                                    : "Tu bandeja está lista"}
                            </strong>
                            <p>
                                {total
                                    ? "Prueba con otro código, fecha o estado."
                                    : canCreate
                                      ? "Crea tu primera papeleta para iniciar su proceso de autorización."
                                      : "Las solicitudes aparecerán aquí cuando lleguen a tu etapa del proceso."}
                            </p>
                            {canCreate && !total && (
                                <Link
                                    className="portal-btn portal-btn-primary"
                                    href={route("exit-slips.create")}
                                >
                                    Crear mi primera papeleta
                                    <PortalIcon name="plus" />
                                </Link>
                            )}
                        </div>
                    )}
                    <PaginationBar page={pagination} />
                </section>
                <aside className="portal-tip">
                    <PortalIcon name="shield" />
                    <p>
                        {auth.user.rol === "security"
                            ? "Registra la salida y el retorno únicamente en la fecha autorizada. Cada movimiento queda en el historial de la papeleta."
                            : "Cada aprobación queda registrada. Después de la firma del jefe, el solicitante debe enviar la papeleta a RRHH para continuar."}
                    </p>
                </aside>
            </div>
        </AuthenticatedLayout>
    );
}
