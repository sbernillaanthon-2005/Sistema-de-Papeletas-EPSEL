import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PortalIcon from "@/Components/PortalIcon";
import PortalHeroCopy from "@/Components/PortalHeroCopy";
import { Head, router, useForm } from "@inertiajs/react";
import { FormEvent, useMemo, useRef, useState } from "react";
import formatsBanner from "../../../../images/banner-formatos-agua-mascota-fullbleed.png";

type Format = {
    id: number;
    name: string;
    original_name: string;
    size_bytes: number;
    is_active: boolean;
    created_at: string | null;
    uploaded_by: string;
};

type Props = {
    formats: Format[];
    baseAvailable: boolean;
    currentPreviewUrl: string;
};

const formatBytes = (bytes: number) => {
    if (!bytes) return "0 KB";
    return bytes < 1024 * 1024
        ? `${Math.ceil(bytes / 1024)} KB`
        : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const formatDate = (value: string | null) => value
    ? new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Lima" }).format(new Date(value))
    : "Formato del sistema";

export default function Index({ formats, baseAvailable, currentPreviewUrl }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [showUpload, setShowUpload] = useState(false);
    const [editingFormat, setEditingFormat] = useState<Format | null>(null);
    const [previewVersion, setPreviewVersion] = useState(0);
    const upload = useForm<{ name: string; format: File | null; activate: boolean }>({
        name: "",
        format: null,
        activate: true,
    });
    const activeFormat = useMemo(() => formats.find((format) => format.is_active), [formats]);

    const closeEditor = () => {
        upload.reset();
        setEditingFormat(null);
        setShowUpload(false);
    };

    const openCreate = () => {
        upload.reset();
        upload.setData("activate", true);
        setEditingFormat(null);
        setShowUpload(true);
    };

    const openEdit = (format: Format) => {
        upload.setData({ name: format.name, format: null, activate: format.is_active });
        setEditingFormat(format);
        setShowUpload(true);
    };

    const replaceBaseFormat = () => {
        upload.setData({ name: "Autorización de salida para practicantes", format: null, activate: true });
        setEditingFormat(null);
        setShowUpload(true);
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        const options = {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                closeEditor();
                setPreviewVersion((version) => version + 1);
            },
        };

        if (editingFormat) {
            upload.put(route("admin.exit-slip-formats.update", editingFormat.id), options);
        } else {
            upload.post(route("admin.exit-slip-formats.store"), options);
        }
    };

    return (
        <AuthenticatedLayout header={<h1>Formatos de papeleta</h1>}>
            <Head title="Formatos de papeleta" />
            <div className="portal-stack formats-page">
                <section className="portal-hero formats-hero">
                    <img className="formats-hero-background" src={formatsBanner} alt="" aria-hidden="true" />
                    <PortalHeroCopy className="formats-hero-content" eyebrow="GESTIÓN DOCUMENTAL" lead="El formato que ve" accent="todo el personal." description="Publica un PDF de referencia, revísalo y mantén una única versión vigente para las papeletas.">
                        <div className="formats-hero-status">
                            <span><i /> {activeFormat ? "Formato personalizado activo" : baseAvailable ? "Formato operativo del sistema" : "Sin formato publicado"}</span>
                            <span><PortalIcon name="users" /> Disponible para todos los usuarios</span>
                        </div>
                    </PortalHeroCopy>
                    <button type="button" className="portal-btn portal-btn-white" onClick={openCreate}>
                        <PortalIcon name="plus" />
                        Subir nuevo formato
                    </button>
                </section>

                {showUpload && (
                    <section className="portal-card formats-upload-card">
                        <div className="formats-section-head">
                            <div><span>{editingFormat ? "EDITAR VERSIÓN" : "PUBLICAR UNA VERSIÓN"}</span><h2>{editingFormat ? "Actualiza el formato seleccionado" : "Sube un PDF para revisión"}</h2><p>{editingFormat ? "Cambia el nombre o reemplaza el PDF. El archivo actual se mantiene si no eliges otro." : "Solo al activarlo será la versión visible para el personal."}</p></div>
                            <button type="button" className="formats-close" onClick={closeEditor} aria-label="Cerrar editor"><PortalIcon name="close" /></button>
                        </div>
                        <form className="formats-upload-form" onSubmit={submit}>
                            <label className="formats-field">
                                <span>Nombre de la versión</span>
                                <input value={upload.data.name} maxLength={120} placeholder="Ej.: Formato de salida — octubre 2026" onChange={(event) => upload.setData("name", event.target.value)} required />
                                {upload.errors.name && <small className="formats-error">{upload.errors.name}</small>}
                            </label>
                            <div className="formats-file-field">
                                <input ref={inputRef} id="exit-slip-format" type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(event) => upload.setData("format", event.target.files?.[0] || null)} />
                                <button type="button" className="formats-file-picker" onClick={() => inputRef.current?.click()}>
                                    <PortalIcon name="file" />
                                    <span><strong>{upload.data.format?.name || (editingFormat ? "Conservar PDF actual" : "Selecciona el archivo PDF")}</strong><small>{upload.data.format ? formatBytes(upload.data.format.size) : editingFormat ? "Opcional: reemplaza el archivo actual" : "Máximo 10 MB"}</small></span>
                                </button>
                                {upload.errors.format && <small className="formats-error">{upload.errors.format}</small>}
                            </div>
                            {!editingFormat && <label className="formats-activate-toggle">
                                <input type="checkbox" checked={upload.data.activate} onChange={(event) => upload.setData("activate", event.target.checked)} />
                                <span><strong>Activar al publicar</strong><small>Reemplazará la versión que los usuarios ven actualmente.</small></span>
                            </label>}
                            <div className="formats-upload-actions">
                                <button type="button" className="portal-btn portal-btn-light" onClick={closeEditor}>Cancelar</button>
                                <button className="portal-btn portal-btn-primary" disabled={upload.processing || (!editingFormat && !upload.data.format)}>{upload.processing ? "Guardando..." : editingFormat ? "Guardar cambios" : "Guardar formato"}</button>
                            </div>
                        </form>
                    </section>
                )}

                <section className="formats-workspace">
                    <article className="portal-card formats-preview-card">
                        <div className="formats-section-head">
                            <div><span>VISTA PREVIA</span><h2>{activeFormat?.name || (baseAvailable ? "Autorización de salida para practicantes" : "No hay un formato publicado")}</h2><p>{activeFormat ? activeFormat.original_name : baseAvailable ? "Autorizacion_salida_practicante_EPSEL.pdf · Formato base vigente del sistema." : "Publica una nueva versión para que el personal pueda consultarla."}</p></div>
                            <div className="formats-preview-actions">
                                {activeFormat ? <button type="button" className="portal-btn portal-btn-light" onClick={() => openEdit(activeFormat)}><PortalIcon name="edit" /> Editar</button> : baseAvailable ? <button type="button" className="portal-btn portal-btn-light" onClick={replaceBaseFormat}><PortalIcon name="edit" /> Editar</button> : null}
                                {activeFormat ? <button type="button" className="formats-delete formats-current-delete" onClick={() => { if (window.confirm(`¿Eliminar el formato “${activeFormat.name}”?${baseAvailable ? " Se restaurará el formato base del sistema." : ""}`)) router.delete(route("admin.exit-slip-formats.destroy", activeFormat.id), { preserveScroll: true, onSuccess: () => setPreviewVersion((version) => version + 1) }); }}><PortalIcon name="trash" /> Eliminar</button> : baseAvailable ? <button type="button" className="formats-delete formats-current-delete" onClick={() => { if (window.confirm("¿Eliminar el formato base? El personal verá un aviso hasta que publiques una nueva versión.")) router.delete(route("admin.exit-slip-formats.destroy-base"), { preserveScroll: true, onSuccess: () => setPreviewVersion((version) => version + 1) }); }}><PortalIcon name="trash" /> Eliminar</button> : null}
                                {activeFormat || baseAvailable ? <a className="portal-btn portal-btn-light formats-open-preview" href={currentPreviewUrl} target="_blank" rel="noreferrer"><PortalIcon name="arrow" /> Abrir</a> : <button type="button" className="portal-btn portal-btn-primary" onClick={openCreate}><PortalIcon name="plus" /> Publicar formato</button>}
                            </div>
                        </div>
                        {activeFormat || baseAvailable ? <div className="formats-pdf-frame"><iframe key={previewVersion} src={currentPreviewUrl} title="Vista previa del formato de papeleta vigente" /></div> : <div className="formats-unpublished"><PortalIcon name="alert" /><strong>Actualmente no hay una papeleta disponible.</strong><p>El personal verá un mensaje de actualización hasta que publiques una nueva versión.</p><button type="button" className="portal-btn portal-btn-primary" onClick={openCreate}><PortalIcon name="plus" /> Subir nueva versión</button></div>}
                    </article>
                    <aside className="formats-guidance">
                        <span className="formats-guidance-icon"><PortalIcon name="shield" /></span>
                        <h2>Publicación segura</h2>
                        <p>La vista previa muestra siempre el formato activo. El archivo se conserva en almacenamiento privado y cada cambio queda auditado.</p>
                        <ul>
                            <li><span className="formats-guidance-item-icon"><PortalIcon name="file" /></span><span>Sube únicamente documentos PDF.</span></li>
                            <li><span className="formats-guidance-item-icon"><PortalIcon name="eye" /></span><span>Verifica la vista previa antes de activar.</span></li>
                            <li><span className="formats-guidance-item-icon"><PortalIcon name="clock" /></span><span>Conserva una sola versión vigente.</span></li>
                        </ul>
                    </aside>
                </section>

                <section className="portal-card formats-history">
                    <div className="formats-section-head">
                        <div><span>HISTORIAL DE VERSIONES</span><h2>Formatos cargados</h2><p>Activa una versión cuando el documento esté listo para el personal.</p></div>
                        <span className="portal-badge">{formats.length} {formats.length === 1 ? "formato" : "formatos"}</span>
                    </div>
                    {formats.length ? <div className="formats-list">
                        {formats.map((format) => <article className={`formats-row ${format.is_active ? "is-active" : ""}`} key={format.id}>
                            <span className="formats-row-icon"><PortalIcon name="file" /></span>
                            <div className="formats-row-main"><strong>{format.name}</strong><span>{format.original_name} · {formatBytes(format.size_bytes)}</span></div>
                            <div className="formats-row-meta"><span>{formatDate(format.created_at)}</span><small>Por {format.uploaded_by || "Administración"}</small></div>
                            <div className="formats-row-actions">
                                {format.is_active ? <span className="formats-active-badge"><PortalIcon name="check" /> Activo</span> : <button className="portal-btn portal-btn-light" onClick={() => router.put(route("admin.exit-slip-formats.activate", format.id), {}, { preserveScroll: true, onSuccess: () => setPreviewVersion((version) => version + 1) })}>Activar</button>}
                                <button className="portal-btn portal-btn-light" onClick={() => openEdit(format)}><PortalIcon name="edit" /> Editar</button>
                                <button className="formats-delete" aria-label={`Eliminar ${format.name}`} onClick={() => { if (window.confirm(`¿Eliminar el formato “${format.name}”?${format.is_active ? " Se restaurará el formato base del sistema." : ""}`)) router.delete(route("admin.exit-slip-formats.destroy", format.id), { preserveScroll: true, onSuccess: () => setPreviewVersion((version) => version + 1) }); }}><PortalIcon name="close" /></button>
                            </div>
                        </article>)}
                    </div> : <div className="formats-empty"><PortalIcon name="file" /><strong>Aún no hay formatos personalizados.</strong><p>El personal ve el formato operativo actual del sistema.</p></div>}
                </section>
            </div>
        </AuthenticatedLayout>
    );
}
