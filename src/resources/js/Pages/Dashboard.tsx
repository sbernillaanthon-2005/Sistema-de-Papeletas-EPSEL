import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { PageProps } from "@/types";
import { roleLabels } from "@/Components/PortalUI";
import { useRef, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import PortalIcon from "@/Components/PortalIcon";

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
interface WeekPoint {
    label: string;
    value: number;
}
interface RecentSlip {
    id: string;
    codigo: string;
    solicitante: string;
    estado: string;
    estado_label: string;
    fecha_autorizada: string;
    motivo_label: string;
}

/* ── Helpers ── */
const STATUS_COLORS: Record<string, string> = {
    draft: "ds-status--draft",
    submitted: "ds-status--submitted",
    approved_by_area: "ds-status--approved",
    submitted_to_hr: "ds-status--hr",
    approved_by_hr: "ds-status--approved",
    submitted_to_security: "ds-status--security",
    completed: "ds-status--completed",
    rejected: "ds-status--rejected",
};

const pendingLabel: Record<string, string> = {
    practitioner: "Borradores sin enviar",
    worker: "Borradores sin enviar",
    area_head: "Enviadas a mi jefatura",
    hr: "Esperan revisión RRHH",
    security: "Autorizadas por RRHH",
    admin: "Pendientes en el sistema",
};

/* ── Modern Bar Chart Component ── */
function WeekChart({ data }: { data: WeekPoint[] }) {
    const total = data.reduce((sum, point) => sum + point.value, 0);
    const maxVal = Math.max(3, ...data.map((point) => point.value));
    const peakPoint = data.reduce(
        (max, p) => (p.value > max.value ? p : max),
        data[0] || { label: "", value: 0 }
    );
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    return (
        <div
            className="ds-barchart-container"
            role="region"
            aria-label="Estadísticas de finalizaciones semanales"
        >
            {/* Header summary strip */}
            <div className="ds-barchart-summary">
                <div className="ds-barchart-kpis">
                    <div className="ds-barchart-stat">
                        <span className="ds-barchart-stat-label">TOTAL FINALIZADAS</span>
                        <div className="ds-barchart-stat-val">
                            <strong>{total}</strong>
                            <small>en 4 semanas</small>
                        </div>
                    </div>
                    <div className="ds-barchart-divider" />
                    <div className="ds-barchart-stat">
                        <span className="ds-barchart-stat-label">PROMEDIO SEMANAL</span>
                        <div className="ds-barchart-stat-val">
                            <strong>{(total / Math.max(1, data.length)).toFixed(1)}</strong>
                            <small>papeletas / sem</small>
                        </div>
                    </div>
                </div>

                {peakPoint && peakPoint.value > 0 ? (
                    <div className="ds-barchart-peak-pill">
                        <span className="ds-barchart-peak-dot" />
                        <span>
                            Semana pico: <strong>{peakPoint.label}</strong> ({peakPoint.value})
                        </span>
                    </div>
                ) : (
                    <div className="ds-barchart-peak-pill is-neutral">
                        <span>Sin finalizaciones recientes</span>
                    </div>
                )}
            </div>

            {/* Visual Bar Canvas */}
            <div className="ds-barchart-canvas">
                {/* Horizontal reference grid lines */}
                <div className="ds-barchart-gridlines" aria-hidden="true">
                    <div className="ds-barchart-gridline" style={{ bottom: "100%" }}>
                        <span>{maxVal}</span>
                    </div>
                    <div className="ds-barchart-gridline" style={{ bottom: "66%" }}>
                        <span>{Math.round((maxVal * 2) / 3)}</span>
                    </div>
                    <div className="ds-barchart-gridline" style={{ bottom: "33%" }}>
                        <span>{Math.round(maxVal / 3)}</span>
                    </div>
                    <div className="ds-barchart-gridline" style={{ bottom: "0%" }}>
                        <span>0</span>
                    </div>
                </div>

                {/* Bars group */}
                <div className="ds-barchart-bars">
                    {data.map((point, index) => {
                        const heightPercent =
                            point.value === 0
                                ? 4
                                : Math.max(10, (point.value / maxVal) * 100);
                        const isHovered = hoveredIndex === index;
                        const isPeak = point.value > 0 && point.value === peakPoint.value;

                        return (
                            <div
                                key={point.label}
                                className={`ds-barchart-col ${
                                    isHovered ? "is-hovered" : ""
                                } ${isPeak ? "is-peak" : ""}`}
                                onMouseEnter={() => setHoveredIndex(index)}
                                onMouseLeave={() => setHoveredIndex(null)}
                            >
                                {/* Floating Value Pill */}
                                <div
                                    className={`ds-barchart-val-pill ${
                                        point.value > 0 ? "has-value" : "is-zero"
                                    }`}
                                >
                                    {point.value}
                                </div>

                                {/* Bar Track & Fill */}
                                <div className="ds-barchart-track">
                                    <div
                                        className={`ds-barchart-bar-fill ${
                                            point.value > 0 ? "is-active" : "is-empty"
                                        }`}
                                        style={{ height: `${heightPercent}%` }}
                                    >
                                        <div className="ds-barchart-bar-gloss" />
                                    </div>
                                </div>

                                {/* X-axis Date Label */}
                                <span
                                    className={`ds-barchart-col-label ${
                                        point.value > 0 ? "is-active" : ""
                                    }`}
                                >
                                    {point.label}
                                </span>

                                {/* Tooltip on Hover */}
                                {isHovered && (
                                    <div className="ds-barchart-tooltip" role="tooltip">
                                        <span className="ds-barchart-tip-week">
                                            Semana del {point.label}
                                        </span>
                                        <strong>
                                            {point.value}{" "}
                                            {point.value === 1
                                                ? "papeleta finalizada"
                                                : "papeletas finalizadas"}
                                        </strong>
                                        {total > 0 && (
                                            <small>
                                                {Math.round((point.value / total) * 100)}% del total mensual
                                            </small>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

/* ── Main Dashboard Component ── */
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
    const user = auth.user;
    const firstName = user.nombres.split(" ")[0];
    const rolLabel = user.rol_label || roleLabels[user.rol] || user.rol;
    const isCreator = ["practitioner", "worker"].includes(user.rol);

    const trendPositive = stats.trend >= 0;
    const dashboardRef = useRef<HTMLDivElement>(null);

    // GSAP animations for entrance and bar chart scale
    useGSAP(
        () => {
            if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

            // Entrance timeline
            const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

            tl.fromTo(
                ".ds-hero, .ds-kpi",
                { opacity: 0, y: 14 },
                { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, clearProps: "all" }
            )
                .fromTo(
                    ".ds-bottom-grid > .portal-card",
                    { opacity: 0, y: 16 },
                    { opacity: 1, y: 0, duration: 0.45, stagger: 0.08, clearProps: "all" },
                    "-=0.2"
                )
                .fromTo(
                    ".ds-barchart-bar-fill",
                    { scaleY: 0 },
                    {
                        scaleY: 1,
                        duration: 0.6,
                        stagger: 0.07,
                        transformOrigin: "bottom",
                        ease: "back.out(1.3)",
                    },
                    "-=0.2"
                );
        },
        { scope: dashboardRef }
    );

    const greeting = (() => {
        const h = new Date().getHours();
        if (h < 12) return "Buenos días";
        if (h < 19) return "Buenas tardes";
        return "Buenas noches";
    })();

    const formattedToday = new Intl.DateTimeFormat("es-PE", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(new Date());

    return (
        <AuthenticatedLayout
            header={
                <div className="ds-page-title">
                    <span>EPSEL · {rolLabel}</span>
                    <h1>Mi panel</h1>
                    <p>Gestiona y realiza el seguimiento de tus papeletas de salida.</p>
                </div>
            }
        >
            <Head title="Panel de control" />
            <div className="portal-stack ds-dashboard" ref={dashboardRef}>
                {/* ── Hero saludo ── */}
                <section className="portal-hero ds-hero">
                    <div className="ds-hero-text">
                        <div className="ds-hero-eyebrow-row">
                            <span className="portal-hero-eyebrow">
                                {rolLabel.toUpperCase()} · EPSEL S.A.
                            </span>
                            <span className="ds-hero-date-pill">
                                {formattedToday}
                            </span>
                        </div>
                        <h2>
                            {greeting}, {firstName}.
                        </h2>
                        <p>
                            Aquí tienes el control consolidado de tus solicitudes, firmas y autorizaciones.
                        </p>
                    </div>

                    <div className="ds-hero-actions">
                        {isCreator && (
                            <Link
                                className="portal-btn portal-btn-white ds-hero-btn"
                                href={route("exit-slips.create")}
                            >
                                <PortalIcon name="plus" />
                                <span>Nueva papeleta</span>
                            </Link>
                        )}
                    </div>
                </section>

                {/* ── KPI cards ── */}
                <div className="ds-kpi-grid">
                    {/* Total */}
                    <div className="ds-kpi">
                        <div className="ds-kpi-icon ds-kpi-icon--blue">
                            <PortalIcon name="file" />
                        </div>
                        <div className="ds-kpi-body">
                            <span className="ds-kpi-label">Total en tu ámbito</span>
                            <strong className="ds-kpi-value">{stats.total}</strong>
                            <span className="ds-kpi-hint">
                                Todas las papeletas registradas
                            </span>
                        </div>
                    </div>

                    {/* Pendientes */}
                    <div className="ds-kpi">
                        <div className="ds-kpi-icon ds-kpi-icon--amber">
                            <PortalIcon name="clock" />
                        </div>
                        <div className="ds-kpi-body">
                            <span className="ds-kpi-label">Pendientes</span>
                            <div className="flex items-center gap-2">
                                <strong className="ds-kpi-value">{stats.pending}</strong>
                                {stats.pending > 0 && (
                                    <span className="ds-kpi-badge-pending">
                                        Requiere acción
                                    </span>
                                )}
                            </div>
                            <span className="ds-kpi-hint">
                                {pendingLabel[user.rol] || "Requieren acción"}
                            </span>
                        </div>
                    </div>

                    {/* Este mes */}
                    <div className="ds-kpi">
                        <div className="ds-kpi-icon ds-kpi-icon--teal">
                            <PortalIcon name="clock" />
                        </div>
                        <div className="ds-kpi-body">
                            <span className="ds-kpi-label">Este mes</span>
                            <strong className="ds-kpi-value">{stats.thisMonth}</strong>
                            <span
                                className={`ds-kpi-trend ${
                                    trendPositive
                                        ? "ds-kpi-trend--up"
                                        : "ds-kpi-trend--down"
                                }`}
                            >
                                <PortalIcon
                                    name="arrow"
                                    className={
                                        trendPositive
                                            ? "-rotate-45"
                                            : "rotate-45"
                                    }
                                />
                                <span>{Math.abs(stats.trend)}% vs mes anterior</span>
                            </span>
                        </div>
                    </div>

                    {/* Tasa de aprobación */}
                    {stats.approvalRate !== null ? (
                        <div className="ds-kpi">
                            <div className="ds-kpi-icon ds-kpi-icon--green">
                                <PortalIcon name="shield" />
                            </div>
                            <div className="ds-kpi-body">
                                <span className="ds-kpi-label">Tasa de aprobación</span>
                                <strong className="ds-kpi-value">
                                    {stats.approvalRate}%
                                </strong>
                                <span className="ds-kpi-hint">
                                    {stats.completed} completadas · {stats.rejected} rechazadas
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="ds-kpi">
                            <div className="ds-kpi-icon ds-kpi-icon--green">
                                <PortalIcon name="check" />
                            </div>
                            <div className="ds-kpi-body">
                                <span className="ds-kpi-label">Completadas</span>
                                <strong className="ds-kpi-value">
                                    {stats.completed}
                                </strong>
                                <span className="ds-kpi-hint">
                                    Salida y retorno registrados
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Fila inferior: Gráfico de barras + Últimas papeletas ── */}
                <div className="ds-bottom-grid">
                    {/* Modern Bar Chart */}
                    <div className="portal-card ds-chart-card">
                        <div className="ds-card-header">
                            <div className="ds-card-title-group">
                                <span className="ds-card-icon-wrap">
                                    <PortalIcon name="grid" />
                                </span>
                                <div>
                                    <h3>Finalizaciones por semana</h3>
                                    <p>Papeletas completadas en las últimas 4 semanas</p>
                                </div>
                            </div>
                        </div>
                        <div className="ds-card-body">
                            <WeekChart data={weekly} />
                        </div>
                    </div>

                    {/* Últimas papeletas */}
                    <div className="portal-card ds-recent-card">
                        <div className="ds-card-header">
                            <div className="ds-card-title-group">
                                <span className="ds-card-icon-wrap">
                                    <PortalIcon name="file" />
                                </span>
                                <div>
                                    <h3>Últimas papeletas</h3>
                                    <p>Registro de las solicitudes más recientes</p>
                                </div>
                            </div>
                            <Link
                                href={route("exit-slips.index")}
                                className="ds-see-all"
                            >
                                <span>Ver bandeja</span>
                                <PortalIcon name="arrow" />
                            </Link>
                        </div>

                        <div className="ds-recent-list">
                            {recentSlips.length === 0 ? (
                                <div className="ds-empty">
                                    <PortalIcon name="file" />
                                    <strong>No hay papeletas registradas</strong>
                                    <p>Tus nuevas solicitudes aparecerán aquí en orden cronológico.</p>
                                </div>
                            ) : (
                                recentSlips.map((slip, index) => {
                                    const initials = slip.solicitante
                                        .split(/\s+/)
                                        .filter(Boolean)
                                        .slice(0, 2)
                                        .map((part) => part[0].toUpperCase())
                                        .join("");

                                    return (
                                        <Link
                                            key={slip.id}
                                            href={route("papeletas.show", slip.codigo)}
                                            className="ds-slip-row"
                                        >
                                            <span
                                                className={`ds-slip-avatar ds-slip-avatar--${
                                                    index % 2 ? "teal" : "blue"
                                                }`}
                                                aria-hidden="true"
                                            >
                                                {initials}
                                            </span>

                                            <div className="ds-slip-info">
                                                <strong>{slip.solicitante}</strong>
                                                <div className="ds-slip-meta-line">
                                                    <span className="ds-slip-code-pill">
                                                        {slip.codigo}
                                                    </span>
                                                    <span>·</span>
                                                    <span>{slip.motivo_label}</span>
                                                    <span>·</span>
                                                    <span>{slip.fecha_autorizada}</span>
                                                </div>
                                            </div>

                                            <span
                                                className={`ds-status-badge ${
                                                    STATUS_COLORS[slip.estado] ?? ""
                                                }`}
                                            >
                                                {slip.estado === "completed" && (
                                                    <PortalIcon name="check" />
                                                )}
                                                <span>{slip.estado_label}</span>
                                            </span>

                                            <span className="ds-slip-arrow">
                                                <PortalIcon name="arrow" />
                                            </span>
                                        </Link>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
