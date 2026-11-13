import { useState, useRef, useEffect } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { Avatar } from "@/Components/PortalUI";

gsap.registerPlugin(useGSAP);

export type AuditEntry = {
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
    subject_name: string | null;
};

interface Props {
    entry: AuditEntry;
    onClose: () => void;
    actionLabel: (action: string) => string;
    resourceLabel: (type: string | null) => string;
}

/* ── Mapeo de estados de papeleta ── */
const slipStatusLabels: Record<string, { label: string; tone: "ok" | "warn" | "danger" | "info" }> = {
    draft: { label: "Borrador sin enviar", tone: "info" },
    submitted: { label: "Enviada a jefatura", tone: "warn" },
    approved_by_head: { label: "Aprobada por jefe inmediato", tone: "ok" },
    rejected_by_head: { label: "Rechazada por jefatura", tone: "danger" },
    submitted_to_security: { label: "En control de vigilancia (Garita)", tone: "warn" },
    security_verified: { label: "Verificada en garita", tone: "ok" },
    completed: { label: "Completada / Finalizada", tone: "ok" },
    rejected: { label: "Rechazada", tone: "danger" },
    canceled: { label: "Anulada por usuario", tone: "danger" },
};

/* ── Mapeo de claves técnicas a títulos en español ── */
const fieldLabels: Record<string, string> = {
    codigo: "Código de papeleta",
    estado: "Estado de tramitación",
    solicitante: "Personal solicitante",
    nombres: "Nombres del usuario",
    apellidos: "Apellidos del usuario",
    dni: "Número de documento DNI",
    activo: "Estado de acceso al sistema",
    email: "Correo institucional",
    area_id: "Área asignada (ID)",
    jefe_id: "Jefatura asignada (ID)",
    jefe_responsable_nombre: "Jefe responsable asignado",
    filename: "Archivo de respaldo (.dump)",
    motivo: "Motivo de la papeleta",
    nombre: "Nombre del elemento",
    antes: "Valor anterior",
    despues: "Nuevo valor asignado",
    interval_minutes: "Intervalo de recordatorio (minutos)",
};

/* ── Determinación semántica de colores de acción ── */
function getActionTone(action: string): "green" | "amber" | "red" | "cyan" | "blue" {
    if (action.includes("created") || action.includes("started") || action.includes("activated") || action.includes("approved")) {
        return "green";
    }
    if (action.includes("updated") || action.includes("reminder")) {
        return "amber";
    }
    if (action.includes("deleted") || action.includes("ended") || action.includes("rejected") || action.includes("removed")) {
        return "red";
    }
    if (action.includes("downloaded") || action.includes("uploaded")) {
        return "cyan";
    }
    return "blue";
}

/* ── Parseador de User-Agent a datos comprensibles ── */
function parseUserAgent(ua: string | null) {
    if (!ua) {
        return {
            browser: "No registrado",
            os: "Sistema desconocido",
            device: "Servidor / API",
        };
    }

    let os = "Sistema desconocido";
    if (ua.includes("Windows NT 10.0")) os = "Windows 10 / 11 (64-bit)";
    else if (ua.includes("Windows NT 6.3")) os = "Windows 8.1";
    else if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Macintosh") || ua.includes("Mac OS X")) os = "macOS";
    else if (ua.includes("Android")) os = "Android OS";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "Apple iOS";
    else if (ua.includes("Linux")) os = "GNU / Linux";

    let browser = "Navegador web";
    if (ua.includes("Edg/")) {
        const match = ua.match(/Edg\/([\d.]+)/);
        browser = `Microsoft Edge ${match ? match[1].split(".")[0] : ""}`;
    } else if (ua.includes("Chrome/")) {
        const match = ua.match(/Chrome\/([\d.]+)/);
        browser = `Google Chrome ${match ? match[1].split(".")[0] : ""}`;
    } else if (ua.includes("Firefox/")) {
        const match = ua.match(/Firefox\/([\d.]+)/);
        browser = `Mozilla Firefox ${match ? match[1].split(".")[0] : ""}`;
    } else if (ua.includes("Safari/") && !ua.includes("Chrome/")) {
        browser = "Apple Safari";
    }

    let device = "PC de escritorio / Laptop";
    if (ua.includes("Mobile")) device = "Teléfono inteligente (Móvil)";
    else if (ua.includes("Tablet") || ua.includes("iPad")) device = "Tablet institucional";

    return { browser: browser.trim(), os, device };
}

export default function AuditInspectModal({
    entry,
    onClose,
    actionLabel,
    resourceLabel,
}: Props) {
    const modalRef = useRef<HTMLDivElement>(null);
    const [viewMode, setViewMode] = useState<"visual" | "json">("visual");
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [showUaRaw, setShowUaRaw] = useState(false);

    // Tecla ESC para cerrar
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    // Animación de entrada GSAP
    useGSAP(() => {
        if (modalRef.current) {
            gsap.fromTo(
                modalRef.current,
                { opacity: 0, scale: 0.94, y: 16 },
                { opacity: 1, scale: 1, y: 0, duration: 0.28, ease: "back.out(1.2)" }
            );
        }
    }, []);

    const copyToClipboard = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const tone = getActionTone(entry.action);
    const uaInfo = parseUserAgent(entry.user_agent);

    // Detección de metadatos diferenciales (antes vs después)
    const meta = entry.metadata || {};
    const hasDiff = ("antes" in meta && "despues" in meta) ||
                    ("before" in meta && "after" in meta) ||
                    ("previous" in meta && "new" in meta);

    const beforeVal = meta.antes ?? meta.before ?? meta.previous;
    const afterVal = meta.despues ?? meta.after ?? meta.new;

    // Formateador de fechas
    const formattedDate = new Intl.DateTimeFormat("es-PE", {
        dateStyle: "full",
        timeStyle: "medium",
        timeZone: "America/Lima",
    }).format(new Date(entry.created_at));

    return (
        <div className="audit-v2-overlay" onClick={onClose} role="presentation">
            <div
                ref={modalRef}
                className="audit-v2-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="audit-v2-title"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── Encabezado del Evento ── */}
                <div className="audit-v2-header">
                    <div className="audit-v2-header-left">
                        <div className="audit-v2-badges-row">
                            <span className="audit-v2-id-badge">
                                EVENTO #{entry.id}
                            </span>
                            <span className={`audit-v2-action-pill tone-${tone}`}>
                                <span className="audit-v2-pill-dot" />
                                {actionLabel(entry.action)}
                            </span>
                            <button
                                type="button"
                                onClick={() => copyToClipboard(String(entry.id), "event-id")}
                                className="audit-v2-mini-copy"
                                title="Copiar ID del evento"
                            >
                                {copiedKey === "event-id" ? "¡Copiado!" : "Copiar ID"}
                            </button>
                        </div>

                        <h2 id="audit-v2-title" className="audit-v2-title">
                            {actionLabel(entry.action)}
                        </h2>

                        <div className="audit-v2-timestamp">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <span>{formattedDate}</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="audit-v2-close-btn"
                        aria-label="Cerrar modal"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* ── Resumen de la acción ── */}
                <div className="audit-v2-summary-banner">
                    <div className="audit-v2-summary-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="16" x2="12" y2="12" />
                            <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                    </div>
                    <div className="audit-v2-summary-text">
                        <strong>Descripción del registro:</strong>
                        <p>{entry.description || "Acción registrada en la bitácora central de seguridad de EPSEL."}</p>
                    </div>
                </div>

                {/* ── Grid Principal: Actor, Recurso y Entorno ── */}
                <div className="audit-v2-cards-grid">
                    {/* Tarjeta: Actor responsable */}
                    <div className="audit-v2-card">
                        <div className="audit-v2-card-head">
                            <span className="audit-v2-card-tag">RESPONSABLE</span>
                            <h4>Actor de la acción</h4>
                        </div>
                        <div className="audit-v2-actor-body">
                            {entry.actor ? (
                                <>
                                    <Avatar
                                        name={entry.actor.name}
                                        className="audit-v2-actor-avatar"
                                    />
                                    <div className="audit-v2-actor-info">
                                        <strong className="audit-v2-actor-name">{entry.actor.name}</strong>
                                        <div className="audit-v2-actor-chips">
                                            <span className="audit-v2-chip role">{entry.actor.role}</span>
                                            <span className="audit-v2-chip dni">DNI: {entry.actor.dni}</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="audit-v2-system-actor">
                                    <div className="audit-v2-system-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                                            <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                                            <line x1="6" y1="6" x2="6.01" y2="6" />
                                            <line x1="6" y1="18" x2="6.01" y2="18" />
                                        </svg>
                                    </div>
                                    <div>
                                        <strong>Sistema automatizado / Usuario externo</strong>
                                        <small>Sin actor de usuario asociado</small>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tarjeta: Recurso afectado */}
                    <div className="audit-v2-card">
                        <div className="audit-v2-card-head">
                            <span className="audit-v2-card-tag">OBJETO</span>
                            <h4>Recurso afectado</h4>
                        </div>
                        <div className="audit-v2-resource-body">
                            <div className="audit-v2-resource-row">
                                <span className="audit-v2-lbl">Tipo de recurso:</span>
                                <strong className="audit-v2-val highlight">{resourceLabel(entry.subject_type)}</strong>
                            </div>
                            <div className="audit-v2-resource-row">
                                <span className="audit-v2-lbl">Nombre / Sujeto:</span>
                                <strong className="audit-v2-val">
                                    {entry.subject_name || "Sin nombre específico registrado"}
                                </strong>
                            </div>
                            {entry.subject_id && (
                                <div className="audit-v2-resource-row">
                                    <span className="audit-v2-lbl">Identificador (ID):</span>
                                    <div className="audit-v2-copy-val">
                                        <code>{entry.subject_id}</code>
                                        <button
                                            type="button"
                                            onClick={() => copyToClipboard(entry.subject_id!, "sub-id")}
                                            className="audit-v2-mini-copy"
                                        >
                                            {copiedKey === "sub-id" ? "¡Listo!" : "Copiar"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tarjeta: Conexión y Dispositivo */}
                    <div className="audit-v2-card audit-v2-card--full">
                        <div className="audit-v2-card-head">
                            <span className="audit-v2-card-tag">CONEXIÓN Y EQUIPO</span>
                            <h4>Entorno del cliente</h4>
                        </div>
                        <div className="audit-v2-env-grid">
                            <div className="audit-v2-env-item">
                                <div className="audit-v2-env-icon ip">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="2" y1="12" x2="22" y2="12" />
                                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                    </svg>
                                </div>
                                <div>
                                    <small>Dirección IP</small>
                                    <div className="audit-v2-ip-line">
                                        <strong>{entry.ip_address || "—"}</strong>
                                        {entry.ip_address && (
                                            <button
                                                type="button"
                                                onClick={() => copyToClipboard(entry.ip_address!, "ip")}
                                                className="audit-v2-mini-copy"
                                            >
                                                {copiedKey === "ip" ? "¡Copiada!" : "Copiar IP"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="audit-v2-env-item">
                                <div className="audit-v2-env-icon browser">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <circle cx="12" cy="12" r="4" />
                                        <line x1="21.17" y1="8" x2="12" y2="8" />
                                        <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
                                        <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
                                    </svg>
                                </div>
                                <div>
                                    <small>Navegador detectado</small>
                                    <strong>{uaInfo.browser}</strong>
                                </div>
                            </div>

                            <div className="audit-v2-env-item">
                                <div className="audit-v2-env-icon os">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                                        <line x1="8" y1="21" x2="16" y2="21" />
                                        <line x1="12" y1="17" x2="12" y2="21" />
                                    </svg>
                                </div>
                                <div>
                                    <small>Sistema Operativo y Tipo</small>
                                    <strong>{uaInfo.os} · {uaInfo.device}</strong>
                                </div>
                            </div>
                        </div>

                        {entry.user_agent && (
                            <div className="audit-v2-ua-collapsible">
                                <button
                                    type="button"
                                    onClick={() => setShowUaRaw(!showUaRaw)}
                                    className="audit-v2-ua-toggle"
                                >
                                    <span>{showUaRaw ? "Ocultar" : "Ver"} User-Agent técnico completo</span>
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        style={{ transform: showUaRaw ? "rotate(180deg)" : "none", transition: "transform .2s" }}
                                    >
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </button>
                                {showUaRaw && (
                                    <div className="audit-v2-ua-box">
                                        <code>{entry.user_agent}</code>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Sección de Datos y Metadatos ── */}
                <div className="audit-v2-metadata-section">
                    <div className="audit-v2-metadata-topbar">
                        <div className="audit-v2-meta-title-wrap">
                            <span className="audit-v2-meta-indicator" />
                            <h3>Detalle de la operación</h3>
                        </div>

                        {/* Selector de modo: Visual vs JSON */}
                        <div className="audit-v2-view-toggle">
                            <button
                                type="button"
                                className={`audit-v2-toggle-btn ${viewMode === "visual" ? "is-active" : ""}`}
                                onClick={() => setViewMode("visual")}
                            >
                                Formato explicativo
                            </button>
                            <button
                                type="button"
                                className={`audit-v2-toggle-btn ${viewMode === "json" ? "is-active" : ""}`}
                                onClick={() => setViewMode("json")}
                            >
                                JSON técnico
                            </button>
                        </div>
                    </div>

                    {/* VISTA 1: Formato Explicativo / Visual */}
                    {viewMode === "visual" && (
                        <div className="audit-v2-visual-container">
                            {/* Caso A: Diferencia Antes / Después */}
                            {hasDiff ? (
                                <div className="audit-v2-diff-wrap">
                                    <div className="audit-v2-diff-box before">
                                        <div className="audit-v2-diff-head">
                                            <span className="audit-v2-diff-dot red" />
                                            <strong>VALOR ANTERIOR</strong>
                                        </div>
                                        <div className="audit-v2-diff-content">
                                            {typeof beforeVal === "object" && beforeVal !== null ? (
                                                <pre>{JSON.stringify(beforeVal, null, 2)}</pre>
                                            ) : (
                                                <p className="audit-v2-diff-val before">{String(beforeVal || "Ninguno")}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="audit-v2-diff-arrow">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="5" y1="12" x2="19" y2="12" />
                                            <polyline points="12 5 19 12 12 19" />
                                        </svg>
                                    </div>

                                    <div className="audit-v2-diff-box after">
                                        <div className="audit-v2-diff-head">
                                            <span className="audit-v2-diff-dot green" />
                                            <strong>NUEVO VALOR ASIGNADO</strong>
                                        </div>
                                        <div className="audit-v2-diff-content">
                                            {typeof afterVal === "object" && afterVal !== null ? (
                                                <pre>{JSON.stringify(afterVal, null, 2)}</pre>
                                            ) : (
                                                <p className="audit-v2-diff-val after">{String(afterVal || "Ninguno")}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : entry.metadata && Object.keys(entry.metadata).length > 0 ? (
                                /* Caso B: Diccionario de Atributos Legibles */
                                <div className="audit-v2-fields-grid">
                                    {Object.entries(entry.metadata).map(([key, val]) => {
                                        const label = fieldLabels[key] || key.replace(/_/g, " ").toUpperCase();
                                        
                                        // Renderizado especial si es estado de papeleta
                                        if (key === "estado" && typeof val === "string" && slipStatusLabels[val]) {
                                            const statusObj = slipStatusLabels[val];
                                            return (
                                                <div key={key} className="audit-v2-field-item">
                                                    <span className="audit-v2-field-lbl">{label}</span>
                                                    <span className={`audit-v2-status-chip ${statusObj.tone}`}>
                                                        {statusObj.label}
                                                    </span>
                                                </div>
                                            );
                                        }

                                        // Renderizado especial si es booleano (ej. activo)
                                        if (typeof val === "boolean") {
                                            return (
                                                <div key={key} className="audit-v2-field-item">
                                                    <span className="audit-v2-field-lbl">{label}</span>
                                                    <span className={`audit-v2-status-chip ${val ? "ok" : "danger"}`}>
                                                        {val ? "Habilitado / Activo" : "Deshabilitado / Inactivo"}
                                                    </span>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div key={key} className="audit-v2-field-item">
                                                <span className="audit-v2-field-lbl">{label}</span>
                                                <strong className="audit-v2-field-val">
                                                    {val === null || val === undefined ? "—" : typeof val === "object" ? JSON.stringify(val) : String(val)}
                                                </strong>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                /* Caso C: Evento de sesión u operación sin parámetros adicionales */
                                <div className="audit-v2-no-meta">
                                    <div className="audit-v2-no-meta-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                                            <polyline points="9 12 11 14 15 10" />
                                        </svg>
                                    </div>
                                    <div>
                                        <strong>Operación atómica sin parámetros modificados</strong>
                                        <p>
                                            {entry.action.startsWith("session.")
                                                ? "Este evento confirma el ingreso o egreso seguro a la plataforma validado por el servicio de sesiones de EPSEL."
                                                : "No se requirieron modificaciones adicionales de datos para este evento de auditoría."}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* VISTA 2: JSON Crudo para Auditoría Técnica */}
                    {viewMode === "json" && (
                        <div className="audit-v2-json-container">
                            <div className="audit-v2-json-top">
                                <span>Payload JSON completo registrado:</span>
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(JSON.stringify(entry, null, 2), "json-raw")}
                                    className="audit-v2-mini-copy"
                                >
                                    {copiedKey === "json-raw" ? "¡JSON Copiado!" : "Copiar JSON"}
                                </button>
                            </div>
                            <pre className="audit-v2-json-code">
                                {JSON.stringify(entry.metadata || { action: entry.action, description: entry.description, status: "sin_metadata_adicional" }, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>

                {/* ── Pie de Modal ── */}
                <div className="audit-v2-footer">
                    <div className="audit-v2-footer-note">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        <span>Registro inmutable firmado criptográficamente en la base de datos de EPSEL S.A.</span>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="audit-v2-btn-close"
                    >
                        Cerrar inspección
                    </button>
                </div>
            </div>
        </div>
    );
}
