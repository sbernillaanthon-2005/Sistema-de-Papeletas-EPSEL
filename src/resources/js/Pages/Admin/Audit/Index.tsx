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
    user_agent: string | null;
    created_at: string;
    actor: { name: string; dni: string; role: string } | null;
    metadata: Record<string, unknown> | null;
    subject_type: string | null;
    subject_id: string | null;
};
type Props = {
    logs: Pagination<AuditEntry>;
    filters: { q?: string; action?: string; date?: string };
    actions: string[];
    summary: { total: number; today: number; backups: number; backupDownloads: number; backupDeletes: number };
};

const actionLabel = (action: string) => ({
    "session.started": "Inicio de sesión",
    "session.ended": "Cierre de sesión",
    "user.created": "Usuario creado",
    "user.updated": "Usuario actualizado",
    "user.deleted": "Usuario eliminado",
    "backup.downloaded": "Respaldo descargado",
    "backup.deleted": "Respaldo eliminado",
    "exit_slip.reminder_interval_updated": "Recordatorio actualizado",
    "exit_slip.created": "Papeleta creada",
    "exit_slip.updated": "Papeleta actualizada",
    "exit_slip.submitted": "Papeleta enviada",
    "exit_slip.approved": "Papeleta aprobada",
    "exit_slip.rejected": "Papeleta rechazada",
    "exit_slip_format.uploaded": "Formato publicado",
    "exit_slip_format.updated": "Formato actualizado",
    "exit_slip_format.activated": "Formato activado",
    "exit_slip_format.deleted": "Formato eliminado",
    "exit_slip_format.base_removed": "Formato base retirado",
}[action] || action
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase()));

const resourceLabel = (type: string | null) => type?.split("\\").pop() || "Registro del sistema";

const metadataText = (value: unknown) => typeof value === "string" ? value : JSON.stringify(value, null, 2);

export default function Index({ logs, filters, actions, summary }: Props) {
    const [query, setQuery] = useState(filters.q || "");
    const [action, setAction] = useState(filters.action || "");
    const [date, setDate] = useState(filters.date || "");
    const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
    const selectedMetadata = selectedEntry?.metadata || {};
    const previousMetadata = (selectedMetadata.previous || selectedMetadata.before) as unknown;
    const nextMetadata = (selectedMetadata.new || selectedMetadata.after) as unknown;
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
                    <StatCard label="Respaldos auditados" value={summary.backups} hint={`${summary.backupDownloads} descargados · ${summary.backupDeletes} eliminados`} icon="download" tone="amber" />
                </section>
                <section className="portal-card">
                    <div className="portal-card-head">
                        <div><h2>Registro de actividad</h2><p>Los eventos no se pueden modificar desde esta pantalla.</p></div>
                        <span className="portal-badge">{logs.total} eventos</span>
                    </div>
                    <form className="portal-toolbar audit-toolbar" onSubmit={apply}>
                        <div className="portal-search"><PortalIcon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar acción, usuario o DNI…" aria-label="Buscar en auditoría" /></div>
                        <select value={action} onChange={(event) => { const value = event.target.value; setAction(value); router.get(route("admin.audit.index"), { q: query, action: value, date }, { preserveState: true, preserveScroll: true }); }} aria-label="Filtrar por acción"><option value="">Todas las acciones</option>{actions.map((item) => <option key={item} value={item}>{actionLabel(item)}</option>)}</select>
                        <input className="audit-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} aria-label="Filtrar por fecha" />
                        <button className="portal-btn portal-btn-primary"><PortalIcon name="filter" /> Filtrar</button>
                        <button type="button" className="portal-btn portal-btn-light" style={{ visibility: query || action || date ? "visible" : "hidden" }} onClick={() => { setQuery(""); setAction(""); setDate(""); router.get(route("admin.audit.index")); }}>Limpiar</button>
                    </form>
                    <div className="portal-table-wrap">
                        <table className="portal-table audit-table"><thead><tr><th>Fecha y hora</th><th>Actor</th><th>Acción</th><th>Recurso</th><th>IP</th><th>Detalles</th></tr></thead>
                            <tbody>{logs.data.length ? logs.data.map((entry) => <tr key={entry.id}><td><time dateTime={entry.created_at}>{new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Lima" }).format(new Date(entry.created_at))}</time></td><td>{entry.actor ? <><strong>{entry.actor.name}</strong><small className="portal-cell-muted">{entry.actor.role} · DNI {entry.actor.dni}</small></> : "Usuario eliminado"}</td><td><span className="audit-action">{actionLabel(entry.action)}</span></td><td><strong className="audit-resource">{resourceLabel(entry.subject_type)}</strong><small className="portal-cell-muted">{entry.subject_id || "Sin identificador"}</small></td><td className="audit-ip">{entry.ip_address || "—"}</td><td><button type="button" className="audit-detail-btn" onClick={() => setSelectedEntry(entry)}><PortalIcon name="search" /> Inspeccionar</button></td></tr>) : <tr><td colSpan={6}><div className="portal-empty"><PortalIcon name="file" /><p>No hay eventos para estos filtros.</p></div></td></tr>}</tbody>
                        </table>
                    </div>
                    <PaginationBar page={logs} />
                </section>
                {selectedEntry && <div className="audit-detail-overlay" role="presentation" onClick={() => setSelectedEntry(null)}><section className="audit-detail-panel" role="dialog" aria-modal="true" aria-labelledby="audit-detail-title" onClick={(event) => event.stopPropagation()}><div className="audit-detail-head"><div><span>EVENTO #{selectedEntry.id}</span><h2 id="audit-detail-title">{actionLabel(selectedEntry.action)}</h2><div className="audit-detail-meta-line">{selectedEntry.actor?.name || "Usuario eliminado"} · {selectedEntry.actor?.role || "Sin rol"} · {new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Lima" }).format(new Date(selectedEntry.created_at))}</div></div><button type="button" onClick={() => setSelectedEntry(null)} aria-label="Cerrar detalle"><PortalIcon name="close" /></button></div><p className="audit-detail-description">{selectedEntry.description}</p><div className="audit-detail-grid"><div><small>Actor</small><strong>{selectedEntry.actor?.name || "Usuario eliminado"}</strong></div><div><small>Rol</small><strong>{selectedEntry.actor?.role || "Sin rol"}</strong></div><div><small>IP</small><strong>{selectedEntry.ip_address || "—"}</strong></div><div><small>Recurso</small><strong>{resourceLabel(selectedEntry.subject_type)}</strong></div><div><small>Identificador</small><strong>{selectedEntry.subject_id || "—"}</strong></div></div><div className="audit-metadata"><small>{previousMetadata !== undefined || nextMetadata !== undefined ? "Cambios registrados" : "Metadatos registrados"}</small>{previousMetadata !== undefined || nextMetadata !== undefined ? <div className="audit-diff-grid"><div className="audit-diff audit-diff-before"><h3>Valores anteriores</h3><pre>{metadataText(previousMetadata ?? {})}</pre></div><div className="audit-diff audit-diff-after"><h3>Nuevos valores</h3><pre>{metadataText(nextMetadata ?? {})}</pre></div></div> : <pre>{JSON.stringify(selectedEntry.metadata || {}, null, 2)}</pre>}</div></section></div>}
            </div>
        </AuthenticatedLayout>
    );
}
