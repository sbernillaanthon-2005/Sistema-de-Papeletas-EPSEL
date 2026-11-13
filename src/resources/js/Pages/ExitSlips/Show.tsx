import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { PageProps } from "@/types";
import { useRef, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { DialogTitle } from "@headlessui/react";
import Modal from "@/Components/Modal";
import PortalIcon from "@/Components/PortalIcon";
import { StatusBadge, formatDate } from "@/Components/PortalUI";
import { statuses } from "@/types/exit-slip";
import ExitSlipPdfModal from "./ExitSlipPdfModal";

interface Slip {
    id: string;
    codigo: string;
    fecha_emision: string;
    motivo_label: string;
    motivo_detalle: string;
    fecha_autorizada: string;
    hora_desde?: string;
    hora_hasta?: string;
    estado: string;
    estado_label: string;
    apellidos_nombres: string;
    designado: string;
    hora_salida?: string;
    hora_retorno?: string;
    observaciones?: string;
}
type History = {
    id: number;
    estado_destino: string;
    comentario?: string;
    created_at: string;
    actor?: { nombres: string; apellidos: string };
};
const stages = [
    "draft",
    "submitted",
    "approved_by_area",
    "submitted_to_hr",
    "approved_by_hr",
    "submitted_to_security",
    "completed",
];
const stageLabels = [
    "Borrador",
    "Jefatura",
    "Firma del jefe",
    "En RRHH",
    "Firma RRHH",
    "Vigilancia",
    "Finalizada",
];
const historyIcons: Record<string, "file" | "send" | "check" | "users" | "shield" | "clock"> = {
    draft: "file", submitted: "send", approved_by_area: "check", submitted_to_hr: "users",
    approved_by_hr: "check", submitted_to_security: "shield", completed: "check", rejected: "clock",
};
const formatTimestamp = (value: string) => `${formatDate(value)} · ${new Intl.DateTimeFormat("es-PE", {
    hour: "2-digit", minute: "2-digit", timeZone: "America/Lima",
}).format(new Date(value))}`;
gsap.registerPlugin(useGSAP);
export default function Show({
    exitSlip: slip,
    can,
    history,
}: PageProps<{
    exitSlip: Slip;
    can: Record<string, boolean>;
    history: History[];
}>) {
    const form = useForm({
        comentario: "",
        hora_salida: slip.hora_salida || "",
        hora_retorno: slip.hora_retorno || "",
        observaciones: slip.observaciones || "",
    });
    const [rejectOpen, setRejectOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [noReturn, setNoReturn] = useState(false);
    const progressRef = useRef<HTMLDivElement>(null);
    
    const transition = (action: string) =>
        form.post(
            route("exit-slips.transition", { exitSlip: slip.id, action }),
            { preserveScroll: true, onSuccess: () => setRejectOpen(false) },
        );
    const stage = stages.indexOf(slip.estado);
    const stageDates = stages.map((state) => history.find((item) => item.estado_destino === state)?.created_at);
    const pdfUrl = route("papeletas.pdf", slip.codigo);
    useGSAP(() => {
        if (!progressRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        const timeline = gsap.timeline({ defaults: { ease: "power2.out" } });
        const items = progressRef.current.querySelectorAll<HTMLElement>(".slip-detail-stage");
        items.forEach((item, index) => {
            if (index > stage) return;
            const marker = item.querySelector<HTMLElement>(".slip-detail-marker");
            const connector = item.querySelector<HTMLElement>(".slip-detail-connector");
            if (marker) {
                timeline.fromTo(marker, { scale: .65, opacity: .4 }, { scale: 1, opacity: 1, duration: .28 }, index === 0 ? 0 : ">-0.04");
            }
            if (connector && index < stage) {
                timeline.fromTo(connector, { scaleX: 0 }, { scaleX: 1, duration: .32 }, ">-0.08");
            }
        });
    }, { scope: progressRef, dependencies: [slip.estado], revertOnUpdate: true });
    const today = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Lima",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());
    return (
        <AuthenticatedLayout header={<h1>Detalle de papeleta</h1>}>
            <Head title="Detalle de papeleta" />
            <div className="portal-stack slip-detail-page">
                <div className="slip-detail-toolbar">
                    <Link
                        className="portal-row-link"
                        href={route("exit-slips.index")}
                    >
                        <PortalIcon name="arrow" />
                        Volver a la bandeja
                    </Link>
                </div>
                <section className="portal-card slip-detail-overview" aria-label="Resumen de la papeleta">
                    <div className="portal-card-head slip-detail-overview-head">
                        <span className="slip-detail-hero-icon"><PortalIcon name="file" /></span>
                        <div className="slip-detail-hero-copy">
                            <span className="slip-detail-eyebrow">Seguimiento de solicitud</span>
                            <h2>Papeleta de salida</h2>
                            <p>Solicitante: {slip.apellidos_nombres} · Emitida el {formatDate(slip.fecha_emision)}</p>
                            <small className="slip-detail-reference">Referencia: {slip.codigo}</small>
                        </div>
                        <div className="slip-detail-hero-actions">
                            <StatusBadge state={slip.estado} label={slip.estado_label} />
                            <div className="slip-detail-pdf-actions">
                                <button
                                    type="button"
                                    className="portal-btn portal-btn-light"
                                    onClick={() => setPreviewOpen(true)}
                                >
                                    <PortalIcon name="eye" />
                                    Vista previa PDF
                                </button>
                                <a className="portal-btn portal-btn-primary" href={`${pdfUrl}?download=1`}><PortalIcon name="download" />Descargar PDF</a>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="portal-card slip-detail-timeline" aria-label="Avance de la papeleta">
                    <div className="slip-detail-progress-wrap" ref={progressRef}><ol
                        className="portal-progress"
                        aria-label="Avance de la papeleta"
                    >
                        {stages.map((state, index) => (
                            <li
                                key={state}
                                className={
                                    `slip-detail-stage ${index === stage ? "current" : index < stage ? "done" : ""}`
                                }
                                aria-current={
                                    index === stage ? "step" : undefined
                                }
                            >
                                <span className="slip-detail-marker">{index < stage ? "✓" : index + 1}</span>
                                {index < stages.length - 1 && <i className="slip-detail-connector" aria-hidden="true" />}
                                <strong>{stageLabels[index]}</strong>
                                {stageDates[index] && <small>{formatTimestamp(stageDates[index]!)}</small>}
                            </li>
                        ))}
                    </ol></div>
                    {slip.estado === "rejected" && (
                        <p className="portal-error mx-6">
                            La papeleta fue rechazada. Revisa el motivo en el
                            historial antes de corregirla.
                        </p>
                    )}
                </section>
                <div className="portal-detail-grid slip-detail-content">
                    <div className="portal-stack">
                        <section className="portal-card slip-detail-panel">
                            <div className="portal-card-head slip-detail-section-head">
                                <span className="slip-detail-section-icon"><PortalIcon name="file" /></span>
                                <div>
                                    <h2>Información de la solicitud</h2>
                                    <p>
                                        Datos del solicitante y autorización de
                                        salida.
                                    </p>
                                </div>
                            </div>
                            <div className="portal-card-body">
                                <dl className="portal-data-grid">
                                    {([
                                        ["Solicitante", slip.apellidos_nombres, "user"],
                                        ["Cargo", slip.designado, "folder"],
                                        ["Fecha autorizada", formatDate(slip.fecha_autorizada), "clock"],
                                        ["Horario solicitado", slip.hora_desde ? `${slip.hora_desde} — ${slip.hora_hasta || ""}` : "Sin horario especificado", "clock"],
                                        ["Motivo", slip.motivo_label, "file"],
                                        ["Detalle del motivo", slip.motivo_detalle, "edit"],
                                    ] as const).map(([label, value, icon]) => (
                                        <div key={label} className={label === "Motivo" || label === "Detalle del motivo" ? "portal-data-wide" : ""}>
                                            <span className="slip-detail-field-icon"><PortalIcon name={icon} /></span>
                                            <span><dt>{label}</dt><dd>{value || "—"}</dd></span>
                                        </div>
                                    ))}
                                </dl>
                                <p className="slip-detail-note"><PortalIcon name="check" />Puedes consultar esta papeleta y su historial en cualquier momento.</p>
                                {Object.keys(form.errors).length > 0 &&
                                    !rejectOpen && (
                                        <div
                                            className="portal-error"
                                            role="alert"
                                        >
                                            {Object.values(form.errors).join(
                                                " ",
                                            )}
                                        </div>
                                    )}
                                <div className="portal-actions">
                                    {can.update && (
                                        <Link
                                            className="portal-btn portal-btn-light"
                                            href={route(
                                                "exit-slips.edit",
                                                slip.id,
                                            )}
                                        >
                                            <PortalIcon name="edit" />
                                            Editar papeleta
                                        </Link>
                                    )}
                                    {can.submit && (
                                        <button
                                            disabled={form.processing}
                                            className="portal-btn portal-btn-primary"
                                            onClick={() => transition("submit")}
                                        >
                                            <PortalIcon name="send" />
                                            Enviar a mi jefe
                                        </button>
                                    )}
                                    {can.submit_to_hr && (
                                        <button
                                            disabled={form.processing}
                                            className="portal-btn portal-btn-primary"
                                            onClick={() =>
                                                transition("submit_to_hr")
                                            }
                                        >
                                            <PortalIcon name="send" />
                                            Enviar a RRHH
                                        </button>
                                    )}
                                    {can.submit_to_security && (
                                        <button
                                            disabled={form.processing}
                                            className="portal-btn portal-btn-primary"
                                            onClick={() => transition("submit_to_security")}
                                        >
                                            <PortalIcon name="send" />
                                            Enviar a Vigilancia
                                        </button>
                                    )}
                                    {can.approve && (
                                        <button
                                            disabled={form.processing}
                                            className="portal-btn portal-btn-primary"
                                            onClick={() =>
                                                transition("approve")
                                            }
                                        >
                                            <PortalIcon name="check" />
                                            Aprobar y firmar
                                        </button>
                                    )}
                                    {can.reject && (
                                        <button
                                            disabled={form.processing}
                                            className="portal-btn portal-btn-danger"
                                            onClick={() => {
                                                form.clearErrors();
                                                setRejectOpen(true);
                                            }}
                                        >
                                            Rechazar solicitud
                                        </button>
                                    )}
                                    {can.revert && (
                                        <button
                                            disabled={form.processing}
                                            className="portal-btn portal-btn-primary"
                                            onClick={() => transition("revert")}
                                        >
                                            <PortalIcon name="edit" />
                                            Volver a borrador para corregir
                                        </button>
                                    )}
                                    {!Object.values(can).some(Boolean) && (
                                        <p className="text-xs text-slate-500">
                                            Puedes consultar esta papeleta y su
                                            historial.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </section>
                        {(can.security ||
                            slip.hora_salida ||
                            slip.estado === "submitted_to_security" ||
                            slip.estado === "completed") && (
                            <section className="portal-card slip-detail-panel">
                                <div className="portal-card-head slip-detail-section-head">
                                    <span className="slip-detail-section-icon security"><PortalIcon name="shield" /></span>
                                    <div>
                                        <h2>Control de vigilancia</h2>
                                        <p>
                                            Registro de movimientos del
                                            personal.
                                        </p>
                                    </div>
                                </div>
                                <div className="portal-card-body">
                                    <dl className="portal-data-grid">
                                        <div>
                                            <span className="slip-detail-field-icon"><PortalIcon name="send" /></span><span>
                                            <dt>Salida registrada</dt>
                                            <dd>
                                                {slip.hora_salida ||
                                                    "Pendiente"}
                                            </dd>
                                            </span>
                                        </div>
                                        <div>
                                            <span className="slip-detail-field-icon"><PortalIcon name="arrow" /></span><span>
                                            <dt>Retorno registrado</dt>
                                            <dd>
                                                {slip.hora_retorno 
                                                    ? slip.hora_retorno 
                                                    : (slip.estado === 'completed' ? "Sin retorno" : "Pendiente")}
                                            </dd>
                                            </span>
                                        </div>
                                        {slip.observaciones && (
                                            <div className="portal-data-wide">
                                                <span className="slip-detail-field-icon"><PortalIcon name="edit" /></span><span>
                                                <dt>Observaciones</dt>
                                                <dd>{slip.observaciones}</dd>
                                                </span>
                                            </div>
                                        )}
                                    </dl>
                                    {can.security && (
                                        <form
                                            className="mt-6 space-y-4"
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                transition("security");
                                            }}
                                        >
                                            <div className="flex gap-4">
                                                <div className="portal-field flex-1">
                                                    <label htmlFor="hora_salida">Hora de Salida</label>
                                                    <input
                                                        type="time"
                                                        id="hora_salida"
                                                        required
                                                        value={form.data.hora_salida}
                                                        onChange={e => form.setData("hora_salida", e.target.value)}
                                                    />
                                                </div>
                                                <div className="portal-field flex-1">
                                                    <label htmlFor="hora_retorno">Hora de Retorno</label>
                                                    <input
                                                        type="time"
                                                        id="hora_retorno"
                                                        required={!noReturn}
                                                        disabled={noReturn}
                                                        value={form.data.hora_retorno}
                                                        onChange={e => form.setData("hora_retorno", e.target.value)}
                                                    />
                                                    <label 
                                                        className={`flex items-center justify-between gap-3 mt-3 p-3 rounded-lg border cursor-pointer transition-colors ${noReturn ? 'bg-teal-50 border-teal-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className={`text-sm font-semibold ${noReturn ? 'text-teal-800' : 'text-slate-700'}`}>
                                                                Sin retorno
                                                            </span>
                                                            <span className="text-xs text-slate-500">
                                                                Marcar si no regresará hoy a la entidad
                                                            </span>
                                                        </div>
                                                        <div className={`relative w-10 h-5 rounded-full transition-colors ${noReturn ? 'bg-teal-600' : 'bg-slate-300'}`}>
                                                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${noReturn ? 'left-5' : 'left-0.5'}`} />
                                                        </div>
                                                        <input 
                                                            type="checkbox" 
                                                            checked={noReturn}
                                                            onChange={(e) => {
                                                                setNoReturn(e.target.checked);
                                                                if (e.target.checked) form.setData("hora_retorno", "");
                                                            }}
                                                            className="sr-only"
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                            <div className="portal-field">
                                                <label htmlFor="observaciones">
                                                    Observaciones del movimiento
                                                    (opcional)
                                                </label>
                                                <textarea
                                                    id="observaciones"
                                                    maxLength={2000}
                                                    rows={3}
                                                    value={
                                                        form.data.observaciones
                                                    }
                                                    onChange={(e) =>
                                                        form.setData(
                                                            "observaciones",
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </div>
                                            <button
                                                className="portal-btn portal-btn-primary"
                                                disabled={
                                                    form.processing ||
                                                    today !==
                                                        slip.fecha_autorizada
                                                }
                                            >
                                                <PortalIcon name="check" />
                                                Finalizar y Firmar Control
                                            </button>
                                            {today !==
                                                slip.fecha_autorizada && (
                                                <p className="text-xs text-slate-500">
                                                    El registro se habilita en
                                                    la fecha autorizada.
                                                </p>
                                            )}
                                        </form>
                                    )}
                                </div>
                            </section>
                        )}
                    </div>
                    <aside className="portal-card self-start slip-detail-panel slip-detail-history">
                        <div className="portal-card-head slip-detail-section-head">
                            <span className="slip-detail-section-icon history"><PortalIcon name="clock" /></span>
                            <div>
                                <h2>Historial de actividad</h2>
                                <p>Seguimiento de cada etapa.</p>
                            </div>
                        </div>
                        {history.length ? (
                            <ol className="portal-timeline">
                                {history.map((item) => (
                                    <li key={item.id}>
                                        <span className="slip-detail-history-icon"><PortalIcon name={historyIcons[item.estado_destino] || "file"} /></span>
                                        <span className="slip-detail-history-entry">
                                            <strong>{statuses[item.estado_destino] || item.estado_destino}</strong>
                                            <small>{item.actor ? `${item.actor.nombres} ${item.actor.apellidos}` : "Usuario no disponible"}</small>
                                            <small>{formatTimestamp(item.created_at)}</small>
                                            {item.comentario && <p>{item.comentario}</p>}
                                        </span>
                                        <span className="slip-detail-history-badge">{item.estado_destino === "rejected" ? "Rechazado" : "Completado"}</span>
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <div className="portal-empty">
                                <PortalIcon name="clock" />
                                <p>
                                    Los movimientos aparecerán cuando se envíe
                                    la solicitud.
                                </p>
                            </div>
                        )}
                    </aside>
                </div>
                <aside className="portal-tip">
                    <PortalIcon name="shield" />
                    <p>
                        Las firmas se incorporan al aprobar. Si necesitas
                        registrar o actualizar tu firma, visita{" "}
                        <Link href={route("profile.edit")}>
                            Mi perfil y firma
                        </Link>
                        .
                    </p>
                </aside>
            </div>
            <Modal
                show={rejectOpen}
                onClose={() => !form.processing && setRejectOpen(false)}
                maxWidth="lg"
            >
                <form
                    className="portal-modal"
                    onSubmit={(e) => {
                        e.preventDefault();
                        transition("reject");
                    }}
                >
                    <div className="portal-modal-head">
                        <div>
                            <DialogTitle>Rechazar solicitud</DialogTitle>
                            <p>Indica qué debe corregir el solicitante.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setRejectOpen(false)}
                            aria-label="Cerrar"
                            disabled={form.processing}
                        >
                            ×
                        </button>
                    </div>
                    <label htmlFor="comentario" className="text-sm">
                        Motivo del rechazo
                    </label>
                    <textarea
                        id="comentario"
                        className="mt-2"
                        required
                        maxLength={2000}
                        rows={4}
                        value={form.data.comentario}
                        onChange={(e) =>
                            form.setData("comentario", e.target.value)
                        }
                    />
                    {Object.values(form.errors).length > 0 && (
                        <p className="portal-error" role="alert">
                            {Object.values(form.errors).join(" ")}
                        </p>
                    )}
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            className="portal-btn portal-btn-light"
                            disabled={form.processing}
                            onClick={() => setRejectOpen(false)}
                        >
                            Cancelar
                        </button>
                        <button
                            className="portal-btn portal-btn-danger"
                            disabled={form.processing}
                        >
                            Confirmar rechazo
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal de Vista Previa de Papeleta PDF */}
            <ExitSlipPdfModal
                isOpen={previewOpen}
                onClose={() => setPreviewOpen(false)}
                pdfUrl={pdfUrl}
                slipCode={slip.codigo}
                solicitante={slip.apellidos_nombres}
                fechaAutorizada={formatDate(slip.fecha_autorizada)}
                estado={slip.estado}
                estadoLabel={slip.estado_label}
            />
        </AuthenticatedLayout>
    );
}
