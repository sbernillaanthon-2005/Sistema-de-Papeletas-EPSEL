import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { PageProps } from "@/types";
import { roleLabels } from "@/Components/PortalUI";

/* ── Types ── */
interface Stats {
    total: number;
    pending: number;
    completed: number;
    rejected: number;
    thisMonth: number;
    trend: number;
    approvalRate: number | null;
}
interface WeekPoint { label: string; value: number; }
interface RecentSlip {
    id: string;
    codigo: string;
    solicitante: string;
    estado: string;
    estado_label: string;
    fecha_autorizada: string;
    motivo_label: string;
}

/* ── SVG Icons ── */
const IconFile = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
    </svg>
);
const IconClock = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
);
const IconCheck = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m5 13 4 4L19 7"/>
    </svg>
);
const IconTrendUp = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
);
const IconTrendDown = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>
    </svg>
);
const IconArrow = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
);
const IconCalendar = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
);
const IconShield = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>
    </svg>
);

/* ── Helpers ── */
const STATUS_COLORS: Record<string, string> = {
    draft:                 "ds-status--draft",
    submitted:             "ds-status--submitted",
    approved_by_area:      "ds-status--approved",
    submitted_to_hr:       "ds-status--hr",
    approved_by_hr:        "ds-status--approved",
    submitted_to_security: "ds-status--security",
    completed:             "ds-status--completed",
    rejected:              "ds-status--rejected",
};

const pendingLabel: Record<string, string> = {
    practitioner: "Borradores sin enviar",
    worker:       "Borradores sin enviar",
    area_head:    "Enviadas a mi jefatura",
    hr:           "Esperan revisión RRHH",
    security:     "Autorizadas por RRHH",
    admin:        "Pendientes en el sistema",
};

/* ── Mini bar chart ── */
function WeekChart({ data }: { data: WeekPoint[] }) {
    const max = Math.max(...data.map((d) => d.value), 1);
    const total = data.reduce((sum, point) => sum + point.value, 0);
    const peak = data.reduce((current, point) => point.value > current.value ? point : current, data[0]);
    return (
        <div className="ds-chart-analytics">
            <div className="ds-chart-summary">
                <div><span>REGISTRADAS</span><strong>{total}</strong><small>en las últimas 4 semanas</small></div>
                <p className={total ? "ds-chart-peak" : "ds-chart-peak is-empty"}>{total ? <>Semana con más actividad: <b>{peak.label}</b> · {peak.value}</> : "Sin actividad registrada"}</p>
            </div>
            <div className="ds-chart" aria-label={`${total} papeletas registradas en las últimas cuatro semanas`}>
                {data.map((d) => (
                    <div key={d.label} className={`ds-chart-col ${d.value === 0 ? "is-empty" : ""}`}>
                        <span className="ds-chart-val">{d.value}</span>
                        <div className="ds-chart-bar-wrap" title={`${d.label}: ${d.value} papeleta${d.value !== 1 ? "s" : ""}`}>
                        <div
                            className="ds-chart-bar"
                            style={{
                                height: d.value ? `${Math.max(Math.round((d.value / max) * 100), 12)}%` : "0%",
                                minHeight: d.value ? "10px" : "0px",
                            }}
                        />
                        </div>
                        <span className="ds-chart-label">{d.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ── Main component ── */
export default function Dashboard({
    auth,
    stats,
    weekly,
    recentSlips,
}: PageProps<{
    stats: Stats;
    weekly: WeekPoint[];
    recentSlips: RecentSlip[];
}>) {
    const user     = auth.user;
    const firstName = user.nombres.split(" ")[0];
    const rolLabel  = roleLabels[user.rol] || user.rol_label;
    const isCreator = ["practitioner", "worker"].includes(user.rol);

    const trendPositive = stats.trend >= 0;

    const greeting = (() => {
        const h = new Date().getHours();
        if (h < 12) return "Buenos días";
        if (h < 19) return "Buenas tardes";
        return "Buenas noches";
    })();

    return (
        <AuthenticatedLayout header={<h1>Mi panel</h1>}>
            <Head title="Panel de control" />
            <div className="portal-stack">

                {/* ── Hero saludo ── */}
                <section className="portal-hero ds-hero">
                    <div className="ds-hero-text">
                        <p className="portal-hero-eyebrow">{rolLabel.toUpperCase()} · EPSEL</p>
                        <h2>{greeting}, {firstName}.</h2>
                        <p>Aquí tienes un resumen de la actividad de tus papeletas.</p>
                    </div>
                    {isCreator && (
                        <Link className="portal-btn portal-btn-white" href={route("exit-slips.create")}>
                            + Nueva papeleta
                        </Link>
                    )}
                </section>

                {/* ── KPI cards ── */}
                <div className="ds-kpi-grid">
                    {/* Total */}
                    <div className="ds-kpi">
                        <div className="ds-kpi-icon ds-kpi-icon--blue">
                            <IconFile />
                        </div>
                        <div className="ds-kpi-body">
                            <span className="ds-kpi-label">Total en tu ámbito</span>
                            <strong className="ds-kpi-value">{stats.total}</strong>
                            <span className="ds-kpi-hint">Todas las papeletas registradas</span>
                        </div>
                    </div>

                    {/* Pendientes */}
                    <div className="ds-kpi">
                        <div className="ds-kpi-icon ds-kpi-icon--amber">
                            <IconClock />
                        </div>
                        <div className="ds-kpi-body">
                            <span className="ds-kpi-label">Pendientes</span>
                            <strong className="ds-kpi-value">{stats.pending}</strong>
                            <span className="ds-kpi-hint">{pendingLabel[user.rol] || "Requieren acción"}</span>
                        </div>
                    </div>

                    {/* Este mes */}
                    <div className="ds-kpi">
                        <div className="ds-kpi-icon ds-kpi-icon--teal">
                            <IconCalendar />
                        </div>
                        <div className="ds-kpi-body">
                            <span className="ds-kpi-label">Este mes</span>
                            <strong className="ds-kpi-value">{stats.thisMonth}</strong>
                            <span className={`ds-kpi-trend ${trendPositive ? "ds-kpi-trend--up" : "ds-kpi-trend--down"}`}>
                                {trendPositive ? <IconTrendUp /> : <IconTrendDown />}
                                {Math.abs(stats.trend)}% vs mes anterior
                            </span>
                        </div>
                    </div>

                    {/* Tasa de aprobación */}
                    {stats.approvalRate !== null ? (
                        <div className="ds-kpi">
                            <div className="ds-kpi-icon ds-kpi-icon--green">
                                <IconShield />
                            </div>
                            <div className="ds-kpi-body">
                                <span className="ds-kpi-label">Tasa de aprobación</span>
                                <strong className="ds-kpi-value">{stats.approvalRate}%</strong>
                                <span className="ds-kpi-hint">{stats.completed} completadas · {stats.rejected} rechazadas</span>
                            </div>
                        </div>
                    ) : (
                        <div className="ds-kpi">
                            <div className="ds-kpi-icon ds-kpi-icon--green">
                                <IconCheck />
                            </div>
                            <div className="ds-kpi-body">
                                <span className="ds-kpi-label">Completadas</span>
                                <strong className="ds-kpi-value">{stats.completed}</strong>
                                <span className="ds-kpi-hint">Salida y retorno registrados</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Fila inferior: gráfico + últimas papeletas ── */}
                <div className="ds-bottom-grid">

                    {/* Mini gráfico de barras semanal */}
                    <div className="portal-card ds-chart-card">
                        <div className="ds-card-header">
                            <h3>Actividad semanal</h3>
                            <p>Papeletas registradas en las últimas 4 semanas</p>
                        </div>
                        <div className="ds-card-body">
                            <WeekChart data={weekly} />
                        </div>
                    </div>

                    {/* Últimas papeletas */}
                    <div className="portal-card ds-recent-card">
                        <div className="ds-card-header">
                            <h3>Últimas papeletas</h3>
                            <Link href={route("exit-slips.index")} className="ds-see-all">
                                Ver bandeja <IconArrow />
                            </Link>
                        </div>
                        <div className="ds-recent-list">
                            {recentSlips.length === 0 ? (
                                <div className="ds-empty">
                                    <IconFile />
                                    <p>No hay papeletas registradas aún.</p>
                                </div>
                            ) : (
                                recentSlips.map((slip) => (
                                    <Link
                                        key={slip.id}
                                        href={route("exit-slips.show", slip.id)}
                                        className="ds-slip-row"
                                    >
                                        <div className="ds-slip-info">
                                            <strong>{slip.solicitante}</strong>
                                            <span>{slip.codigo} · {slip.motivo_label} · {slip.fecha_autorizada}</span>
                                        </div>
                                        <span className={`ds-status-badge ${STATUS_COLORS[slip.estado] ?? ""}`}>
                                            {slip.estado_label}
                                        </span>
                                        <span className="ds-slip-arrow"><IconArrow /></span>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                </div>

            </div>
        </AuthenticatedLayout>
    );
}
