import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PortalIcon from "@/Components/PortalIcon";
import Modal from "@/Components/Modal";
import { DialogTitle, Transition } from "@headlessui/react";
import { Head, Link, usePage } from "@inertiajs/react";
import axios from "axios";
import { FormEvent, useState, useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import backupHeroImage from "../../../../images/Banner tecnológico azul con datos y seguridad.png";

gsap.registerPlugin(useGSAP);

type AutomaticBackup = {
    id: number;
    filename: string;
    size_bytes: number;
    created_at: string | null;
};

const backupSize = (bytes: number) => bytes < 1024 * 1024
    ? `${Math.max(1, Math.ceil(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export default function Index({ automaticBackups = [] }: { automaticBackups?: AutomaticBackup[] }) {
    const errors = usePage().props.errors as { backup?: string };
    const containerRef = useRef<HTMLDivElement>(null);

    const [downloading, setDownloading] = useState(false);
    const [downloadStep, setDownloadStep] = useState<string>("");
    const [downloadProgress, setDownloadProgress] = useState<number>(0);
    const [downloadError, setDownloadError] = useState("");
    const [copiedCmd, setCopiedCmd] = useState(false);
    const [copiedFile, setCopiedFile] = useState<number | null>(null);
    const [downloadSuccess, setDownloadSuccess] = useState(false);
    const [deletingBackup, setDeletingBackup] = useState<AutomaticBackup | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [backups, setBackups] = useState<AutomaticBackup[]>(automaticBackups);

    const restoreCommand = 'pg_restore --clean --if-exists --no-owner --dbname=DESTINO_DB epsel-papeletas.dump';

    // GSAP Entrance Animations
    useGSAP(() => {
        if (containerRef.current) {
            const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
            tl.fromTo(".bk-v2-hero", { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.45 })
              .fromTo(".bk-v2-kpi-card", { opacity: 0, y: 16 }, { opacity: 1, y: 0, stagger: 0.08, duration: 0.4 }, "-=0.2")
              .fromTo(".bk-v2-main-grid > *", { opacity: 0, y: 18 }, { opacity: 1, y: 0, stagger: 0.1, duration: 0.45 }, "-=0.25");
        }
    }, []);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(restoreCommand);
        setCopiedCmd(true);
        setTimeout(() => setCopiedCmd(false), 2500);
    };

    const copyFilename = (filename: string, id: number) => {
        navigator.clipboard.writeText(filename);
        setCopiedFile(id);
        setTimeout(() => setCopiedFile(null), 2000);
    };

    const download = async (event: FormEvent) => {
        event.preventDefault();
        setDownloading(true);
        setDownloadError("");
        setDownloadSuccess(false);
        setDownloadProgress(20);
        setDownloadStep("1/3 Conectando con el motor PostgreSQL...");

        let timer1: NodeJS.Timeout;
        let timer2: NodeJS.Timeout;

        try {
            timer1 = setTimeout(() => {
                setDownloadProgress(55);
                setDownloadStep("2/3 Extrayendo esquema DDL y registros transaccionales...");
            }, 1000);

            timer2 = setTimeout(() => {
                setDownloadProgress(85);
                setDownloadStep("3/3 Empaquetando copia binaria (.dump) y transmitiendo...");
            }, 2200);

            const response = await axios.post(route("admin.backups.download"), {}, {
                responseType: "blob",
                withXSRFToken: true,
            });

            clearTimeout(timer1);
            clearTimeout(timer2);
            setDownloadProgress(100);
            setDownloadStep("¡Respaldo compilado exitosamente!");

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
            setTimeout(() => setDownloadSuccess(false), 7000);
        } catch {
            setDownloadError("No se pudo generar el respaldo. Verifica el estado del contenedor de base de datos e inténtalo nuevamente.");
        } finally {
            setDownloading(false);
            setDownloadStep("");
            setDownloadProgress(0);
        }
    };

    const confirmDeleteAction = async () => {
        if (!deletingBackup) return;

        setIsDeleting(true);
        setDeleteError("");

        try {
            await axios.delete(route("admin.backups.automatic.destroy", deletingBackup.id), {
                withXSRFToken: true,
            });
            setBackups((prev) => prev.filter((b) => b.id !== deletingBackup.id));
            setDeletingBackup(null);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 419) {
                setDeleteError("La sesión caducó. Recarga la página y vuelve a intentarlo.");
                return;
            }
            if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") {
                setDeleteError(error.response.data.message);
                return;
            }
            setDeleteError(`No se pudo eliminar el respaldo "${deletingBackup.filename}".`);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <AuthenticatedLayout header={<h1>Respaldos de base de datos</h1>}>
            <Head title="Respaldos del Sistema · EPSEL" />

            <div ref={containerRef} className="portal-stack bk-v2-container">
                {/* ── Hero Banner Ejecutivo con fondo oficial EPSEL ── */}
                <section className="portal-hero admin-module-hero backup-hero bk-v2-hero">
                    <img
                        src={backupHeroImage}
                        alt="Gestión y Resguardo de Base de Datos EPSEL"
                        className="bk-v2-hero-bg-img"
                    />
                    <div className="bk-v2-hero-gradient-overlay" />
                    
                    <div className="bk-v2-hero-content">
                        <div className="bk-v2-hero-header-row">
                            <div className="bk-v2-status-pill">
                                <span className="bk-v2-pulse-dot" />
                                <span>SISTEMA OPERATIVO &bull; CONTINUIDAD DE DATOS</span>
                            </div>
                            <div className="bk-v2-server-chip">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <ellipse cx="12" cy="5" rx="9" ry="3" />
                                    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                                </svg>
                                <span>PostgreSQL 16 &bull; Online</span>
                            </div>
                        </div>

                        <h2 className="bk-v2-hero-title">Gestión y Resguardo de Base de Datos</h2>
                        <p className="bk-v2-hero-desc">
                            Genera copias binarias completas de PostgreSQL (.dump) en tiempo real con transacciones ACID íntegras.
                            Incluye esquemas DDL, secuencias, usuarios y registros históricos de papeletas con auto-eliminación temporal en servidor.
                        </p>

                        <div className="bk-v2-hero-meta-chips">
                            <span className="bk-v2-chip">
                                <strong>Compresión:</strong> pg_dump custom (-Fc)
                            </span>
                            <span className="bk-v2-chip">
                                <strong>Codificación:</strong> UTF-8 (es_PE)
                            </span>
                            <span className="bk-v2-chip">
                                <strong>Seguridad:</strong> Streaming cifrado
                            </span>
                        </div>
                    </div>
                </section>

                {/* ── KPIs Operativos y Salud del Sistema ── */}
                <section className="bk-v2-kpi-grid" aria-label="Indicadores operativos de base de datos">
                    <div className="bk-v2-kpi-card tone-cyan">
                        <div className="bk-v2-kpi-header">
                            <span className="bk-v2-kpi-label">MOTOR DE BASE DE DATOS</span>
                            <div className="bk-v2-kpi-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <ellipse cx="12" cy="5" rx="9" ry="3" />
                                    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                                </svg>
                            </div>
                        </div>
                        <div className="bk-v2-kpi-value-wrap">
                            <strong className="bk-v2-kpi-value">PostgreSQL 16</strong>
                            <span className="bk-v2-kpi-badge ok">Activo &bull; Puerto 5432</span>
                        </div>
                        <p className="bk-v2-kpi-hint">Formato binario optimizado con compresión gzip interna</p>
                    </div>

                    <div className="bk-v2-kpi-card tone-blue">
                        <div className="bk-v2-kpi-header">
                            <span className="bk-v2-kpi-label">DESCARGAS EN VIVO</span>
                            <div className="bk-v2-kpi-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                            </div>
                        </div>
                        <div className="bk-v2-kpi-value-wrap">
                            <strong className="bk-v2-kpi-value">Streaming 1 a 1</strong>
                            <span className="bk-v2-kpi-badge info">Bajo demanda</span>
                        </div>
                        <p className="bk-v2-kpi-hint">Transmisión directa por túnel HTTP seguro sin guardar copia permanente</p>
                    </div>

                    <div className="bk-v2-kpi-card tone-green">
                        <div className="bk-v2-kpi-header">
                            <span className="bk-v2-kpi-label">TRAZABILIDAD Y AUDITORÍA</span>
                            <div className="bk-v2-kpi-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                                    <polyline points="9 12 11 14 15 10" />
                                </svg>
                            </div>
                        </div>
                        <div className="bk-v2-kpi-value-wrap">
                            <strong className="bk-v2-kpi-value">100% Auditado</strong>
                            <span className="bk-v2-kpi-badge ok">Log inmutable</span>
                        </div>
                        <p className="bk-v2-kpi-hint">Cada extracción registra la IP, usuario, fecha y bytes emitidos</p>
                    </div>
                </section>

                {/* ── Grid Principal de Operación y DevOps ── */}
                <div className="bk-v2-main-grid">
                    {/* Tarjeta de Acción Principal: Generar Respaldo */}
                    <section className="portal-card bk-v2-card bk-v2-primary-card">
                        <div className="bk-v2-card-head">
                            <div className="bk-v2-card-icon tone-cyan">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                                    <polyline points="9 12 11 14 15 10" />
                                </svg>
                            </div>
                            <div>
                                <span className="bk-v2-eyebrow">RESPALDO COMPLETO BAJO DEMANDA</span>
                                <h2 className="bk-v2-card-title">Generar copia de seguridad en tiempo real</h2>
                            </div>
                        </div>

                        <p className="bk-v2-card-desc">
                            Al hacer clic en descargar, el motor ejecutará <code>pg_dump</code> y compilará la base de datos de EPSEL Papeletas en caliente. El proceso no interrumpe el uso regular de los usuarios.
                        </p>

                        {/* 4 Tarjetas de Especificaciones Técnicas */}
                        <div className="bk-v2-specs-grid">
                            <div className="bk-v2-spec-box">
                                <div className="bk-v2-spec-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                    </svg>
                                </div>
                                <div className="bk-v2-spec-info">
                                    <span className="bk-v2-spec-lbl">Formato de salida</span>
                                    <strong className="bk-v2-spec-val">Custom Binary (.dump)</strong>
                                </div>
                            </div>

                            <div className="bk-v2-spec-box">
                                <div className="bk-v2-spec-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="7" height="7" />
                                        <rect x="14" y="3" width="7" height="7" />
                                        <rect x="14" y="14" width="7" height="7" />
                                        <rect x="3" y="14" width="7" height="7" />
                                    </svg>
                                </div>
                                <div className="bk-v2-spec-info">
                                    <span className="bk-v2-spec-lbl">Contenido exportado</span>
                                    <strong className="bk-v2-spec-val">Esquema DDL + Datos DML</strong>
                                </div>
                            </div>

                            <div className="bk-v2-spec-box">
                                <div className="bk-v2-spec-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="3" />
                                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                    </svg>
                                </div>
                                <div className="bk-v2-spec-info">
                                    <span className="bk-v2-spec-lbl">Política del servidor</span>
                                    <strong className="bk-v2-spec-val">Auto-eliminación tras envío</strong>
                                </div>
                            </div>

                            <div className="bk-v2-spec-box">
                                <div className="bk-v2-spec-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                </div>
                                <div className="bk-v2-spec-info">
                                    <span className="bk-v2-spec-lbl">Registro de seguridad</span>
                                    <strong className="bk-v2-spec-val">Log de descarga auditado</strong>
                                </div>
                            </div>
                        </div>

                        {/* Alerta de Error */}
                        {(errors.backup || downloadError) && (
                            <div className="bk-v2-alert bk-v2-alert--error" role="alert">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                <div className="bk-v2-alert-content">
                                    <strong>Error al compilar el respaldo</strong>
                                    <p>{errors.backup || downloadError}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setDownloadError("")}
                                    className="bk-v2-alert-close"
                                    aria-label="Cerrar alerta"
                                >
                                    &times;
                                </button>
                            </div>
                        )}

                        {/* Alerta de Éxito */}
                        {downloadSuccess && (
                            <div className="bk-v2-alert bk-v2-alert--success" role="status">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <div className="bk-v2-alert-content">
                                    <strong>¡Respaldo compilado y transmitido con éxito!</strong>
                                    <p>El archivo se ha descargado a tu equipo y la copia temporal fue destruida del contenedor.</p>
                                </div>
                            </div>
                        )}

                        {/* Formulario y Botón de Descarga con Barra de Progreso */}
                        <form onSubmit={download} className="bk-v2-action-form">
                            {downloading && (
                                <div className="bk-v2-progress-box">
                                    <div className="bk-v2-progress-head">
                                        <span className="bk-v2-progress-step">{downloadStep}</span>
                                        <span className="bk-v2-progress-pct">{downloadProgress}%</span>
                                    </div>
                                    <div className="bk-v2-progress-track">
                                        <div
                                            className="bk-v2-progress-bar"
                                            style={{ width: `${downloadProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={downloading}
                                className={`bk-v2-download-btn ${downloading ? "is-active" : ""}`}
                            >
                                <div className="bk-v2-btn-content">
                                    {downloading ? (
                                        <>
                                            <span className="bk-v2-spinner" />
                                            <span>Compilando PostgreSQL en caliente...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="7 10 12 15 17 10" />
                                                <line x1="12" y1="15" x2="12" y2="3" />
                                            </svg>
                                            <span>Descargar copia de seguridad inmediata (.dump)</span>
                                        </>
                                    )}
                                </div>
                                <span className="bk-v2-btn-glow" />
                            </button>
                        </form>
                    </section>

                    {/* Barra Lateral: Terminal DevOps y Buenas Prácticas */}
                    <aside className="bk-v2-side-col">
                        {/* DevOps Terminal Box */}
                        <div className="portal-card bk-v2-card bk-v2-terminal-card">
                            <div className="bk-v2-terminal-header">
                                <div className="bk-v2-window-dots">
                                    <span className="dot red" />
                                    <span className="dot yellow" />
                                    <span className="dot green" />
                                </div>
                                <span className="bk-v2-terminal-title">bash &bull; pg_restore utility</span>
                            </div>

                            <p className="bk-v2-terminal-desc">
                                Para restaurar este archivo en un entorno de pruebas o contingencia, ejecuta:
                            </p>

                            <div className="bk-v2-code-window">
                                <div className="bk-v2-code-line">
                                    <span className="cmd-prompt">$</span>
                                    <span className="cmd-name">pg_restore</span>
                                    <span className="cmd-flag">--clean</span>
                                    <span className="cmd-flag">--if-exists</span>
                                    <span className="cmd-flag">--no-owner</span>
                                    <span className="cmd-db">--dbname=DESTINO_DB</span>
                                    <span className="cmd-file">epsel-papeletas.dump</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={copyToClipboard}
                                    className="bk-v2-code-copy-btn"
                                    title="Copiar comando al portapapeles"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                    </svg>
                                    <span>{copiedCmd ? "¡Copiado!" : "Copiar"}</span>
                                </button>
                            </div>

                            <div className="bk-v2-flags-explanation">
                                <span className="bk-v2-flag-pill"><code>--clean</code> Limpia tablas antes</span>
                                <span className="bk-v2-flag-pill"><code>--no-owner</code> Omite propietarios</span>
                                <span className="bk-v2-flag-pill"><code>--if-exists</code> Sin errores si faltan</span>
                            </div>
                        </div>

                        {/* Tarjeta de Buenas Prácticas */}
                        <div className="portal-card bk-v2-card bk-v2-security-card">
                            <div className="bk-v2-card-head">
                                <div className="bk-v2-card-icon tone-amber">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                                    </svg>
                                </div>
                                <h3 className="bk-v2-card-title sm">Buenas Prácticas de Resguardo</h3>
                            </div>

                            <ul className="bk-v2-security-list">
                                <li>
                                    <span className="bk-v2-check-bullet">✓</span>
                                    <div>
                                        <strong>Almacenamiento Cifrado</strong>
                                        <p>Guarda la copia en un disco cifrado o vault corporativo con permisos restringidos.</p>
                                    </div>
                                </li>
                                <li>
                                    <span className="bk-v2-check-bullet">✓</span>
                                    <div>
                                        <strong>Protección de Datos</strong>
                                        <p>Evita transmitir el archivo por mensajería o canales no cifrados.</p>
                                    </div>
                                </li>
                                <li>
                                    <span className="bk-v2-check-bullet">✓</span>
                                    <div>
                                        <strong>Auditoría Transparente</strong>
                                        <p>Cada descarga se asocia con tu cuenta, dirección IP y sello de tiempo.</p>
                                    </div>
                                </li>
                            </ul>

                            <Link
                                href={route("admin.audit.index", { action: "backup.downloaded" })}
                                className="bk-v2-audit-link"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                                <span>Ver descargas registradas en Auditoría</span>
                                <span className="arrow">&rarr;</span>
                            </Link>
                        </div>
                    </aside>
                </div>

                {/* ── Historial de Respaldos Programados ── */}
                <section className="portal-card bk-v2-card bk-v2-auto-section">
                    <div className="bk-v2-auto-header">
                        <div className="bk-v2-auto-title-wrap">
                            <div className="bk-v2-card-icon tone-teal">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                            </div>
                            <div>
                                <span className="bk-v2-eyebrow">CRON PROGRAMADO &bull; CADA 12 HORAS</span>
                                <h2 className="bk-v2-card-title">Historial de copias automáticas</h2>
                            </div>
                        </div>

                        <div className="bk-v2-schedule-badge">
                            <span className="bk-v2-pulse-dot green" />
                            <span>00:00 y 12:00 h &bull; Retención 30 días</span>
                        </div>
                    </div>

                    <p className="bk-v2-card-desc">
                        Copias persistidas de forma segura en el volumen privado del servidor. Se conservan las versiones más recientes para recuperación ante desastres.
                    </p>

                    {deleteError && (
                        <div className="bk-v2-alert bk-v2-alert--error mt-3" role="alert">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <div className="bk-v2-alert-content">
                                <strong>Error al eliminar el archivo</strong>
                                <p>{deleteError}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDeleteError("")}
                                className="bk-v2-alert-close"
                            >
                                &times;
                            </button>
                        </div>
                    )}

                    {backups.length ? (
                        <div className="bk-v2-table-wrapper">
                            <div className="bk-v2-files-list">
                                {backups.map((backup) => (
                                    <article key={backup.id} className="bk-v2-file-row">
                                        <div className="bk-v2-file-left">
                                            <div className="bk-v2-file-icon">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                    <polyline points="14 2 14 8 20 8" />
                                                </svg>
                                                <span className="bk-v2-file-ext">DUMP</span>
                                            </div>

                                            <div className="bk-v2-file-meta">
                                                <div className="bk-v2-filename-row">
                                                    <strong className="bk-v2-filename">{backup.filename}</strong>
                                                    <button
                                                        type="button"
                                                        onClick={() => copyFilename(backup.filename, backup.id)}
                                                        className="bk-v2-copy-chip"
                                                        title="Copiar nombre de archivo"
                                                    >
                                                        {copiedFile === backup.id ? "¡Copiado!" : "Copiar"}
                                                    </button>
                                                </div>
                                                <div className="bk-v2-file-details">
                                                    <span className="bk-v2-file-date">
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                                            <circle cx="12" cy="12" r="10" />
                                                            <polyline points="12 6 12 12 16 14" />
                                                        </svg>
                                                        {backup.created_at
                                                            ? new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Lima" }).format(new Date(backup.created_at))
                                                            : "Fecha no disponible"}
                                                    </span>
                                                    <span className="bk-v2-size-pill">
                                                        {backupSize(backup.size_bytes)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bk-v2-file-actions">
                                            <a
                                                className="bk-v2-btn-download"
                                                href={route("admin.backups.automatic.download", backup.id)}
                                                title="Descargar este archivo dump"
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                    <polyline points="7 10 12 15 17 10" />
                                                    <line x1="12" y1="15" x2="12" y2="3" />
                                                </svg>
                                                <span>Descargar</span>
                                            </a>

                                            <button
                                                type="button"
                                                className="bk-v2-btn-delete"
                                                onClick={() => setDeletingBackup(backup)}
                                                disabled={isDeleting}
                                                aria-label={`Eliminar respaldo ${backup.filename}`}
                                                title="Eliminar este archivo de respaldo"
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                </svg>
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="bk-v2-empty-state">
                            <div className="bk-v2-empty-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                            </div>
                            <div className="bk-v2-empty-text">
                                <strong>Aún no se ha generado un respaldo automático</strong>
                                <p>La primera copia programada se compilará en la siguiente ventana horaria (00:00 o 12:00 horas).</p>
                            </div>
                        </div>
                    )}
                </section>
            </div>

            {/* ── Modal de Confirmación para Eliminar Respaldo ── */}
            <Modal
                show={Boolean(deletingBackup)}
                onClose={() => !isDeleting && setDeletingBackup(null)}
                maxWidth="md"
            >
                <div className="bk-v2-modal-card">
                    <div className="bk-v2-modal-icon danger">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    </div>

                    <DialogTitle className="bk-v2-modal-title">
                        ¿Eliminar archivo de respaldo?
                    </DialogTitle>

                    <p className="bk-v2-modal-desc">
                        Estás a punto de eliminar permanentemente la copia:
                        <br />
                        <code className="bk-v2-modal-code">{deletingBackup?.filename}</code>
                        <br />
                        Esta acción no se puede deshacer y el archivo se destruirá del disco del servidor.
                    </p>

                    <div className="bk-v2-modal-actions">
                        <button
                            type="button"
                            className="bk-v2-modal-btn cancel"
                            disabled={isDeleting}
                            onClick={() => setDeletingBackup(null)}
                        >
                            Cancelar
                        </button>

                        <button
                            type="button"
                            className="bk-v2-modal-btn delete"
                            disabled={isDeleting}
                            onClick={confirmDeleteAction}
                        >
                            {isDeleting ? "Eliminando..." : "Sí, eliminar respaldo"}
                        </button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
