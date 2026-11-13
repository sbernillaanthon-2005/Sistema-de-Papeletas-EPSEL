import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, Link } from "@inertiajs/react";
import { PageProps } from "@/types";
import UpdateSignatureForm from "@/Pages/Profile/Partials/UpdateSignatureForm";
import { useState, useRef, useEffect } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import PortalIcon from "@/Components/PortalIcon";

gsap.registerPlugin(useGSAP);

interface SlipForm {
    id?: string;
    codigo?: string;
    solicitante?: string;
    estado?: string;
    estado_label?: string;
    tipo_plantilla: string;
    fecha_emision: string;
    designado: string;
    motivo_salida: string;
    motivo_detalle: string;
    fecha_autorizada: string;
    hora_desde?: string;
    hora_hasta?: string;
}

const MOTIVOS = [
    {
        value: "personal",
        label: "Asuntos personales",
        desc: "Diligencias o trámites particulares justificables",
        icon: "user" as const,
    },
    {
        value: "essalud",
        label: "Salud / EsSalud",
        desc: "Atención médica, citas o emergencias de salud",
        icon: "shield" as const,
    },
    {
        value: "commission",
        label: "Comisión de servicio",
        desc: "Gestiones institucionales o trabajo en campo",
        icon: "file" as const,
    },
    {
        value: "other",
        label: "Otro motivo",
        desc: "Circunstancias especiales debidamente justificadas",
        icon: "settings" as const,
    },
];

const TEMPLATES = [
    {
        value: "practitioner",
        title: "Practicante",
        badge: "Modalidad Formativa",
        desc: "Prácticas pre-profesionales o profesionales según convenio vigente.",
        icon: "user" as const,
    },
    {
        value: "worker",
        title: "Personal Nombrado / Contratado",
        badge: "Régimen Oficial",
        desc: "Personal bajo régimen laboral D.L. 728 / 276 / CAS institucional.",
        icon: "shield" as const,
    },
];

function calculateDuration(desde?: string, hasta?: string): string | null {
    if (!desde || !hasta) return null;
    const [h1, m1] = desde.split(":").map(Number);
    const [h2, m2] = hasta.split(":").map(Number);
    if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return null;
    const diffMin = h2 * 60 + m2 - (h1 * 60 + m1);
    if (diffMin <= 0) return null;
    const hours = Math.floor(diffMin / 60);
    const minutes = diffMin % 60;
    if (hours === 0) return `${minutes} min`;
    if (minutes === 0) return `${hours} h`;
    return `${hours} h ${minutes} min`;
}

function formatDateHuman(dateStr?: string): string {
    if (!dateStr) return "Sin fecha";
    try {
        const [year, month, day] = dateStr.split("-").map(Number);
        const d = new Date(year, month - 1, day);
        return new Intl.DateTimeFormat("es-PE", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
        }).format(d);
    } catch {
        return dateStr;
    }
}

export default function Form({
    auth,
    exitSlip,
    formatAvailable = true,
}: PageProps<{ exitSlip?: SlipForm; formatAvailable?: boolean }>) {
    const today = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Lima",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());

    const isEdit = !!exitSlip?.id;
    const isAdminEdit = isEdit && auth.user.rol === "admin";

    const form = useForm({
        tipo_plantilla:
            exitSlip?.tipo_plantilla ||
            (auth.user.rol === "practitioner" ? "practitioner" : "worker"),
        fecha_emision: exitSlip?.fecha_emision || today,
        designado:
            exitSlip?.designado || auth.user.cargo_designado || "",
        motivo_salida: exitSlip?.motivo_salida || "personal",
        motivo_detalle: exitSlip?.motivo_detalle || "",
        fecha_autorizada: exitSlip?.fecha_autorizada || today,
        hora_desde: exitSlip?.hora_desde?.slice(0, 5) || "",
        hora_hasta: exitSlip?.hora_hasta?.slice(0, 5) || "",
    });

    const { data, setData, processing, errors } = form;

    const step1Complete = !!(data.tipo_plantilla && data.fecha_emision && data.designado);
    const step2Complete = !!(data.motivo_salida && data.motivo_detalle && data.fecha_autorizada);
    const [activeStep, setActiveStep] = useState(1);

    const stepContainerRef = useRef<HTMLDivElement>(null);
    const pageScopeRef = useRef<HTMLDivElement>(null);

    const charLeft = 2000 - data.motivo_detalle.length;
    const charPercent = Math.min(100, (data.motivo_detalle.length / 2000) * 100);
    const estimatedDuration = calculateDuration(data.hora_desde, data.hora_hasta);

    const selectedMotivoObj =
        MOTIVOS.find((m) => m.value === data.motivo_salida) || MOTIVOS[0];

    // GSAP page entrance animation
    useGSAP(
        () => {
            const prefersReduced = window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches;
            if (prefersReduced) return;

            const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
            tl.fromTo(
                ".pf-v2-hero",
                { opacity: 0, y: -12, scale: 0.99 },
                { opacity: 1, y: 0, scale: 1, duration: 0.4 }
            )
                .fromTo(
                    ".pf-v2-stepper-bar",
                    { opacity: 0, y: 10 },
                    { opacity: 1, y: 0, duration: 0.3 },
                    "-=0.2"
                )
                .fromTo(
                    ".pf-v2-main-col, .pf-v2-sidebar-col",
                    { opacity: 0, y: 14 },
                    { opacity: 1, y: 0, duration: 0.35, stagger: 0.08 },
                    "-=0.15"
                );
        },
        { scope: pageScopeRef }
    );

    // GSAP transition when switching active step
    useEffect(() => {
        if (!stepContainerRef.current) return;
        const prefersReduced = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;
        if (prefersReduced) return;

        gsap.fromTo(
            stepContainerRef.current,
            { opacity: 0, y: 12 },
            { opacity: 1, y: 0, duration: 0.28, ease: "power2.out" }
        );
    }, [activeStep]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit) {
            form.put(route("exit-slips.update", exitSlip!.id));
        } else {
            form.post(route("exit-slips.store"));
        }
    };

    return (
        <AuthenticatedLayout
            header={<h1>{isEdit ? "Editar papeleta" : "Nueva papeleta"}</h1>}
        >
            <Head title={isEdit ? "Editar papeleta" : "Nueva papeleta"} />

            <div ref={pageScopeRef} className="portal-stack pf-v2-root">
                {/* Back button */}
                <div className="pf-v2-top-nav">
                    <Link
                        href={route("exit-slips.index")}
                        className="pf-v2-back-link"
                    >
                        <PortalIcon name="chevron" className="rotate-180" />
                        <span>Volver a la bandeja de papeletas</span>
                    </Link>
                </div>

                {/* Hero Banner */}
                <section className="pf-v2-hero">
                    <div className="pf-v2-hero-content">
                        <div className="pf-v2-hero-info">
                            <div className="pf-v2-hero-tags">
                                <span className="pf-v2-pill-eyebrow">
                                    <PortalIcon name="shield" />
                                    <span>TRÁMITE DE SALIDA OFICIAL</span>
                                </span>
                                {isEdit && exitSlip?.codigo && (
                                    <span className="pf-v2-pill-code">
                                        {exitSlip.codigo}
                                    </span>
                                )}
                                {isEdit && exitSlip?.estado_label && (
                                    <span className="pf-v2-pill-status">
                                        <span className="pf-v2-status-dot" />
                                        {exitSlip.estado_label}
                                    </span>
                                )}
                            </div>

                            <h2 className="pf-v2-hero-title">
                                {isEdit
                                    ? "Editar papeleta de salida"
                                    : "Nueva papeleta de salida"}
                            </h2>

                            <p className="pf-v2-hero-desc">
                                {isAdminEdit
                                    ? "Modificación administrativa. Se preservan la trazabilidad, las firmas existentes y el historial de auditoría."
                                    : "Completa la información requerida para generar la solicitud y remitirla a revisión de jefatura."}
                            </p>

                            <div className="pf-v2-hero-format-action">
                                {formatAvailable ? (
                                    <a
                                        className="pf-v2-format-link"
                                        href={route("exit-slip-formats.current")}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <PortalIcon name="file" />
                                        <span>Ver formato de papeleta vigente</span>
                                        <PortalIcon name="arrow" />
                                    </a>
                                ) : (
                                    <div className="pf-v2-format-updating" role="status">
                                        <PortalIcon name="alert" />
                                        <span>
                                            <strong>Formato en actualización:</strong> La plantilla oficial está siendo sincronizada.
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Quick Summary Card in Hero */}
                        <div className="pf-v2-hero-meta-card">
                            <div className="pf-v2-hero-meta-head">
                                <span className="pf-v2-hero-meta-title">
                                    Ficha de Trámite
                                </span>
                                <span className="pf-v2-hero-meta-chip">
                                    {data.tipo_plantilla === "practitioner"
                                        ? "Practicante"
                                        : "Personal EPSEL"}
                                </span>
                            </div>

                            <div className="pf-v2-hero-meta-rows">
                                <div className="pf-v2-hero-meta-row">
                                    <span className="pf-v2-meta-label">Titular:</span>
                                    <strong className="pf-v2-meta-val">
                                        {exitSlip?.solicitante ||
                                            `${auth.user.nombres} ${auth.user.apellidos}`}
                                    </strong>
                                </div>
                                <div className="pf-v2-hero-meta-row">
                                    <span className="pf-v2-meta-label">Emisión:</span>
                                    <strong className="pf-v2-meta-val">
                                        {formatDateHuman(data.fecha_emision)}
                                    </strong>
                                </div>
                                <div className="pf-v2-hero-meta-row">
                                    <span className="pf-v2-meta-label">Permiso:</span>
                                    <strong className="pf-v2-meta-val">
                                        {formatDateHuman(data.fecha_autorizada)}
                                    </strong>
                                </div>
                                <div className="pf-v2-hero-meta-row">
                                    <span className="pf-v2-meta-label">Horario:</span>
                                    <strong className="pf-v2-meta-val">
                                        {data.hora_desde
                                            ? `${data.hora_desde} a ${
                                                  data.hora_hasta || "—"
                                              }`
                                            : "Sin horario específico"}
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stepper Navigation */}
                    <div className="pf-v2-stepper-bar">
                        {[
                            {
                                n: 1,
                                title: "Solicitud",
                                subtitle: "Tipo y designación",
                                done: step1Complete,
                            },
                            {
                                n: 2,
                                title: "Motivo y horario",
                                subtitle: "Causa y tiempo",
                                done: step2Complete,
                            },
                            {
                                n: 3,
                                title: "Confirmación",
                                subtitle: isEdit ? "Revisión final" : "Firma y envío",
                                done: false,
                            },
                        ].map(({ n, title, subtitle, done }, idx) => (
                            <button
                                key={n}
                                type="button"
                                className={`pf-v2-step-item ${
                                    activeStep === n
                                        ? "is-active"
                                        : done
                                        ? "is-done"
                                        : ""
                                }`}
                                onClick={() => setActiveStep(n)}
                            >
                                <span className="pf-v2-step-circle">
                                    {done ? <PortalIcon name="check" /> : n}
                                </span>
                                <div className="pf-v2-step-text">
                                    <strong className="pf-v2-step-title">
                                        {title}
                                    </strong>
                                    <span className="pf-v2-step-sub">{subtitle}</span>
                                </div>
                                {idx < 2 && <span className="pf-v2-step-divider" />}
                            </button>
                        ))}
                    </div>
                </section>

                {/* 2-Column Responsive Layout */}
                <div className="pf-v2-grid-layout">
                    {/* Main Form Column */}
                    <main className="pf-v2-main-col">
                        <form onSubmit={handleSubmit} noValidate>
                            {/* Step Content Container */}
                            <div ref={stepContainerRef} className="pf-v2-step-content">
                                {/* ──────── STEP 1: Solicitud ──────── */}
                                {activeStep === 1 && (
                                    <section className="portal-card pf-v2-card">
                                        <div className="pf-v2-card-header">
                                            <div className="pf-v2-card-icon-num">01</div>
                                            <div className="pf-v2-card-heading">
                                                <h3>Datos de la solicitud</h3>
                                                <p>
                                                    Indica el tipo de plantilla y tu asignación para el documento oficial.
                                                </p>
                                            </div>
                                            {step1Complete && (
                                                <span className="pf-v2-badge-completed">
                                                    <PortalIcon name="check" /> Completado
                                                </span>
                                            )}
                                        </div>

                                        <div className="pf-v2-card-body">
                                            {/* Tipo de papeleta selector */}
                                            <div className="pf-v2-form-group">
                                                <label className="pf-v2-label">
                                                    Tipo de papeleta
                                                </label>
                                                <div className="pf-v2-template-grid">
                                                    {TEMPLATES.map((tmpl) => (
                                                        <div
                                                            key={tmpl.value}
                                                            role="button"
                                                            tabIndex={0}
                                                            onClick={() =>
                                                                setData(
                                                                    "tipo_plantilla",
                                                                    tmpl.value
                                                                )
                                                            }
                                                            onKeyDown={(e) => {
                                                                if (
                                                                    e.key === "Enter" ||
                                                                    e.key === " "
                                                                ) {
                                                                    e.preventDefault();
                                                                    setData(
                                                                        "tipo_plantilla",
                                                                        tmpl.value
                                                                    );
                                                                }
                                                            }}
                                                            className={`pf-v2-template-card ${
                                                                data.tipo_plantilla ===
                                                                tmpl.value
                                                                    ? "is-selected"
                                                                    : ""
                                                            }`}
                                                        >
                                                            <div className="pf-v2-tmpl-head">
                                                                <span className="pf-v2-tmpl-icon">
                                                                    <PortalIcon
                                                                        name={tmpl.icon}
                                                                    />
                                                                </span>
                                                                <span className="pf-v2-tmpl-badge">
                                                                    {tmpl.badge}
                                                                </span>
                                                                <span className="pf-v2-tmpl-check">
                                                                    {data.tipo_plantilla ===
                                                                        tmpl.value && (
                                                                        <PortalIcon name="check" />
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <strong className="pf-v2-tmpl-title">
                                                                {tmpl.title}
                                                            </strong>
                                                            <p className="pf-v2-tmpl-desc">
                                                                {tmpl.desc}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Fechas y Cargo */}
                                            <div className="pf-v2-fields-grid-2">
                                                <div className="portal-field">
                                                    <label htmlFor="fecha_emision">
                                                        Fecha de emisión{" "}
                                                        <span className="text-red-500">*</span>
                                                    </label>
                                                    <div className="pf-v2-input-wrap">
                                                        <input
                                                            id="fecha_emision"
                                                            type="date"
                                                            required
                                                            value={data.fecha_emision}
                                                            onChange={(e) =>
                                                                setData(
                                                                    "fecha_emision",
                                                                    e.target.value
                                                                )
                                                            }
                                                            className="pf-v2-input"
                                                        />
                                                    </div>
                                                    {errors.fecha_emision && (
                                                        <small className="portal-error" role="alert">
                                                            {errors.fecha_emision}
                                                        </small>
                                                    )}
                                                </div>

                                                <div className="portal-field">
                                                    <label htmlFor="designado">
                                                        Cargo o designación{" "}
                                                        <span className="text-red-500">*</span>
                                                    </label>
                                                    <div className="pf-v2-input-wrap">
                                                        <input
                                                            id="designado"
                                                            required
                                                            maxLength={255}
                                                            value={data.designado}
                                                            onChange={(e) =>
                                                                setData(
                                                                    "designado",
                                                                    e.target.value
                                                                )
                                                            }
                                                            placeholder="Ej.: Asistente de Sistemas"
                                                            className="pf-v2-input"
                                                        />
                                                    </div>
                                                    {errors.designado && (
                                                        <small className="portal-error" role="alert">
                                                            {errors.designado}
                                                        </small>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Navigation buttons inside Step 1 */}
                                            <div className="pf-v2-step-actions">
                                                <Link
                                                    href={route("exit-slips.index")}
                                                    className="portal-btn portal-btn-light"
                                                >
                                                    Cancelar
                                                </Link>
                                                <button
                                                    type="button"
                                                    className="portal-btn portal-btn-primary pf-v2-btn-next"
                                                    disabled={!step1Complete}
                                                    onClick={() => setActiveStep(2)}
                                                >
                                                    <span>Continuar al Motivo</span>
                                                    <PortalIcon name="arrow" />
                                                </button>
                                            </div>
                                        </div>
                                    </section>
                                )}

                                {/* ──────── STEP 2: Motivo y Horario ──────── */}
                                {activeStep === 2 && (
                                    <section className="portal-card pf-v2-card">
                                        <div className="pf-v2-card-header">
                                            <div className="pf-v2-card-icon-num">02</div>
                                            <div className="pf-v2-card-heading">
                                                <h3>Motivo y horario</h3>
                                                <p>
                                                    Describe las razones de la salida y el tiempo solicitado.
                                                </p>
                                            </div>
                                            {step2Complete && (
                                                <span className="pf-v2-badge-completed">
                                                    <PortalIcon name="check" /> Completado
                                                </span>
                                            )}
                                        </div>

                                        <div className="pf-v2-card-body">
                                            {/* Motivos visual selector */}
                                            <div className="pf-v2-form-group">
                                                <label className="pf-v2-label">
                                                    Motivo de salida
                                                </label>
                                                <div className="pf-v2-motivos-grid">
                                                    {MOTIVOS.map((motivo) => (
                                                        <div
                                                            key={motivo.value}
                                                            role="button"
                                                            tabIndex={0}
                                                            onClick={() =>
                                                                setData(
                                                                    "motivo_salida",
                                                                    motivo.value
                                                                )
                                                            }
                                                            onKeyDown={(e) => {
                                                                if (
                                                                    e.key === "Enter" ||
                                                                    e.key === " "
                                                                ) {
                                                                    e.preventDefault();
                                                                    setData(
                                                                        "motivo_salida",
                                                                        motivo.value
                                                                    );
                                                                }
                                                            }}
                                                            className={`pf-v2-motivo-card ${
                                                                data.motivo_salida ===
                                                                motivo.value
                                                                    ? "is-selected"
                                                                    : ""
                                                            }`}
                                                        >
                                                            <div className="pf-v2-motivo-top">
                                                                <span className="pf-v2-motivo-icon">
                                                                    <PortalIcon
                                                                        name={motivo.icon}
                                                                    />
                                                                </span>
                                                                <span className="pf-v2-motivo-check">
                                                                    {data.motivo_salida ===
                                                                        motivo.value && (
                                                                        <PortalIcon name="check" />
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <strong className="pf-v2-motivo-title">
                                                                {motivo.label}
                                                            </strong>
                                                            <p className="pf-v2-motivo-desc">
                                                                {motivo.desc}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Fecha autorizada */}
                                            <div className="portal-field">
                                                <label htmlFor="fecha_autorizada">
                                                    Fecha autorizada de salida{" "}
                                                    <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    id="fecha_autorizada"
                                                    type="date"
                                                    min={isEdit ? undefined : today}
                                                    required
                                                    value={data.fecha_autorizada}
                                                    onChange={(e) =>
                                                        setData(
                                                            "fecha_autorizada",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="pf-v2-input"
                                                />
                                                {errors.fecha_autorizada && (
                                                    <small className="portal-error" role="alert">
                                                        {errors.fecha_autorizada}
                                                    </small>
                                                )}
                                            </div>

                                            {/* Descripción detallada */}
                                            <div className="portal-field">
                                                <div className="flex items-center justify-between">
                                                    <label htmlFor="motivo_detalle">
                                                        Descripción y justificación detallada{" "}
                                                        <span className="text-red-500">*</span>
                                                    </label>
                                                    <span className="pf-v2-char-counter">
                                                        {charLeft} caracteres disponibles
                                                    </span>
                                                </div>
                                                <textarea
                                                    id="motivo_detalle"
                                                    rows={4}
                                                    required
                                                    maxLength={2000}
                                                    placeholder="Explica detalladamente la razón de la salida, trámite o comisión de servicio..."
                                                    value={data.motivo_detalle}
                                                    onChange={(e) =>
                                                        setData(
                                                            "motivo_detalle",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="pf-v2-textarea"
                                                />
                                                {/* Animated progress meter */}
                                                <div className="pf-v2-char-bar-wrap">
                                                    <div
                                                        className="pf-v2-char-bar-fill"
                                                        style={{
                                                            width: `${charPercent}%`,
                                                            background:
                                                                charPercent > 90
                                                                    ? "#ef4444"
                                                                    : "#087d90",
                                                        }}
                                                    />
                                                </div>
                                                {errors.motivo_detalle && (
                                                    <small className="portal-error" role="alert">
                                                        {errors.motivo_detalle}
                                                    </small>
                                                )}
                                            </div>

                                            {/* Horarios de salida y retorno */}
                                            <div className="pf-v2-fields-grid-2">
                                                <div className="portal-field">
                                                    <label htmlFor="hora_desde">
                                                        Hora estimada de salida
                                                        <span className="text-slate-400 font-normal ml-1">
                                                            (opcional)
                                                        </span>
                                                    </label>
                                                    <input
                                                        id="hora_desde"
                                                        type="time"
                                                        value={data.hora_desde}
                                                        onChange={(e) =>
                                                            setData(
                                                                "hora_desde",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="pf-v2-input"
                                                    />
                                                </div>

                                                <div className="portal-field">
                                                    <label htmlFor="hora_hasta">
                                                        Hora estimada de retorno
                                                        <span className="text-slate-400 font-normal ml-1">
                                                            (opcional)
                                                        </span>
                                                    </label>
                                                    <input
                                                        id="hora_hasta"
                                                        type="time"
                                                        min={data.hora_desde || undefined}
                                                        value={data.hora_hasta}
                                                        onChange={(e) =>
                                                            setData(
                                                                "hora_hasta",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="pf-v2-input"
                                                    />
                                                </div>
                                            </div>

                                            {estimatedDuration && (
                                                <div className="pf-v2-duration-banner">
                                                    <PortalIcon name="clock" />
                                                    <span>
                                                        Duración estimada del permiso:{" "}
                                                        <strong>{estimatedDuration}</strong>
                                                    </span>
                                                </div>
                                            )}

                                            {/* Navigation buttons Step 2 */}
                                            <div className="pf-v2-step-actions pf-v2-step-actions--between">
                                                <button
                                                    type="button"
                                                    className="portal-btn portal-btn-light"
                                                    onClick={() => setActiveStep(1)}
                                                >
                                                    <PortalIcon
                                                        name="chevron"
                                                        className="rotate-180"
                                                    />
                                                    <span>Paso anterior</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="portal-btn portal-btn-primary pf-v2-btn-next"
                                                    disabled={!step2Complete}
                                                    onClick={() => setActiveStep(3)}
                                                >
                                                    <span>Continuar a Confirmación</span>
                                                    <PortalIcon name="arrow" />
                                                </button>
                                            </div>
                                        </div>
                                    </section>
                                )}

                                {/* ──────── STEP 3: Confirmación y Envío ──────── */}
                                {activeStep === 3 && (
                                    <section className="portal-card pf-v2-card">
                                        <div className="pf-v2-card-header">
                                            <div className="pf-v2-card-icon-num">03</div>
                                            <div className="pf-v2-card-heading">
                                                <h3>
                                                    {isEdit
                                                        ? "Revisión final de cambios"
                                                        : "Confirmación y firma"}
                                                </h3>
                                                <p>
                                                    Verifica el resumen antes de registrar los cambios oficiales.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="pf-v2-card-body">
                                            {/* Summary Recap Box */}
                                            <div className="pf-v2-recap-box">
                                                <div className="pf-v2-recap-head">
                                                    <h4>Resumen de la Papeleta</h4>
                                                    <span className="pf-v2-recap-tag">
                                                        {data.tipo_plantilla === "practitioner"
                                                            ? "Practicante"
                                                            : "Personal Nombrado / Contratado"}
                                                    </span>
                                                </div>

                                                <div className="pf-v2-recap-grid">
                                                    <div className="pf-v2-recap-item">
                                                        <span>Cargo registrado:</span>
                                                        <strong>{data.designado || "—"}</strong>
                                                    </div>
                                                    <div className="pf-v2-recap-item">
                                                        <span>Fecha autorizada:</span>
                                                        <strong>
                                                            {formatDateHuman(
                                                                data.fecha_autorizada
                                                            )}
                                                        </strong>
                                                    </div>
                                                    <div className="pf-v2-recap-item">
                                                        <span>Motivo clasificado:</span>
                                                        <strong>{selectedMotivoObj.label}</strong>
                                                    </div>
                                                    <div className="pf-v2-recap-item">
                                                        <span>Rango de horario:</span>
                                                        <strong>
                                                            {data.hora_desde
                                                                ? `${data.hora_desde} a ${
                                                                      data.hora_hasta ||
                                                                      "Fin de jornada"
                                                                  }`
                                                                : "Todo el día / Sin hora fija"}
                                                        </strong>
                                                    </div>
                                                </div>

                                                <div className="pf-v2-recap-detail">
                                                    <span>Detalle justificado:</span>
                                                    <p>{data.motivo_detalle || "Sin descripción adicional"}</p>
                                                </div>
                                            </div>

                                            {/* Signature if not admin */}
                                            {!isAdminEdit && (
                                                <div className="pf-v2-signature-block">
                                                    <div className="pf-v2-sig-head">
                                                        <PortalIcon name="shield" />
                                                        <div>
                                                            <h4>Firma digital del solicitante</h4>
                                                            <p>
                                                                Tu firma se estampará automáticamente en el documento oficial.
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="portal-signature">
                                                        <UpdateSignatureForm />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="pf-v2-legal-banner">
                                                <PortalIcon name="shield" />
                                                <p>
                                                    {isAdminEdit
                                                        ? "Esta acción actualizará la información oficial de la papeleta y quedará registrada en el libro de auditoría de EPSEL."
                                                        : "Al guardar el borrador, podrás previsualizar la papeleta en PDF antes de que tu jefe inmediato proceda con la firma."}
                                                </p>
                                            </div>

                                            {/* Action buttons Step 3 */}
                                            <div className="pf-v2-step-actions pf-v2-step-actions--between">
                                                <button
                                                    type="button"
                                                    className="portal-btn portal-btn-light"
                                                    onClick={() => setActiveStep(2)}
                                                >
                                                    <PortalIcon
                                                        name="chevron"
                                                        className="rotate-180"
                                                    />
                                                    <span>Modificar datos</span>
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="portal-btn portal-btn-primary pf-v2-submit-final"
                                                    disabled={
                                                        processing ||
                                                        !step1Complete ||
                                                        !step2Complete
                                                    }
                                                >
                                                    {processing ? (
                                                        <>
                                                            <span className="pf-spinner" />
                                                            <span>Guardando…</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <PortalIcon name="check" />
                                                            <span>
                                                                {isEdit
                                                                    ? "Guardar cambios"
                                                                    : "Guardar borrador"}
                                                            </span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </section>
                                )}
                            </div>

                            {/* Global Form Errors */}
                            {Object.values(errors).length > 0 && (
                                <div className="portal-error mt-4" role="alert">
                                    <strong className="block mb-1">
                                        Revisa los siguientes campos:
                                    </strong>
                                    {Object.values(errors).map((error, i) => (
                                        <p key={i}>• {error}</p>
                                    ))}
                                </div>
                            )}

                            {/* Sticky Quick Actions Bar for Edit Mode */}
                            {isEdit && activeStep !== 3 && (
                                <div className="pf-v2-floating-action-bar">
                                    <div className="pf-v2-floating-info">
                                        <PortalIcon name="shield" />
                                        <span>
                                            Edición activa de <strong>{exitSlip?.codigo || "Papeleta"}</strong>
                                        </span>
                                    </div>
                                    <div className="pf-v2-floating-btns">
                                        <button
                                            type="submit"
                                            className="portal-btn portal-btn-primary"
                                            disabled={
                                                processing ||
                                                !step1Complete ||
                                                !step2Complete
                                            }
                                        >
                                            {processing ? (
                                                <>
                                                    <span className="pf-spinner" /> Guardando…
                                                </>
                                            ) : (
                                                <>
                                                    <PortalIcon name="check" /> Guardar cambios ahora
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </form>
                    </main>

                    {/* Right Sidebar Column - Always balances layout */}
                    <aside className="pf-v2-sidebar-col">
                        {/* Control and Audit Card */}
                        <section className="portal-card pf-v2-sidebar-card">
                            <div className="pf-v2-side-head">
                                <span className="pf-v2-side-icon">
                                    <PortalIcon name="shield" />
                                </span>
                                <div>
                                    <h4>Control de Expediente</h4>
                                    <p>Trazabilidad administrativa</p>
                                </div>
                            </div>

                            <div className="pf-v2-side-body">
                                <div className="pf-v2-side-item">
                                    <span className="pf-v2-side-label">Titular:</span>
                                    <strong className="pf-v2-side-val">
                                        {exitSlip?.solicitante ||
                                            `${auth.user.nombres} ${auth.user.apellidos}`}
                                    </strong>
                                </div>

                                {exitSlip?.codigo && (
                                    <div className="pf-v2-side-item">
                                        <span className="pf-v2-side-label">Código:</span>
                                        <span className="pf-v2-code-badge">
                                            {exitSlip.codigo}
                                        </span>
                                    </div>
                                )}

                                {exitSlip?.estado_label && (
                                    <div className="pf-v2-side-item">
                                        <span className="pf-v2-side-label">Estado:</span>
                                        <span className="pf-v2-status-pill">
                                            {exitSlip.estado_label}
                                        </span>
                                    </div>
                                )}

                                <div className="pf-v2-side-divider" />

                                <div className="pf-v2-rules-box">
                                    <strong>Normativa EPSEL S.A.</strong>
                                    <p>
                                        Las papeletas autorizadas deben ser selladas por el personal de vigilancia en puerta al momento del egreso y reingreso a la sede.
                                    </p>
                                </div>

                                <div className="pf-v2-side-actions">
                                    {formatAvailable && (
                                        <a
                                            href={route("exit-slip-formats.current")}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="pf-v2-side-btn"
                                        >
                                            <PortalIcon name="file" />
                                            <span>Descargar plantilla PDF</span>
                                        </a>
                                    )}
                                    <Link
                                        href={route("exit-slips.index")}
                                        className="pf-v2-side-btn pf-v2-side-btn--subtle"
                                    >
                                        <PortalIcon name="grid" />
                                        <span>Ir a la bandeja</span>
                                    </Link>
                                </div>
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
