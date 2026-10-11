import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PortalIcon from "@/Components/PortalIcon";
import { StatCard } from "@/Components/PortalUI";
import { Head, Link, usePage } from "@inertiajs/react";
import axios from "axios";
import { FormEvent, useState } from "react";

export default function Index() {
    const errors = usePage().props.errors as { backup?: string };
    const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "";
    
    const [downloading, setDownloading] = useState(false);
    const [downloadStep, setDownloadStep] = useState<string>("");
    const [downloadError, setDownloadError] = useState("");
    const [copiedCmd, setCopiedCmd] = useState(false);
    const [downloadSuccess, setDownloadSuccess] = useState(false);

    const restoreCommand = 'pg_restore --clean --if-exists --no-owner --dbname=DESTINO_DB epsel-papeletas.dump';

    const copyToClipboard = () => {
        navigator.clipboard.writeText(restoreCommand);
        setCopiedCmd(true);
        setTimeout(() => setCopiedCmd(false), 2500);
    };

    const download = async (event: FormEvent) => {
        event.preventDefault();
        setDownloading(true);
        setDownloadError("");
        setDownloadSuccess(false);
        setDownloadStep("Iniciando conexión con PostgreSQL...");

        try {
            const stepTimer = setTimeout(() => {
                setDownloadStep("Extrayendo esquema y registros de base de datos...");
            }, 1200);

            const response = await axios.post(route("admin.backups.download"), {}, {
                responseType: "blob",
                headers: { "X-CSRF-TOKEN": csrf },
            });

            clearTimeout(stepTimer);
            setDownloadStep("Finalizando empaquetado y streaming del archivo...");

            const disposition = response.headers["content-disposition"] || "";
            const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] || "epsel-papeletas.dump";
            
            const url = URL.createObjectURL(response.data);
            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);

            setDownloadSuccess(true);
            setTimeout(() => setDownloadSuccess(false), 6000);
        } catch {
            setDownloadError("No se pudo generar el respaldo. Verifica el estado de PostgreSQL en el servidor e inténtalo nuevamente.");
        } finally {
            setDownloading(false);
            setDownloadStep("");
        }
    };

    return (
        <AuthenticatedLayout header={<h1>Respaldos de base de datos</h1>}>
            <Head title="Respaldos del Sistema" />
            
            <div className="portal-stack backup-page-container">
                {/* Header Hero Section */}
                <section className="portal-hero admin-module-hero backup-hero">
                    <div className="backup-hero-content">
                        <div className="backup-hero-badge">
                            <span className="backup-status-dot green-pulse" />
                            <span>SISTEMA OPERATIVO &bull; CONTINUIDAD DE DATOS</span>
                        </div>
                        <h2>Gestión y Resguardo de Base de Datos</h2>
                        <p>
                            Genera una copia binaria completa de PostgreSQL (.dump) en tiempo real.
                            Incluye esquemas, relaciones, usuarios y registros de transacciones con auto-eliminación temporal en servidor.
                        </p>
                    </div>
                    <div className="admin-module-hero-icon backup-hero-icon-wrapper">
                        <PortalIcon name="shield" />
                    </div>
                </section>

                {/* Metrics / System Health Bar */}
                <section className="portal-stats backup-stats-grid" aria-label="Estado operativo de respaldos">
                    <StatCard 
                        label="Motor DB" 
                        value={16} 
                        hint="PostgreSQL (Format custom binary)" 
                        icon="file" 
                        tone="teal" 
                    />
                    <StatCard 
                        label="Descargas activas" 
                        value={1} 
                        hint="Bajo demanda inmediata (Streaming)" 
                        icon="download" 
                        tone="blue" 
                    />
                    <StatCard 
                        label="Auditoría activa" 
                        value={100} 
                        hint="Trazabilidad por usuario e IP (% registrado)" 
                        icon="check" 
                        tone="teal" 
                    />
                </section>

                {/* Main Content Layout */}
                <div className="backup-layout">
                    {/* Primary Backup Action Card */}
                    <section className="portal-card backup-primary-card">
                        <div className="backup-card-header">
                            <div className="backup-icon">
                                <PortalIcon name="shield" />
                            </div>
                            <div>
                                <span className="backup-eyebrow">RESPALDO COMPLETO BAJO DEMANDA</span>
                                <h2>Generar copia de seguridad en tiempo real</h2>
                            </div>
                        </div>

                        <p className="backup-description">
                            Al hacer clic en descargar, el motor ejecutará <code>pg_dump</code> y compilará la información actual de la base de datos de EPSEL Papeletas. El proceso no interrumpe la operación del sistema.
                        </p>

                        <div className="backup-specs-grid">
                            <div className="backup-spec-item">
                                <span className="spec-label">Formato de salida</span>
                                <span className="spec-value">
                                    <PortalIcon name="file" /> Custom Binary (.dump)
                                </span>
                            </div>
                            <div className="backup-spec-item">
                                <span className="spec-label">Contenido exportado</span>
                                <span className="spec-value">
                                    <PortalIcon name="grid" /> Esquema DDL + Registros DML
                                </span>
                            </div>
                            <div className="backup-spec-item">
                                <span className="spec-label">Política de servidor</span>
                                <span className="spec-value">
                                    <PortalIcon name="check" /> Auto-eliminación tras envío
                                </span>
                            </div>
                            <div className="backup-spec-item">
                                <span className="spec-label">Registro de seguridad</span>
                                <span className="spec-value">
                                    <PortalIcon name="users" /> Log de descarga auditado
                                </span>
                            </div>
                        </div>

                        {/* Error Alert */}
                        {(errors.backup || downloadError) && (
                            <div className="backup-alert backup-alert-error" role="alert">
                                <PortalIcon name="alert" />
                                <div>
                                    <strong>Error al procesar el respaldo</strong>
                                    <p>{errors.backup || downloadError}</p>
                                </div>
                                <button 
                                    type="button" 
                                    className="backup-alert-close" 
                                    onClick={() => setDownloadError("")}
                                    aria-label="Cerrar mensaje"
                                >
                                    <PortalIcon name="close" />
                                </button>
                            </div>
                        )}

                        {/* Success Notification */}
                        {downloadSuccess && (
                            <div className="backup-alert backup-alert-success" role="status">
                                <PortalIcon name="check" />
                                <div>
                                    <strong>¡Respaldo generado exitosamente!</strong>
                                    <p>El archivo se ha descargado a tu equipo y la copia temporal fue destruida del servidor.</p>
                                </div>
                            </div>
                        )}

                        {/* Download Form & Action Button */}
                        <form onSubmit={download} className="backup-action-form">
                            {downloading && (
                                <div className="backup-progress-container">
                                    <div className="backup-progress-bar">
                                        <div className="backup-progress-fill" />
                                    </div>
                                    <span className="backup-progress-step">{downloadStep}</span>
                                </div>
                            )}

                            <button 
                                className={`portal-btn portal-btn-primary backup-download-btn ${downloading ? 'is-downloading' : ''}`} 
                                type="submit" 
                                disabled={downloading}
                            >
                                {downloading ? (
                                    <>
                                        <span className="backup-btn-spinner" />
                                        <span>Procesando PostgreSQL...</span>
                                    </>
                                ) : (
                                    <>
                                        <PortalIcon name="download" />
                                        <span>Descargar respaldo de base de datos</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </section>

                    {/* Side Guide & Restore Snippet Panel */}
                    <aside className="backup-side-panel">
                        {/* Restore Helper Box */}
                        <div className="portal-card backup-guide-card">
                            <div className="backup-guide-header">
                                <div className="backup-guide-icon">
                                    <PortalIcon name="file" />
                                </div>
                                <h2>Comando de Restauración</h2>
                            </div>
                            <p className="backup-guide-desc">
                                Para restaurar este archivo en un entorno de pruebas o recuperación, utiliza la utilidad oficial <code>pg_restore</code>:
                            </p>
                            
                            <div className="backup-code-box">
                                <code>{restoreCommand}</code>
                                <button 
                                    type="button" 
                                    className="backup-copy-btn" 
                                    onClick={copyToClipboard}
                                    title="Copiar comando al portapapeles"
                                >
                                    <PortalIcon name={copiedCmd ? "check" : "file"} />
                                    {copiedCmd ? "¡Copiado!" : "Copiar"}
                                </button>
                            </div>
                        </div>

                        {/* Best Practices & Security */}
                        <div className="portal-card backup-security-card">
                            <div className="backup-guide-header">
                                <div className="backup-guide-icon backup-icon-amber">
                                    <PortalIcon name="shield" />
                                </div>
                                <h2>Buenas Prácticas de Seguridad</h2>
                            </div>

                            <ul className="backup-checklist">
                                <li>
                                    <span className="check-bullet"><PortalIcon name="check" /></span>
                                    <div>
                                        <strong>Almacenamiento Cifrado</strong>
                                        <p>Guarda la copia en un disco cifrado o vault corporativo con permisos restringidos.</p>
                                    </div>
                                </li>
                                <li>
                                    <span className="check-bullet"><PortalIcon name="check" /></span>
                                    <div>
                                        <strong>Protección de Datos</strong>
                                        <p>Evita transmitir el archivo por mensajería instantánea o medios de correo no cifrados.</p>
                                    </div>
                                </li>
                                <li>
                                    <span className="check-bullet"><PortalIcon name="check" /></span>
                                    <div>
                                        <strong>Auditoría Transparente</strong>
                                        <p>Esta acción genera un registro inmutable vinculando tu usuario, dirección IP y fecha actual.</p>
                                    </div>
                                </li>
                            </ul>

                            <div className="backup-audit-link-wrap">
                                <Link 
                                    href={route("admin.audit.index", { action: "backup.downloaded" })} 
                                    className="portal-btn portal-btn-light backup-audit-btn"
                                >
                                    <PortalIcon name="clock" />
                                    <span>Ver descargas en Auditoría</span>
                                </Link>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

