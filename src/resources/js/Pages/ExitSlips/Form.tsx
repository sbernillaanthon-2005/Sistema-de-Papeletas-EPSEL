import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, Link } from "@inertiajs/react";
import { PageProps } from "@/types";
import UpdateSignatureForm from "@/Pages/Profile/Partials/UpdateSignatureForm";
import { useState } from "react";

/* ── SVG icons inline ── */
const IconArrow = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
);
const IconCheck = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m5 13 4 4L19 7" />
    </svg>
);
const IconChevronLeft = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m15 18-6-6 6-6" />
    </svg>
);
const IconInfo = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
);

interface SlipForm {
    id?: string;
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
    { value: "personal",   label: "Asuntos personales" },
    { value: "essalud",    label: "Salud / EsSalud"    },
    { value: "commission", label: "Comisión de servicio" },
    { value: "other",      label: "Otro motivo"         },
];

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

    const form = useForm({
        tipo_plantilla:
            exitSlip?.tipo_plantilla ||
            (auth.user.rol === "practitioner" ? "practitioner" : "worker"),
        fecha_emision:    exitSlip?.fecha_emision    || today,
        designado:        exitSlip?.designado        || auth.user.cargo_designado || "",
        motivo_salida:    exitSlip?.motivo_salida    || "personal",
        motivo_detalle:   exitSlip?.motivo_detalle   || "",
        fecha_autorizada: exitSlip?.fecha_autorizada || today,
        hora_desde:       exitSlip?.hora_desde?.slice(0, 5) || "",
        hora_hasta:       exitSlip?.hora_hasta?.slice(0, 5) || "",
    });

    const { data, setData, processing, errors } = form;

    const step1Complete = !!(data.tipo_plantilla && data.fecha_emision && data.designado);
    const step2Complete = !!(data.motivo_salida && data.motivo_detalle && data.fecha_autorizada);
    const [activeStep, setActiveStep] = useState(1);

    const charLeft    = 2000 - data.motivo_detalle.length;
    const charPercent = Math.min(100, (data.motivo_detalle.length / 2000) * 100);
    const isEdit      = !!exitSlip?.id;

    return (
        <AuthenticatedLayout header={<h1>{isEdit ? "Editar borrador" : "Nueva papeleta"}</h1>}>
            <Head title={isEdit ? "Editar papeleta" : "Nueva papeleta"} />
            <div className="portal-stack">

                {/* Back link */}
                <Link href={route("exit-slips.index")} className="portal-row-link">
                    <IconChevronLeft />
                    Volver a la bandeja
                </Link>

                {/* Hero */}
                <section className="portal-hero portal-form-hero pf-hero">
                    <div className="pf-hero-text">
                        <p className="portal-hero-eyebrow">SOLICITUD DE AUTORIZACIÓN</p>
                        <h2>{isEdit ? "Edita tu borrador" : "Nueva papeleta de salida"}</h2>
                        <p>Completa los datos y guarda el borrador para enviarlo a tu jefe.</p>
                        {formatAvailable ? <a
                            className="pf-format-preview"
                            href={route("exit-slip-formats.current")}
                            target="_blank"
                            rel="noreferrer"
                        >
                            Ver formato de papeleta vigente
                            <IconArrow />
                        </a> : <div className="pf-format-updating" role="status">
                            <IconInfo />
                            <span><strong>Formato en actualización</strong>Actualmente el administrador está actualizando la nueva versión de papeleta. Ponte en contacto con él.</span>
                        </div>}
                    </div>
                    {/* Stepper compacto dentro del hero */}
                    <div className="pf-hero-steps">
                        {[
                            { n: 1, label: "Solicitud",   done: step1Complete },
                            { n: 2, label: "Motivo",      done: step2Complete },
                            { n: 3, label: "Firma y envío", done: false       },
                        ].map(({ n, label, done }, i, arr) => (
                            <span key={n} className="pf-hero-step-wrap">
                                <button
                                    type="button"
                                    className={`pf-hero-step ${activeStep === n ? "active" : ""} ${done ? "done" : ""}`}
                                    onClick={() => setActiveStep(n)}
                                    aria-current={activeStep === n ? "step" : undefined}
                                >
                                    {done ? <IconCheck /> : n}
                                </button>
                                <span className={`pf-hero-step-label ${activeStep === n ? "active" : ""}`}>{label}</span>
                                {i < arr.length - 1 && <span className="pf-hero-connector" />}
                            </span>
                        ))}
                    </div>
                </section>

                <div className="portal-detail-grid">
                    <form
                        className="portal-stack"
                        onSubmit={(e) => {
                            e.preventDefault();
                            isEdit
                                ? form.put(route("exit-slips.update", exitSlip!.id))
                                : form.post(route("exit-slips.store"));
                        }}
                    >
                        {/* ── SECCIÓN 1 ── */}
                        <div className={`portal-card pf-panel ${activeStep === 1 ? "pf-panel--active" : ""}`}>
                            <div className="pf-panel-header">
                                <div className="pf-panel-num">01</div>
                                <div className="pf-panel-info">
                                    <h2>Datos de la solicitud</h2>
                                    <p>La información se reflejará en tu papeleta impresa.</p>
                                </div>
                                {step1Complete && activeStep !== 1 && (
                                    <span className="pf-done-badge"><IconCheck /> Completo</span>
                                )}
                            </div>

                            <div className="pf-section-body">
                                {/* Tipo de papeleta — toggle limpio */}
                                <fieldset className="pf-fieldset">
                                    <legend>Tipo de papeleta</legend>
                                    <div className="pf-toggle-group">
                                        {[
                                            { value: "practitioner", label: "Practicante" },
                                            { value: "worker",       label: "Personal nombrado / contratado" },
                                        ].map(({ value, label }) => (
                                            <label
                                                key={value}
                                                className={`pf-toggle-opt ${data.tipo_plantilla === value ? "pf-toggle-opt--on" : ""}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="tipo_plantilla"
                                                    value={value}
                                                    checked={data.tipo_plantilla === value}
                                                    onChange={() => setData("tipo_plantilla", value)}
                                                />
                                                {data.tipo_plantilla === value && (
                                                    <span className="pf-toggle-check"><IconCheck /></span>
                                                )}
                                                {label}
                                            </label>
                                        ))}
                                    </div>
                                </fieldset>

                                <div className="portal-form-grid pf-grid-top">
                                    <div className="portal-field">
                                        <label htmlFor="fecha_emision">Fecha de emisión</label>
                                        <input
                                            id="fecha_emision"
                                            type="date"
                                            required
                                            value={data.fecha_emision}
                                            onChange={(e) => setData("fecha_emision", e.target.value)}
                                        />
                                    </div>
                                    <div className="portal-field portal-data-wide">
                                        <label htmlFor="designado">Cargo o designación</label>
                                        <input
                                            id="designado"
                                            required
                                            maxLength={255}
                                            value={data.designado}
                                            onChange={(e) => setData("designado", e.target.value)}
                                            placeholder="Indica tu cargo actual"
                                        />
                                        {errors.designado && (
                                            <span className="pf-field-error">{errors.designado}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="pf-nav-buttons">
                                    <button
                                        type="button"
                                        className="portal-btn portal-btn-primary"
                                        disabled={!step1Complete}
                                        onClick={() => setActiveStep(2)}
                                    >
                                        Continuar
                                        <IconArrow />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ── SECCIÓN 2 ── */}
                        <div className={`portal-card pf-panel ${activeStep === 2 ? "pf-panel--active" : ""}`}>
                            <div className="pf-panel-header">
                                <div className="pf-panel-num">02</div>
                                <div className="pf-panel-info">
                                    <h2>Motivo y horario</h2>
                                    <p>Indica cuándo y por qué necesitas ausentarte.</p>
                                </div>
                                {step2Complete && activeStep !== 2 && (
                                    <span className="pf-done-badge"><IconCheck /> Completo</span>
                                )}
                            </div>

                            <div className="pf-section-body">
                                {/* Motivo — botones tipo segmented control */}
                                <fieldset className="pf-fieldset">
                                    <legend>Motivo de salida</legend>
                                    <div className="pf-motivo-grid">
                                        {MOTIVOS.map(({ value, label }) => (
                                            <button
                                                key={value}
                                                type="button"
                                                className={`pf-motivo-btn ${data.motivo_salida === value ? "pf-motivo-btn--on" : ""}`}
                                                onClick={() => setData("motivo_salida", value)}
                                            >
                                                {data.motivo_salida === value && (
                                                    <span className="pf-motivo-check"><IconCheck /></span>
                                                )}
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </fieldset>

                                <div className="portal-form-grid pf-grid-top">
                                    <div className="portal-field">
                                        <label htmlFor="fecha_autorizada">Fecha autorizada</label>
                                        <input
                                            id="fecha_autorizada"
                                            type="date"
                                            min={today}
                                            required
                                            value={data.fecha_autorizada}
                                            onChange={(e) => setData("fecha_autorizada", e.target.value)}
                                        />
                                    </div>

                                    <div className="portal-field portal-data-wide">
                                        <label htmlFor="motivo_detalle">
                                            Descripción del motivo
                                            <span className="pf-required"> *</span>
                                        </label>
                                        <textarea
                                            id="motivo_detalle"
                                            rows={4}
                                            required
                                            maxLength={2000}
                                            placeholder="Describe brevemente el motivo de tu salida…"
                                            value={data.motivo_detalle}
                                            onChange={(e) => setData("motivo_detalle", e.target.value)}
                                        />
                                        <div className="pf-char-row">
                                            <div className="pf-char-bar">
                                                <div
                                                    className="pf-char-fill"
                                                    style={{
                                                        width: `${charPercent}%`,
                                                        background: charPercent > 90 ? "var(--p-danger)" : "var(--p-teal)",
                                                    }}
                                                />
                                            </div>
                                            <span className="pf-char-count">{charLeft} restantes</span>
                                        </div>
                                    </div>

                                    <div className="portal-field">
                                        <label htmlFor="hora_desde">
                                            Hora de salida
                                            <span className="pf-optional"> (opcional)</span>
                                        </label>
                                        <input
                                            id="hora_desde"
                                            type="time"
                                            required={!!data.hora_hasta}
                                            value={data.hora_desde}
                                            onChange={(e) => setData("hora_desde", e.target.value)}
                                        />
                                    </div>
                                    <div className="portal-field">
                                        <label htmlFor="hora_hasta">
                                            Hora de retorno
                                            <span className="pf-optional"> (opcional)</span>
                                        </label>
                                        <input
                                            id="hora_hasta"
                                            type="time"
                                            required={!!data.hora_desde}
                                            min={data.hora_desde || undefined}
                                            value={data.hora_hasta}
                                            onChange={(e) => setData("hora_hasta", e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="pf-nav-buttons pf-nav-buttons--between">
                                    <button
                                        type="button"
                                        className="portal-btn portal-btn-light"
                                        onClick={() => setActiveStep(1)}
                                    >
                                        <IconChevronLeft /> Volver
                                    </button>
                                    <button
                                        type="button"
                                        className="portal-btn portal-btn-primary"
                                        disabled={!step2Complete}
                                        onClick={() => setActiveStep(3)}
                                    >
                                        Continuar <IconArrow />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Errores globales */}
                        {Object.values(errors).length > 0 && (
                            <div className="portal-error" role="alert">
                                {Object.values(errors).map((error, i) => (
                                    <p key={i}>{error}</p>
                                ))}
                            </div>
                        )}

                        {/* Barra de acciones */}
                        <div className="portal-card">
                            <div className="pf-actions-bar">
                                <p className="pf-actions-hint">
                                    <IconInfo />
                                    Al guardar podrás revisar la vista previa en PDF antes de enviar a tu jefe.
                                </p>
                                <div className="pf-actions-btns">
                                    <Link className="portal-btn portal-btn-light" href={route("exit-slips.index")}>
                                        Cancelar
                                    </Link>
                                    <button
                                        className="portal-btn portal-btn-primary pf-submit-btn"
                                        disabled={processing}
                                    >
                                        {processing ? (
                                            <><span className="pf-spinner" /> Guardando…</>
                                        ) : (
                                            <><IconCheck /> {isEdit ? "Guardar cambios" : "Guardar borrador"}</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>

                    {/* Sidebar firma */}
                    <aside className="portal-stack">
                        <section className="portal-card">
                            <div className="pf-sidebar-header">
                                <h3>Firma digital</h3>
                                <p>Se adjuntará automáticamente al enviar.</p>
                            </div>
                            <div className="portal-card-body portal-signature">
                                <UpdateSignatureForm />
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
