import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, Link } from "@inertiajs/react";
import { PageProps } from "@/types";
import PortalIcon from "@/Components/PortalIcon";
import UpdateSignatureForm from "@/Pages/Profile/Partials/UpdateSignatureForm";

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
export default function Form({
    auth,
    exitSlip,
}: PageProps<{ exitSlip?: SlipForm }>) {
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
        fecha_emision: exitSlip?.fecha_emision || today,
        designado: exitSlip?.designado || auth.user.cargo_designado || "",
        motivo_salida: exitSlip?.motivo_salida || "personal",
        motivo_detalle: exitSlip?.motivo_detalle || "",
        fecha_autorizada: exitSlip?.fecha_autorizada || today,
        hora_desde: exitSlip?.hora_desde?.slice(0, 5) || "",
        hora_hasta: exitSlip?.hora_hasta?.slice(0, 5) || "",
    });
    const { data, setData, processing, errors } = form;
    return (
        <AuthenticatedLayout
            header={<h1>{exitSlip ? "Editar borrador" : "Nueva papeleta"}</h1>}
        >
            <Head title={exitSlip ? "Editar papeleta" : "Nueva papeleta"} />
            <div className="portal-stack">
                <Link
                    href={route("exit-slips.index")}
                    className="portal-row-link"
                >
                    ← Volver a la bandeja
                </Link>
                <section className="portal-hero">
                    <div>
                        <p className="portal-hero-eyebrow">
                            SOLICITUD DE AUTORIZACIÓN
                        </p>
                        <h2>Tu próxima salida, en orden.</h2>
                        <p>
                            Completa los datos, revisa el borrador y envíalo a
                            tu jefe para su aprobación.
                        </p>
                    </div>
                    <PortalIcon name="file" />
                </section>
                <div className="portal-detail-grid">
                    <form
                        className="portal-card"
                        onSubmit={(e) => {
                            e.preventDefault();
                            exitSlip?.id
                                ? form.put(
                                      route("exit-slips.update", exitSlip.id),
                                  )
                                : form.post(route("exit-slips.store"));
                        }}
                    >
                        <div className="portal-card-body">
                            <div className="portal-section-title">
                                <span>01</span>
                                <div>
                                    <h2>Datos de la solicitud</h2>
                                    <p>
                                        La información se reflejará en tu
                                        papeleta.
                                    </p>
                                </div>
                            </div>
                            <div className="portal-form-grid">
                                <div className="portal-field">
                                    <label htmlFor="tipo_plantilla">
                                        Tipo de papeleta
                                    </label>
                                    <select
                                        id="tipo_plantilla"
                                        value={data.tipo_plantilla}
                                        onChange={(e) =>
                                            setData(
                                                "tipo_plantilla",
                                                e.target.value,
                                            )
                                        }
                                    >
                                        <option value="practitioner">
                                            Practicante
                                        </option>
                                        <option value="worker">
                                            Personal nombrado / contratado
                                        </option>
                                    </select>
                                </div>
                                <div className="portal-field">
                                    <label htmlFor="fecha_emision">
                                        Fecha de emisión
                                    </label>
                                    <input
                                        id="fecha_emision"
                                        type="date"
                                        required
                                        value={data.fecha_emision}
                                        onChange={(e) =>
                                            setData(
                                                "fecha_emision",
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div className="portal-field portal-data-wide">
                                    <label htmlFor="designado">
                                        Cargo o designación
                                    </label>
                                    <input
                                        id="designado"
                                        required
                                        maxLength={255}
                                        value={data.designado}
                                        onChange={(e) =>
                                            setData("designado", e.target.value)
                                        }
                                        placeholder="Indica tu cargo actual"
                                    />
                                </div>
                            </div>
                            <div className="portal-section-title mt-8">
                                <span>02</span>
                                <div>
                                    <h2>Motivo y horario</h2>
                                    <p>
                                        Indica cuándo y por qué necesitas salir.
                                    </p>
                                </div>
                            </div>
                            <div className="portal-form-grid">
                                <div className="portal-field">
                                    <label htmlFor="motivo_salida">
                                        Motivo de salida
                                    </label>
                                    <select
                                        id="motivo_salida"
                                        value={data.motivo_salida}
                                        onChange={(e) =>
                                            setData(
                                                "motivo_salida",
                                                e.target.value,
                                            )
                                        }
                                    >
                                        <option value="personal">
                                            Asuntos personales
                                        </option>
                                        <option value="essalud">
                                            Salud (EsSalud)
                                        </option>
                                        <option value="commission">
                                            Comisión de servicio
                                        </option>
                                        <option value="other">
                                            Otro motivo
                                        </option>
                                    </select>
                                </div>
                                <div className="portal-field">
                                    <label htmlFor="fecha_autorizada">
                                        Fecha autorizada
                                    </label>
                                    <input
                                        id="fecha_autorizada"
                                        type="date"
                                        min={today}
                                        required
                                        value={data.fecha_autorizada}
                                        onChange={(e) =>
                                            setData(
                                                "fecha_autorizada",
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div className="portal-field portal-data-wide">
                                    <label htmlFor="motivo_detalle">
                                        Detalle del motivo
                                    </label>
                                    <textarea
                                        id="motivo_detalle"
                                        rows={4}
                                        required
                                        maxLength={2000}
                                        placeholder="Describe brevemente el motivo de tu salida…"
                                        value={data.motivo_detalle}
                                        onChange={(e) =>
                                            setData(
                                                "motivo_detalle",
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <p className="mt-2 text-right text-xs text-slate-400">
                                        {data.motivo_detalle.length} / 2000
                                    </p>
                                </div>
                                <div className="portal-field">
                                    <label htmlFor="hora_desde">
                                        Salida prevista (opcional)
                                    </label>
                                    <input
                                        id="hora_desde"
                                        type="time"
                                        required={!!data.hora_hasta}
                                        value={data.hora_desde}
                                        onChange={(e) =>
                                            setData(
                                                "hora_desde",
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div className="portal-field">
                                    <label htmlFor="hora_hasta">
                                        Retorno previsto (opcional)
                                    </label>
                                    <input
                                        id="hora_hasta"
                                        type="time"
                                        required={!!data.hora_desde}
                                        min={data.hora_desde || undefined}
                                        value={data.hora_hasta}
                                        onChange={(e) =>
                                            setData(
                                                "hora_hasta",
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                            </div>
                            {Object.values(errors).length > 0 && (
                                <div className="portal-error" role="alert">
                                    {Object.values(errors).map(
                                        (error, index) => (
                                            <p key={index}>{error}</p>
                                        ),
                                    )}
                                </div>
                            )}
                            <div className="portal-actions justify-end">
                                <Link
                                    className="portal-btn portal-btn-light"
                                    href={route("exit-slips.index")}
                                >
                                    Cancelar
                                </Link>
                                <button
                                    className="portal-btn portal-btn-primary"
                                    disabled={processing}
                                >
                                    <PortalIcon name="check" />
                                    {processing
                                        ? "Guardando…"
                                        : exitSlip
                                          ? "Guardar cambios"
                                          : "Guardar borrador"}
                                </button>
                            </div>
                        </div>
                    </form>
                    <aside className="portal-stack">
                        <section className="portal-card">
                            <div className="portal-card-body portal-signature">
                                <UpdateSignatureForm />
                            </div>
                        </section>
                        <div className="portal-tip">
                            <PortalIcon name="shield" />
                            <p>
                                Al guardar podrás revisar la vista previa PDF.
                                Tu solicitud se enviará cuando selecciones
                                «Enviar a mi jefe».
                            </p>
                        </div>
                    </aside>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
