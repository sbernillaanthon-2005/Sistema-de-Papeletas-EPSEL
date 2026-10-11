import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PortalIcon from "@/Components/PortalIcon";
import { PaginationBar, StatCard } from "@/Components/PortalUI";
import { Head, router } from "@inertiajs/react";
import { FormEvent, useState } from "react";
import { Pagination } from "@/types/exit-slip";

type AuditEntry = {
    id: number;
    action: string;
    description: string;
    ip_address: string | null;
    created_at: string;
    actor: { name: string; dni: string } | null;
};
type Props = {
    logs: Pagination<AuditEntry>;
    filters: { q?: string; action?: string; date?: string };
    actions: string[];
    summary: { total: number; today: number; backups: number };
};

const actionLabel = (action: string) => ({
    "session.started": "Inicio de sesión",
    "session.ended": "Cierre de sesión",
    "user.created": "Usuario creado",
    "user.updated": "Usuario actualizado",
    "user.deleted": "Usuario eliminado",
    "backup.downloaded": "Respaldo descargado",
}[action] || action);

export default function Index({ logs, filters, actions, summary }: Props) {
    const [query, setQuery] = useState(filters.q || "");
    const [action, setAction] = useState(filters.action || "");
    const [date, setDate] = useState(filters.date || "");
    const apply = (event: FormEvent) => {
        event.preventDefault();
        router.get(route("admin.audit.index"), { q: query, action, date }, { preserveState: true, preserveScroll: true });
    };

    return (
        <AuthenticatedLayout header={<h1>Auditoría del sistema</h1>}>
            <Head title="Auditoría" />
            <div className="portal-stack">
                <section className="portal-hero admin-module-hero">
                    <div>
                        <p className="portal-hero-eyebrow">TRAZABILIDAD OPERATIVA</p>
                        <h2>Todo cambio deja evidencia.</h2>
                        <p>Consulta accesos, administración de cuentas y descargas de respaldo desde un registro central.</p>
                    </div>
                    <span className="admin-module-hero-icon"><PortalIcon name="shield" /></span>
                </section>
                <section className="portal-stats" aria-label="Resumen de auditoría">
                    <StatCard label="Eventos registrados" value={summary.total} hint="Historial central disponible" icon="file" tone="blue" />
                    <StatCard label="Actividad hoy" value={summary.today} hint="Eventos de la fecha actual" icon="clock" tone="teal" />
                    <StatCard label="Respaldos descargados" value={summary.backups} hint="Acciones auditadas de respaldo" icon="download" tone="amber" />
                </section>
                <section className="portal-card">
                    <div className="portal-card-head">
                        <div><h2>Registro de actividad</h2><p>Los eventos no se pueden modificar desde esta pantalla.</p></div>
                        <span className="portal-badge">{logs.total} eventos</span>
                    </div>
                    <form className="portal-toolbar" onSubmit={apply}>
                        <div className="portal-search"><PortalIcon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar acción, usuario o DNI…" aria-label="Buscar en auditoría" /></div>
                        <select value={action} onChange={(event) => setAction(event.target.value)} aria-label="Filtrar por acción"><option value="">Todas las acciones</option>{actions.map((item) => <option key={item} value={item}>{actionLabel(item)}</option>)}</select>
                        <input className="audit-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} aria-label="Filtrar por fecha" />
                        <button className="portal-btn portal-btn-primary"><PortalIcon name="filter" /> Filtrar</button>
                        {(query || action || date) && <button type="button" className="portal-btn portal-btn-light" onClick={() => { setQuery(""); setAction(""); setDate(""); router.get(route("admin.audit.index")); }}>Limpiar</button>}
                    </form>
                    <div className="portal-table-wrap">
                        <table className="portal-table audit-table"><thead><tr><th>Fecha y hora</th><th>Actor</th><th>Acción</th><th>Detalle</th><th>IP</th></tr></thead>
                            <tbody>{logs.data.length ? logs.data.map((entry) => <tr key={entry.id}><td><time dateTime={entry.created_at}>{new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Lima" }).format(new Date(entry.created_at))}</time></td><td>{entry.actor ? <><strong>{entry.actor.name}</strong><small className="portal-cell-muted">DNI {entry.actor.dni}</small></> : "Usuario eliminado"}</td><td><span className="audit-action">{actionLabel(entry.action)}</span></td><td>{entry.description}</td><td className="audit-ip">{entry.ip_address || "—"}</td></tr>) : <tr><td colSpan={5}><div className="portal-empty"><PortalIcon name="file" /><p>No hay eventos para estos filtros.</p></div></td></tr>}</tbody>
                        </table>
                    </div>
                    <PaginationBar page={logs} />
                </section>
            </div>
        </AuthenticatedLayout>
    );
}
