import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import PortalIcon from "@/Components/PortalIcon";
import { StatusBadge } from "@/Components/PortalUI";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    pdfUrl: string;
    slipCode: string;
    solicitante?: string;
    fechaAutorizada?: string;
    estado?: string;
    estadoLabel?: string;
}

export default function ExitSlipPdfModal({
    isOpen,
    onClose,
    pdfUrl,
    slipCode,
    solicitante,
    fechaAutorizada,
    estado,
    estadoLabel,
}: Props) {
    const modalRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    // Reset loading state and handle body overflow
    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            setCopied(false);
            const prevOverflow = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = prevOverflow;
            };
        }
    }, [isOpen, pdfUrl]);

    // Keyboard navigation (Esc key)
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    // GSAP entrance animation
    useGSAP(() => {
        if (!isOpen || !modalRef.current) return;
        gsap.fromTo(
            modalRef.current,
            { scale: 0.95, opacity: 0, y: 16 },
            { scale: 1, opacity: 1, y: 0, duration: 0.25, ease: "power2.out" }
        );
    }, [isOpen]);

    const handleCopyCode = () => {
        navigator.clipboard.writeText(slipCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <div
            className="slip-pdf-modal-overlay"
            onClick={onClose}
            role="presentation"
        >
            <div
                ref={modalRef}
                className="slip-pdf-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="slip-pdf-title"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── Encabezado del visor ── */}
                <div className="slip-pdf-header">
                    <div className="slip-pdf-header-left">
                        <div className="slip-pdf-badges-row">
                            <button
                                type="button"
                                className="slip-pdf-code-badge"
                                onClick={handleCopyCode}
                                title="Copiar código de la papeleta"
                            >
                                <PortalIcon name="file" />
                                <strong>{slipCode}</strong>
                                <span className="slip-pdf-copy-hint">
                                    {copied ? "¡Copiado!" : "Copiar"}
                                </span>
                            </button>
                            {estado && (
                                <StatusBadge
                                    state={estado}
                                    label={estadoLabel || estado}
                                />
                            )}
                        </div>

                        <h2 id="slip-pdf-title" className="slip-pdf-title">
                            Vista previa de papeleta de salida
                        </h2>

                        {(solicitante || fechaAutorizada) && (
                            <p className="slip-pdf-subtitle">
                                {solicitante && (
                                    <span>
                                        Solicitante: <strong>{solicitante}</strong>
                                    </span>
                                )}
                                {solicitante && fechaAutorizada && (
                                    <span className="slip-pdf-sep">·</span>
                                )}
                                {fechaAutorizada && (
                                    <span>
                                        Fecha: <strong>{fechaAutorizada}</strong>
                                    </span>
                                )}
                            </p>
                        )}
                    </div>

                    <div className="slip-pdf-header-actions">
                        <a
                            href={pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="portal-btn portal-btn-light slip-pdf-btn-tab"
                            title="Abrir en una nueva pestaña del navegador"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-4 h-4"
                            >
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                            <span>Nueva pestaña</span>
                        </a>

                        <a
                            href={`${pdfUrl}&download=1`}
                            className="portal-btn portal-btn-primary slip-pdf-btn-download"
                            title="Descargar documento PDF oficial"
                        >
                            <PortalIcon name="download" />
                            <span>Descargar PDF</span>
                        </a>

                        <button
                            type="button"
                            onClick={onClose}
                            className="slip-pdf-close-btn"
                            aria-label="Cerrar vista previa"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* ── Cuerpo del visor con iframe y loader ── */}
                <div className="slip-pdf-body">
                    {loading && (
                        <div className="slip-pdf-loader">
                            <div className="slip-pdf-spinner" />
                            <div className="slip-pdf-loader-text">
                                <strong>Cargando documento digital...</strong>
                                <span>Generando vista previa con firmas y sello institucional</span>
                            </div>
                        </div>
                    )}

                    <iframe
                        src={pdfUrl}
                        title={`Vista previa oficial de la papeleta ${slipCode}`}
                        className={`slip-pdf-frame ${loading ? "is-loading" : "is-loaded"}`}
                        onLoad={() => setLoading(false)}
                    />
                </div>

                {/* ── Pie de página con información y cierre ── */}
                <div className="slip-pdf-footer">
                    <div className="slip-pdf-footer-hint">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="16" x2="12" y2="12" />
                            <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                        <span>
                            Puedes imprimir, rotar o ajustar el zoom directamente usando las herramientas del visor PDF.
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="portal-btn portal-btn-light slip-pdf-footer-close"
                    >
                        Cerrar vista previa
                    </button>
                </div>
            </div>
        </div>
    );
}

