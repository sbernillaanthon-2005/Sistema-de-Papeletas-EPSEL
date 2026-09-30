import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import { Transition } from "@headlessui/react";
import { useForm, usePage } from "@inertiajs/react";
import { FormEventHandler, useEffect, useRef, useState } from "react";
import Modal from "@/Components/Modal";
import { DialogTitle } from "@headlessui/react";
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

        // Important: Inertia uses POST with FormData to upload files
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
        } else {
            setData("signature", null);
            setPreview(null);
        }
    };

    return (
        <section className={className}>
            <header className="flex justify-between items-start sm:items-center flex-col sm:flex-row gap-4">
                <div>
                    <h2 className="text-lg font-medium text-gray-900">
                        Firma Digital
                    </h2>

                    <p className="mt-1 text-sm text-gray-600">
                        Actualiza tu firma digital. Esta firma será estampada en
                        las papeletas de salida que generes o apruebes. Por
                        favor, sube una imagen con fondo transparente en formato
                        PNG o JPG.
                    </p>
                </div>
                {!isEditing && (
                    <SecondaryButton onClick={() => setIsEditing(true)}>
                        Actualizar Datos
                    </SecondaryButton>
                )}
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel
                        htmlFor="signature"
                        value="Archivo de Firma (PNG/JPG)"
                    />

                    <input
                        id="signature"
                        ref={fileInputRef}
                        type="file"
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={handleFileChange}
                        disabled={!isEditing}
                    />

                    <InputError message={errors.signature} className="mt-2" />
                </div>

                {preview && (
                    <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-2">
                            Vista previa de nueva firma:
                        </p>
                        <div className="border border-dashed border-gray-300 p-4 rounded-md inline-block">
                            <img
                                src={preview}
                                alt="Vista previa"
                                className="max-h-32 object-contain"
                            />
                        </div>
                    </div>
                )}

                {auth.user.has_signature && !preview && (
                    <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-2">
                            Firma actual:
                        </p>
                        <div className="border border-gray-300 p-4 rounded-md inline-block bg-white">
                            {/* The SignatureController@show serves the file */}
                            <img
                                src={`/signatures/${auth.user.signature_id}`}
                                alt="Firma actual"
                                className="max-h-32 object-contain"
                            />
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-4">
                    {isEditing && (
                        <>
                            <PrimaryButton
                                disabled={processing || !data.signature}
                            >
                                Guardar
                            </PrimaryButton>
                            <SecondaryButton
                                type="button"
                                onClick={() => {
                                    setIsEditing(false);
                                    reset();
                                    setPreview(null);
                                    if (fileInputRef.current)
                                        fileInputRef.current.value = "";
                                }}
                            >
                                Cancelar
                            </SecondaryButton>
                            {auth.user.has_signature && (
                                <button
                                    type="button"
                                    className="portal-btn portal-btn-danger"
                                    disabled={processing}
                                    onClick={() => setConfirmDelete(true)}
                                >
                                    Eliminar firma
                                </button>
                            )}
                        </>
                    )}

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600">Guardado.</p>
                    </Transition>
                </div>
            </form>
            <Modal
                show={confirmDelete}
                onClose={() => !deletion.processing && setConfirmDelete(false)}
                maxWidth="md"
            >
                <div className="portal-modal">
                    <DialogTitle className="text-xl font-semibold">
                        Eliminar mi firma
                    </DialogTitle>
                    <p className="mt-3 text-sm leading-6">
                        Necesitarás cargar otra firma para enviar o aprobar
                        nuevas papeletas. Las firmas de las papeletas ya
                        emitidas se conservarán.
                    </p>
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            className="portal-btn portal-btn-light"
                            disabled={deletion.processing}
                            onClick={() => setConfirmDelete(false)}
                        >
                            Cancelar
                        </button>
                        <button
                            className="portal-btn portal-btn-danger"
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
                            Eliminar firma
                        </button>
                    </div>
                </div>
            </Modal>
        </section>
    );
}
