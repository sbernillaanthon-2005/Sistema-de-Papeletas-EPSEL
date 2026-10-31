import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { PageProps } from "@/types";
import { useState } from "react";
import { Avatar, PaginationBar, StatCard, formatDate } from "@/Components/PortalUI";
import PortalIcon from "@/Components/PortalIcon";

/* ── Types ── */
interface Solicitante {
    nombres: string;
    apellidos: string;
    dni: string;
    cargo_designado: string | null;
}
interface Item {
    id: string;
    codigo: string;
    estado: string;
    estado_label: string;
    motivo_label: string;
    fecha_autorizada: string;
    enviado_rrhh_at: string | null;
    solicitante: Solicitante;
}
interface Pagination {
    current_page: number;
    last_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
}

/* ── Helpers ── */
const STATUS_CLASS: Record<string, string> = {
    submitted_to_hr:       "status-submitted_to_hr",
    approved_by_hr:        "status-approved_by_hr",
    submitted_to_security: "status-submitted_to_security",
    completed:             "status-completed",
    rejected:              "status-rejected",
};

const HR_STATES: { value: string; label: string }[] = [
    { value: "",                    label: "Todos los estados"   },
    { value: "submitted_to_hr",     label: "Pendiente RRHH"      },
    { value: "approved_by_hr",      label: "Aprobadas por RRHH"  },
    { value: "submitted_to_security", label: "Enviadas a vigilancia" },
    { value: "completed",           label: "Completadas"          },
    { value: "rejected",            label: "Rechazadas"           },
];

function formatDateTime(iso: string | null): { date: string; time: string } {
    if (!iso) return { date: "—", time: "—" };
    const d = new Date(iso);
    return {
        date: d.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" }),
        time: d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }),
    };
}

/* ── Component ── */
export default function Solicitantes({
    items,
    pagination,
    kpis,
    filters,
}: PageProps<{
    items: Item[];
    pagination: Pagination;
    kpis: { uniqueUsers: number; thisMonth: number; pending: number };
    filters: { q?: string; estado?: string };
}>) {
    const [query, setQuery]   = useState(filters.q     || "");
    const [estado, setEstado] = useState(filters.estado || "");
    const [busy,   setBusy]   = useState(false);

    const apply = (q = query, est = estado) =>
        router.get(
            route("hr.solicitantes"),
            { q, estado: est },
            {
                preserveState: true,
                preserveScroll: true,
                onStart:  () => setBusy(true),
                onFinish: () => setBusy(false),
            },
        );

    return (
        <AuthenticatedLayout header={<h1>Solicitantes</h1>}>
            <Head title="Solicitantes — RRHH" />
            <div className="portal-stack">

                {/* Hero */}
                <section className="portal-hero">
                    <div>
                        <p className="portal-hero-eyebrow">RECURSOS HUMANOS</p>
                        <h2>Registro de solicitantes</h2>
                        <p>
                            Todos los empleados que han enviado papeletas a RRHH,
                            con fecha y hora exacta de recepción.
                        </p>
                    </div>
                </section>

                {/* KPI rápido */}
                <section className="portal-stats" aria-label="Resumen rápido">
                    <StatCard
                        label="Usuarios que solicitaron"
                        value={kpis.uniqueUsers}
                        hint="Personal distinto histórico"
                        icon="users"
                        tone="blue"
                    />
                    <StatCard
                        label="Recibidas este mes"
                        value={kpis.thisMonth}
                        hint="Papeletas derivadas a RRHH"
                        icon="file"
                        tone="teal"
                    />
                    <StatCard
                        label="Pendientes de revisión"
                        value={kpis.pending}
                        hint="Requieren tu atención"
                        icon="clock"
                        tone="amber"
                    />
                </section>

                {/* Tabla */}
                <section className="portal-card" aria-busy={busy}>
                    {/* Barra de búsqueda y filtro */}
                    <div className="portal-card-head">
                        <div>
                            <h2>Historial de envíos a RRHH</h2>
                            <p className="portal-card-sub">
                                {pagination.total} registro{pagination.total !== 1 ? "s" : ""}
                            </p>
                        </div>
                    </div>
                    <div className="portal-toolbar">
                        <div className="portal-search">
                            <PortalIcon name="search" />
                            <input
                                id="hr-sol-search"
                                type="search"
                                placeholder="Buscar nombre, DNI o código…"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && apply()}
                            />
                        </div>
                        <select
                            id="hr-sol-estado"
                            value={estado}
                            onChange={(e) => {
                                setEstado(e.target.value);
                                apply(query, e.target.value);
                            }}
                        >
                            {HR_STATES.map((s) => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                        <button
                            className="portal-btn portal-btn-primary"
                            onClick={() => apply()}
                            disabled={busy}
                        >
                            <PortalIcon name="filter" />
                            Filtrar
                        </button>
                    </div>

                    {/* Tabla */}
                    <div className="portal-table-wrap">
                        <table className="portal-table hr-sol-table">
                            <thead>
                                <tr>
                                    <th>Solicitante</th>
                                    <th>Cargo</th>
                                    <th>Papeleta</th>
                                    <th>Motivo</th>
                                    <th>Fecha autorizada</th>
                                    <th>Enviado a RRHH</th>
                                    <th>Hora</th>
                                    <th>Estado</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="portal-table-empty">
                                            <PortalIcon name="users" />
                                            <p>No hay solicitantes para los filtros seleccionados.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item) => {
                                        const { date, time } = formatDateTime(item.enviado_rrhh_at);
                                        const fullName = `${item.solicitante.nombres} ${item.solicitante.apellidos}`;
                                        return (
                                            <tr key={item.id}>
                                                <td className="hr-sol-user-cell">
                                                    <Avatar name={fullName} small />
                                                    <div className="hr-sol-user-info">
                                                        <strong>{fullName}</strong>
                                                        <span>{item.solicitante.dni}</span>
                                                    </div>
                                                </td>
                                                <td className="hr-sol-cargo">
                                                    {item.solicitante.cargo_designado || <span className="portal-muted">—</span>}
                                                </td>
                                                <td>
                                                    <span className="portal-code">{item.codigo}</span>
                                                </td>
                                                <td>{item.motivo_label}</td>
                                                <td>
                                                    {new Date(item.fecha_autorizada).toLocaleDateString("es-PE", {
                                                        day: "2-digit", month: "short", year: "numeric",
                                                    })}
                                                </td>
                                                <td className="hr-sol-date">{date}</td>
                                                <td>
                                                    <span className="hr-sol-time">{time}</span>
                                                </td>
                                                <td>
                                                    <span className={`portal-badge ${STATUS_CLASS[item.estado] ?? ""}`}>
                                                        <span />
                                                        {item.estado_label}
                                                    </span>
                                                </td>
                                                <td>
                                                    <Link
                                                        href={route("papeletas.show", item.codigo)}
                                                        className="portal-row-link"
                                                    >
                                                        Ver detalle
                                                        <PortalIcon name="arrow" />
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {pagination.last_page > 1 && (
                        <PaginationBar
                            page={pagination}
                        />
                    )}
                </section>

            </div>
        </AuthenticatedLayout>
    );
}
