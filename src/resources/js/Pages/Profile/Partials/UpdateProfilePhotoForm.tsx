import InputError from '@/Components/InputError';
import { Transition } from '@headlessui/react';
import { useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useEffect, useRef, useState } from 'react';
import { Avatar } from '@/Components/PortalUI';
import { PageProps } from '@/types';

export default function UpdateProfilePhotoForm({
    className = '',
}: {
    className?: string;
}) {
    const { auth } = usePage<PageProps>().props;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

    const { data, setData, post, processing, errors, recentlySuccessful, delete: destroy } = useForm<{
        photo: File | null;
    }>({
        photo: null,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        if (data.photo) {
            post(route('profile-photo.update'), {
                preserveScroll: true,
                onSuccess: () => {
                    setPreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                },
            });
        }
    };

    const deletePhoto = () => {
        destroy(route('profile-photo.destroy'), {
            preserveScroll: true,
            onSuccess: () => {
                setPreview(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
            },
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('photo', file);
            setPreview(URL.createObjectURL(file));
        } else {
            setData('photo', null);
            setPreview(null);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg')) {
            setData('photo', file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleCancel = () => {
        setData('photo', null);
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <section className={`pp-v2-photo-section ${className}`}>
            <form onSubmit={submit} className="pp-v2-photo-form">
                <input
                    id="photo"
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handleFileChange}
                />

                {/* Avatar Studio Display */}
                <div className="pp-v2-avatar-studio">
                    <div 
                        className="pp-v2-avatar-halo-wrap"
                        onClick={() => fileInputRef.current?.click()}
                        role="button"
                        tabIndex={0}
                        title="Haz clic para cambiar la foto"
                        onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                    >
                        <Avatar
                            name={`${auth.user.nombres} ${auth.user.apellidos}`}
                            photo={preview || auth.user.profile_photo_url}
                            className="pp-v2-studio-avatar"
                        />
                        <div className="pp-v2-avatar-overlay">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                                <circle cx="12" cy="13" r="3"/>
                            </svg>
                            <span>Cambiar</span>
                        </div>
                    </div>

                    <div className="pp-v2-studio-meta">
                        <div className="pp-v2-studio-status">
                            {preview ? (
                                <span className="pp-v2-pill pp-v2-pill--warning">
                                    <span className="pp-v2-pulse-dot warning" />
                                    Nueva imagen seleccionada
                                </span>
                            ) : auth.user.profile_photo_path ? (
                                <span className="pp-v2-pill pp-v2-pill--success">
                                    <span className="pp-v2-pulse-dot success" />
                                    Foto personalizada activa
                                </span>
                            ) : (
                                <span className="pp-v2-pill pp-v2-pill--neutral">
                                    <span className="pp-v2-pulse-dot neutral" />
                                    Avatar predeterminado
                                </span>
                            )}
                        </div>
                        <h4 className="pp-v2-studio-name">{auth.user.nombres} {auth.user.apellidos}</h4>
                        <p className="pp-v2-studio-tip">Formatos admitidos: PNG, JPG o JPEG (máx. 2MB)</p>
                    </div>
                </div>

                {/* Dropzone / Upload Trigger */}
                <div
                    className={`pp-v2-dropzone ${isDragging ? 'is-dragging' : ''} ${preview ? 'has-preview' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                >
                    <div className="pp-v2-dropzone-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                    </div>
                    <div className="pp-v2-dropzone-text">
                        <strong>Haz clic aquí o arrastra tu foto</strong>
                        <span>Recomendamos una imagen cuadrada con buena iluminación</span>
                    </div>
                </div>

                <InputError message={errors.photo} className="mt-2" />

                {/* Action buttons */}
                <div className="pp-v2-photo-actions">
                    {preview ? (
                        <div className="pp-v2-action-group">
                            <button
                                type="submit"
                                disabled={processing || !data.photo}
                                className="pp-v2-btn pp-v2-btn--primary"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                {processing ? 'Guardando...' : 'Guardar nueva foto'}
                            </button>
                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={processing}
                                className="pp-v2-btn pp-v2-btn--subtle"
                            >
                                Cancelar
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
                                Seleccionar archivo
                            </button>

                            {auth.user.profile_photo_path && (
                                <button
                                    type="button"
                                    onClick={deletePhoto}
                                    disabled={processing}
                                    className="pp-v2-btn pp-v2-btn--danger-text"
                                    title="Quitar foto personalizada y volver a las iniciales"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                    Eliminar foto
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
                            <span>¡Foto actualizada correctamente!</span>
                        </div>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
