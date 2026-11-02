import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { PageProps } from "@/types";
import { roleLabels } from "@/Components/PortalUI";
import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

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
    const total = data.reduce((sum, point) => sum + point.value, 0);
    const max = Math.max(3, ...data.map((point) => point.value));
    const points = data.map((point, index) => ({ x: 44 + index * 104, y: 148 - (point.value / max) * 108 }));
    const path = points.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ");
    const area = `${path} L ${points[points.length - 1]?.x ?? 44} 148 L 44 148 Z`;
    return (
        <div className="ds-line-chart" role="img" aria-label={`${total} papeletas finalizadas en las últimas cuatro semanas`}>
            <div className="ds-chart-total">Finalizadas: <strong>{total}</strong></div>
            <svg viewBox="0 0 400 190" preserveAspectRatio="none" aria-hidden="true">
                <defs><linearGradient id="ds-week-fill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#1688ee" stopOpacity=".32"/><stop offset="1" stopColor="#1688ee" stopOpacity="0"/></linearGradient></defs>
                {[40, 76, 112, 148].map((y) => <line key={y} x1="44" y1={y} x2="356" y2={y} className="ds-line-grid" />)}
                {[0, 1, 2, 3].map((tick) => <text key={tick} x="28" y={152 - tick * 36} className="ds-line-axis">{tick}</text>)}
                <path d={area} fill="url(#ds-week-fill)" />
                <path className="ds-line-path" d={path} fill="none" stroke="#1279e7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {points.map((point, index) => <g key={`${data[index].label}-${index}`}><circle cx={point.x} cy={point.y} r="4.5" fill="#fff" stroke="#1279e7" strokeWidth="2.5" /><text x={point.x} y="178" textAnchor="middle" className="ds-line-axis">{data[index].label}</text>{data[index].value > 0 && <text x={point.x} y={point.y - 13} textAnchor="middle" className="ds-line-count">{data[index].value}</text>}</g>)}
            </svg>
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
    const rolLabel  = user.rol_label || roleLabels[user.rol];
    const isCreator = ["practitioner", "worker"].includes(user.rol);

    const trendPositive = stats.trend >= 0;
    const dashboardRef = useRef<HTMLDivElement>(null);
    useGSAP(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        gsap.fromTo(".ds-hero, .ds-kpi, .ds-bottom-grid > .portal-card", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .55, stagger: .07, ease: "power2.out", clearProps: "all" });
    }, { scope: dashboardRef });

    const greeting = (() => {
        const h = new Date().getHours();
        if (h < 12) return "Buenos días";
        if (h < 19) return "Buenas tardes";
        return "Buenas noches";
    })();

    return (
        <AuthenticatedLayout header={<div className="ds-page-title"><span>EPSEL · {rolLabel}</span><h1>Mi panel</h1><p>Gestiona y realiza el seguimiento de tus papeletas de salida.</p></div>}>
            <Head title="Panel de control" />
            <div className="portal-stack ds-dashboard" ref={dashboardRef}>

                {/* ── Hero saludo ── */}
                <section className="portal-hero ds-hero">
                    <div className="ds-hero-text">
                        <p className="portal-hero-eyebrow">{rolLabel.toUpperCase()} · EPSEL</p>
                        <h2>{greeting}, {firstName}.</h2>
                        <p>Aquí tienes un resumen de la actividad de tus papeletas.</p>
                    </div>
                    <div className="ds-hero-art" aria-hidden="true"><IconFile /><IconCheck /></div>
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
                            <h3>Finalizaciones por semana</h3>
                            <p>Papeletas finalizadas en las últimas 4 semanas</p>
                        </div>
                        <div className="ds-card-body">
                            <WeekChart data={weekly} />
                        </div>
                    </div>

                    {/* Últimas papeletas */}
                    <div className="portal-card ds-recent-card">
                        <div className="ds-card-header">
                            <div className="ds-recent-heading"><span className="ds-recent-heading-icon"><IconFile /></span><div><h3>Últimas papeletas</h3><p>Registro de las últimas solicitudes</p></div></div>
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
                                recentSlips.map((slip, index) => (
                                    <Link
                                        key={slip.id}
                                        href={route("papeletas.show", slip.codigo)}
                                        className="ds-slip-row"
                                    >
                                        <span className={`ds-slip-avatar ds-slip-avatar--${index % 2 ? "violet" : "blue"}`} aria-hidden="true">{slip.solicitante.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("")}</span>
                                        <div className="ds-slip-info">
                                            <strong>{slip.solicitante}</strong>
                                            <span>{slip.codigo} · {slip.motivo_label} · {slip.fecha_autorizada}</span>
                                        </div>
                                        <span className={`ds-status-badge ${STATUS_COLORS[slip.estado] ?? ""}`}>
                                            {slip.estado === "completed" && <IconCheck />}{slip.estado_label}
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
