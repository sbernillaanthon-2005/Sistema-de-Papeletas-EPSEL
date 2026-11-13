import InputError from "@/Components/InputError";
import Modal from "@/Components/Modal";
import { DialogTitle } from "@headlessui/react";
import { Transition } from "@headlessui/react";
import { useForm, usePage } from "@inertiajs/react";
import { FormEventHandler, useEffect, useRef, useState } from "react";
import { PageProps } from "@/types";

export default function UpdateSignatureForm({
    className = "",
}: {
    className?: string;
}) {
    const { auth } = usePage<PageProps>().props;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const deletion = useForm({});

    useEffect(
        () => () => {
            if (preview) URL.revokeObjectURL(preview);
        },
        [preview],
    );

    const {
        data,
        setData,
        post,
        processing,
        errors,
        recentlySuccessful,
        reset,
    } = useForm<{
        signature: File | null;
    }>({
        signature: null,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route("signatures.store"), {
            preserveScroll: true,
            onSuccess: () => {
                if (fileInputRef.current) fileInputRef.current.value = "";
                setPreview(null);
                setIsEditing(false);
            },
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData("signature", file);
            setPreview(URL.createObjectURL(file));
            setIsEditing(true);
        } else {
            setData("signature", null);
            setPreview(null);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && (file.type === "image/png" || file.type === "image/jpeg" || file.type === "image/jpg")) {
            setData("signature", file);
            setPreview(URL.createObjectURL(file));
            setIsEditing(true);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        reset();
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <section className={`pp-v2-signature-section ${className}`}>
            <form onSubmit={submit} className="pp-v2-signature-form">
                <input
                    id="signature"
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handleFileChange}
                />

                {/* Signature Document Canvas Preview */}
                <div className="pp-v2-signature-canvas-container">
                    <div className="pp-v2-signature-canvas-header">
                        <div className="pp-v2-canvas-title">
                            <span className="pp-v2-canvas-dot" />
                            <strong>Lienzo de firma para papeleta física/digital</strong>
                        </div>
                        <span className="pp-v2-canvas-badge">
                            {preview ? "Previsualización nueva" : auth.user.has_signature ? "Firma vigente activa" : "Sin firma registrada"}
                        </span>
                    </div>

                    <div className="pp-v2-signature-canvas">
                        {/* Simulation Paper Grid */}
                        <div className="pp-v2-signature-grid-paper">
                            {preview ? (
                                <div className="pp-v2-signature-preview-wrap">
                                    <img
                                        src={preview}
                                        alt="Vista previa de nueva firma"
                                        className="pp-v2-signature-img"
                                    />
                                    <div className="pp-v2-signature-stamp-sim">
                                        <span>NUEVA FIRMA POR GUARDAR</span>
                                    </div>
                                </div>
                            ) : auth.user.has_signature ? (
                                <div className="pp-v2-signature-preview-wrap">
                                    <img
                                        src={`/signatures/${auth.user.signature_id}`}
                                        alt="Firma actual registrada"
                                        className="pp-v2-signature-img"
                                    />
                                    <div className="pp-v2-signature-stamp-valid">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                                            <polyline points="9 12 11 14 15 10" />
                                        </svg>
                                        <span>REGISTRADA EN SISTEMA</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="pp-v2-signature-empty">
                                    <div className="pp-v2-empty-quill">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 17c3-3 4-9 7-9s3 6 6 6 3-3 5-3" />
                                            <path d="M3 21h18" />
                                        </svg>
                                    </div>
                                    <p>Aún no has registrado tu firma digital para el visado de papeletas.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Dropzone / Upload Action */}
                <div
                    className={`pp-v2-dropzone ${isDragging ? "is-dragging" : ""} ${preview ? "has-preview" : ""}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                >
                    <div className="pp-v2-dropzone-icon signature-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                        </svg>
                    </div>
                    <div className="pp-v2-dropzone-text">
                        <strong>{auth.user.has_signature ? "Haz clic aquí para reemplazar tu firma" : "Arrastra o selecciona el archivo de tu firma"}</strong>
                        <span>Recomendamos fondo transparente (PNG) con trazo nítido</span>
                    </div>
                </div>

                <InputError message={errors.signature} className="mt-2" />

                {/* Signature Actions */}
                <div className="pp-v2-signature-actions">
                    {preview ? (
                        <div className="pp-v2-action-group">
                            <button
                                type="submit"
                                disabled={processing || !data.signature}
                                className="pp-v2-btn pp-v2-btn--primary"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                {processing ? "Guardando..." : "Guardar firma oficial"}
                            </button>
                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={processing}
                                className="pp-v2-btn pp-v2-btn--subtle"
                            >
                                Descartar
                            </button>
                        </div>
                    ) : (
                        <div className="pp-v2-action-group">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="pp-v2-btn pp-v2-btn--secondary"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="17 8 12 3 7 8" />
                                    <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                                {auth.user.has_signature ? "Subir nueva firma" : "Seleccionar archivo"}
                            </button>

                            {auth.user.has_signature && (
                                <button
                                    type="button"
                                    onClick={() => setConfirmDelete(true)}
                                    disabled={processing}
                                    className="pp-v2-btn pp-v2-btn--danger-text"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                    Eliminar firma
                                </button>
                            )}
                        </div>
                    )}

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-out duration-300"
                        enterFrom="opacity-0 translate-y-1"
                        enterTo="opacity-100 translate-y-0"
                        leave="transition ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="pp-v2-success-pill">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span>¡Firma registrada con éxito!</span>
                        </div>
                    </Transition>
                </div>
            </form>

            {/* Modal de confirmación para eliminar firma */}
            <Modal
                show={confirmDelete}
                onClose={() => !deletion.processing && setConfirmDelete(false)}
                maxWidth="md"
            >
                <div className="pp-v2-modal-card">
                    <div className="pp-v2-modal-icon danger">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    </div>
                    <DialogTitle className="pp-v2-modal-title">
                        ¿Eliminar firma digital?
                    </DialogTitle>
                    <p className="pp-v2-modal-desc">
                        Al eliminar tu firma no podrás enviar o autorizar papeletas de salida hasta que cargues una nueva. Las papeletas emitidas anteriormente conservarán su firma original.
                    </p>
                    <div className="pp-v2-modal-actions">
                        <button
                            type="button"
                            className="pp-v2-btn pp-v2-btn--subtle"
                            disabled={deletion.processing}
                            onClick={() => setConfirmDelete(false)}
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            className="pp-v2-btn pp-v2-btn--danger"
                            disabled={deletion.processing}
                            onClick={() =>
                                deletion.delete(route("signatures.destroy"), {
                                    preserveScroll: true,
                                    onSuccess: () => {
                                        setConfirmDelete(false);
                                        setIsEditing(false);
                                        reset();
                                        setPreview(null);
                                    },
                                })
                            }
                        >
                            {deletion.processing ? "Eliminando..." : "Sí, eliminar firma"}
                        </button>
                    </div>
                </div>
            </Modal>
        </section>
    );
}
