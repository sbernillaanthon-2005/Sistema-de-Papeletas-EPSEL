import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { PageProps } from "@/types";
import { useState } from "react";
import { DialogTitle } from "@headlessui/react";
import Modal from "@/Components/Modal";
import PortalIcon from "@/Components/PortalIcon";
import { StatusBadge, formatDate } from "@/Components/PortalUI";
import { statuses } from "@/types/exit-slip";

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
    const transition = (action: string) =>
        form.post(
            route("exit-slips.transition", { exitSlip: slip.id, action }),
            { preserveScroll: true, onSuccess: () => setRejectOpen(false) },
        );
    const stage = stages.indexOf(slip.estado);
    const today = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Lima",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());
    return (
        <AuthenticatedLayout header={<h1>Detalle de papeleta</h1>}>
            <Head title={slip.codigo} />
            <div className="portal-stack">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link
                        className="portal-row-link"
                        href={route("exit-slips.index")}
                    >
                        ← Volver a la bandeja
                    </Link>
                    <a
                        className="portal-btn portal-btn-light"
                        href={route("exit-slips.pdf", slip.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <PortalIcon name="download" />
                        Vista previa PDF
                    </a>
                </div>
                <section className="portal-card">
                    <div className="portal-card-head">
                        <div>
                            <h2>{slip.codigo}</h2>
                            <p>Emitida el {formatDate(slip.fecha_emision)}</p>
                        </div>
                        <StatusBadge
                            state={slip.estado}
                            label={slip.estado_label}
                        />
                    </div>
                    <ol
                        className="portal-progress"
                        aria-label="Avance de la papeleta"
                    >
                        {stages.map((state, index) => (
                            <li
                                key={state}
                                className={
                                    index === stage
                                        ? "current"
                                        : index < stage
                                          ? "done"
                                          : ""
                                }
                                aria-current={
                                    index === stage ? "step" : undefined
                                }
                            >
                                <span>{index < stage ? "✓" : index + 1}</span>
                                {stageLabels[index]}
                            </li>
                        ))}
                    </ol>
                    {slip.estado === "rejected" && (
                        <p className="portal-error mx-6">
                            La papeleta fue rechazada. Revisa el motivo en el
                            historial antes de corregirla.
                        </p>
                    )}
                </section>
                <div className="portal-detail-grid">
                    <div className="portal-stack">
                        <section className="portal-card">
                            <div className="portal-card-head">
                                <div>
                                    <h2>Información de la solicitud</h2>
                                    <p>
                                        Datos del solicitante y autorización de
                                        salida.
                                    </p>
                                </div>
                                <PortalIcon name="file" />
                            </div>
                            <div className="portal-card-body">
                                <dl className="portal-data-grid">
                                    {[
                                        ["Solicitante", slip.apellidos_nombres],
                                        ["Cargo", slip.designado],
                                        [
                                            "Fecha autorizada",
                                            formatDate(slip.fecha_autorizada),
                                        ],
                                        [
                                            "Horario solicitado",
                                            slip.hora_desde
                                                ? `${slip.hora_desde} — ${slip.hora_hasta}`
                                                : "Sin horario especificado",
                                        ],
                                        ["Motivo", slip.motivo_label],
                                        [
                                            "Detalle del motivo",
                                            slip.motivo_detalle,
                                        ],
                                    ].map(([label, value]) => (
                                        <div
                                            key={label}
                                            className={
                                                label === "Detalle del motivo"
                                                    ? "portal-data-wide"
                                                    : ""
                                            }
                                        >
                                            <dt>{label}</dt>
                                            <dd>{value || "—"}</dd>
                                        </div>
                                    ))}
                                </dl>
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
                                            Editar borrador
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
                            <section className="portal-card">
                                <div className="portal-card-head">
                                    <div>
                                        <h2>Control de vigilancia</h2>
                                        <p>
                                            Registro de movimientos del
                                            personal.
                                        </p>
                                    </div>
                                    <PortalIcon name="shield" />
                                </div>
                                <div className="portal-card-body">
                                    <dl className="portal-data-grid">
                                        <div>
                                            <dt>Salida registrada</dt>
                                            <dd>
                                                {slip.hora_salida ||
                                                    "Pendiente"}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt>Retorno registrado</dt>
                                            <dd>
                                                {slip.hora_retorno ||
                                                    "Pendiente"}
                                            </dd>
                                        </div>
                                        {slip.observaciones && (
                                            <div className="portal-data-wide">
                                                <dt>Observaciones</dt>
                                                <dd>{slip.observaciones}</dd>
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
                                                        required
                                                        value={form.data.hora_retorno}
                                                        onChange={e => form.setData("hora_retorno", e.target.value)}
                                                    />
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
                    <aside className="portal-card self-start">
                        <div className="portal-card-head">
                            <div>
                                <h2>Historial de actividad</h2>
                                <p>Seguimiento de cada etapa.</p>
                            </div>
                        </div>
                        {history.length ? (
                            <ol className="portal-timeline">
                                {history.map((item) => (
                                    <li key={item.id}>
                                        <strong>
                                            {statuses[item.estado_destino] ||
                                                item.estado_destino}
                                        </strong>
                                        <small>
                                            {item.actor
                                                ? `${item.actor.nombres} ${item.actor.apellidos}`
                                                : "Usuario no disponible"}
                                        </small>
                                        <small>
                                            {formatDate(item.created_at)} ·{" "}
                                            {new Intl.DateTimeFormat("es-PE", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                timeZone: "America/Lima",
                                            }).format(
                                                new Date(item.created_at),
                                            )}
                                        </small>
                                        {item.comentario && (
                                            <p>{item.comentario}</p>
                                        )}
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
        </AuthenticatedLayout>
    );
}
