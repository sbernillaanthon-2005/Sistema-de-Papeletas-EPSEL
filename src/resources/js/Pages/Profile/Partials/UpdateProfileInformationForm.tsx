import InputError from '@/Components/InputError';
import { Transition } from '@headlessui/react';
import { useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { PageProps } from '@/types';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}: {
    mustVerifyEmail: boolean;
    status?: string;
    className?: string;
}) {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;
    const [isEditing, setIsEditing] = useState(false);

    const { data, setData, patch, errors, processing, recentlySuccessful, reset } =
        useForm({
            nombres: user.nombres,
            apellidos: user.apellidos,
        });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        patch(route('profile.update'), {
            onSuccess: () => setIsEditing(false),
        });
    };

    const handleCancel = () => {
        reset();
        setIsEditing(false);
    };

    return (
        <section className={`pp-v2-info-section ${className}`}>
            <form onSubmit={submit} className="pp-v2-info-form">
                <div className="pp-v2-form-grid">
                    {/* Campo: Nombres */}
                    <div className="pp-v2-field-group">
                        <label htmlFor="nombres" className="pp-v2-label">
                            <span className="pp-v2-label-text">Nombres</span>
                            {isEditing && <span className="pp-v2-label-badge">Obligatorio</span>}
                        </label>
                        <div className="pp-v2-input-wrapper">
                            <div className="pp-v2-input-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                                </svg>
                            </div>
                            <input
                                id="nombres"
                                type="text"
                                className={`pp-v2-input ${errors.nombres ? 'has-error' : ''}`}
                                value={data.nombres}
                                onChange={(e) => setData('nombres', e.target.value)}
                                required
                                disabled={!isEditing}
                                autoComplete="name"
                                placeholder="Ingresa tus nombres"
                            />
                        </div>
                        <InputError className="mt-1" message={errors.nombres} />
                    </div>

                    {/* Campo: Apellidos */}
                    <div className="pp-v2-field-group">
                        <label htmlFor="apellidos" className="pp-v2-label">
                            <span className="pp-v2-label-text">Apellidos</span>
                            {isEditing && <span className="pp-v2-label-badge">Obligatorio</span>}
                        </label>
                        <div className="pp-v2-input-wrapper">
                            <div className="pp-v2-input-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </div>
                            <input
                                id="apellidos"
                                type="text"
                                className={`pp-v2-input ${errors.apellidos ? 'has-error' : ''}`}
                                value={data.apellidos}
                                onChange={(e) => setData('apellidos', e.target.value)}
                                required
                                disabled={!isEditing}
                                autoComplete="family-name"
                                placeholder="Ingresa tus apellidos"
                            />
                        </div>
                        <InputError className="mt-1" message={errors.apellidos} />
                    </div>
                </div>

                {/* Acciones */}
                <div className="pp-v2-info-actions">
                    {!isEditing ? (
                        <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            className="pp-v2-btn pp-v2-btn--secondary"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                            </svg>
                            Editar datos personales
                        </button>
                    ) : (
                        <div className="pp-v2-action-group">
                            <button
                                type="submit"
                                disabled={processing}
                                className="pp-v2-btn pp-v2-btn--primary"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                {processing ? 'Guardando...' : 'Guardar cambios'}
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
                            <span>¡Datos guardados con éxito!</span>
                        </div>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
