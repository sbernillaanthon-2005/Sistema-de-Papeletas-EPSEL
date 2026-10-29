import { Link } from "@inertiajs/react";
import { useState, type CSSProperties } from "react";
import PortalIcon, { PortalIconName } from "./PortalIcon";
import { statuses } from "@/types/exit-slip";

export const roleLabels: Record<string, string> = {
    admin: "Administración",
    hr: "Recursos Humanos",
    security: "Control de vigilancia",
    area_head: "Jefe de área",
    practitioner: "Practicante",
    worker: "Trabajador",
};
export function Avatar({
    name,
    photo,
    small = false,
    className = "",
    style,
}: {
    name: string;
    photo?: string | null;
    small?: boolean;
    className?: string;
    style?: CSSProperties;
}) {
    const [failed, setFailed] = useState(false);
    return (
        <span className={`portal-avatar ${small ? "portal-avatar-sm" : ""} ${className}`.trim()} style={style}>
            {photo && !photo.includes("ui-avatars.com") && !failed ? (
                <img src={photo} alt="" onError={() => setFailed(true)} />
            ) : (
                name
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase()
            )}
        </span>
    );
}
export function StatusBadge({
    state,
    label,
}: {
    state: string;
    label?: string;
}) {
    return (
        <span className={`portal-badge status-${state}`}>
            <span />
            {label || statuses[state] || state}
        </span>
    );
}
export function StatCard({
    label,
    value,
    hint,
    icon,
    tone = "teal",
}: {
    label: string;
    value: number;
    hint: string;
    icon: PortalIconName;
    tone?: string;
}) {
    return (
        <article className="portal-stat">
            <div>
                <span className="portal-stat-label">{label}</span>
                <strong>{new Intl.NumberFormat("es-PE").format(value)}</strong>
                <p>{hint}</p>
            </div>
            <span className={`portal-stat-icon tone-${tone}`}>
                <PortalIcon name={icon} />
            </span>
        </article>
    );
}
export function PaginationBar({
    page,
}: {
    page: {
        current_page: number;
        last_page: number;
        total: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
}) {
    return (
        <nav className="portal-pagination" aria-label="Paginación">
            <span>
                {page.total} registros · Página{" "}
                <strong>{page.current_page}</strong> de {page.last_page}
            </span>
            <div>
                {page.prev_page_url ? (
                    <Link
                        className="portal-btn portal-btn-light"
                        href={page.prev_page_url}
                        preserveScroll
                    >
                        Anterior
                    </Link>
                ) : (
                    <button className="portal-btn portal-btn-light" disabled>
                        Anterior
                    </button>
                )}
                {page.next_page_url ? (
                    <Link
                        className="portal-btn portal-btn-light"
                        href={page.next_page_url}
                        preserveScroll
                    >
                        Siguiente
                        <PortalIcon name="chevron" />
                    </Link>
                ) : (
                    <button className="portal-btn portal-btn-light" disabled>
                        Siguiente
                        <PortalIcon name="chevron" />
                    </button>
                )}
            </div>
        </nav>
    );
}
export function formatDate(value?: string | null) {
    if (!value) return "—";
    return new Intl.DateTimeFormat("es-PE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "America/Lima",
    }).format(
        new Date(value.length === 10 ? `${value}T12:00:00-05:00` : value),
    );
}
