import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';

function EyeIcon({ visible }: { visible: boolean }) {
    return visible ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 3l18 18" /><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
            <path d="M9.9 5.2A11.4 11.4 0 0 1 12 5c5.4 0 9 5.2 9 7a8.8 8.8 0 0 1-2.1 3.4M6.2 6.2C3.9 7.7 3 10.3 3 12c0 1.8 3.6 7 9 7 1.2 0 2.3-.3 3.3-.8" />
        </svg>
    ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}

export default function UpdatePasswordForm({
    className = '',
}: {
    className?: string;
}) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);
    
    const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});

    const {
        data,
        setData,
        errors,
        put,
        reset,
        processing,
        recentlySuccessful,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword: FormEventHandler = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
            },
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }

                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <section className={`pp-password-form ${className}`}>
            <header>
                <div>
                    <h2 className="text-lg font-medium text-gray-900">
                        Actualizar Contraseña
                    </h2>

                    <p className="mt-1 text-sm text-gray-600">
                        Asegúrate de que tu cuenta esté usando una contraseña larga y aleatoria para mantenerte seguro.
                    </p>
                </div>
            </header>

            <form onSubmit={updatePassword} className="mt-6 space-y-6">
                <div>
                    <InputLabel
                        htmlFor="current_password"
                        value="Contraseña Actual"
                    />

                    <div className="pp-password-input">
                        <TextInput
                            id="current_password"
                            ref={currentPasswordInput}
                            value={data.current_password}
                            onChange={(e) => setData('current_password', e.target.value)}
                            type={visibleFields.current_password ? 'text' : 'password'}
                            className="mt-1 block w-full"
                            autoComplete="current-password"
                        />
                        <button type="button" className="pp-password-visibility" aria-label={visibleFields.current_password ? 'Ocultar contraseña actual' : 'Mostrar contraseña actual'} onClick={() => setVisibleFields((current) => ({ ...current, current_password: !current.current_password }))}>
                            <EyeIcon visible={Boolean(visibleFields.current_password)} />
                        </button>
                    </div>

                    <InputError
                        message={errors.current_password}
                        className="mt-2"
                    />
                </div>

                <div>
                    <InputLabel htmlFor="password" value="Nueva Contraseña" />

                    <div className="pp-password-input">
                        <TextInput
                            id="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            type={visibleFields.password ? 'text' : 'password'}
                            className="mt-1 block w-full"
                            autoComplete="new-password"
                        />
                        <button type="button" className="pp-password-visibility" aria-label={visibleFields.password ? 'Ocultar nueva contraseña' : 'Mostrar nueva contraseña'} onClick={() => setVisibleFields((current) => ({ ...current, password: !current.password }))}>
                            <EyeIcon visible={Boolean(visibleFields.password)} />
                        </button>
                    </div>

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div>
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Confirmar Contraseña"
                    />

                    <div className="pp-password-input">
                        <TextInput
                            id="password_confirmation"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            type={visibleFields.password_confirmation ? 'text' : 'password'}
                            className="mt-1 block w-full"
                            autoComplete="new-password"
                        />
                        <button type="button" className="pp-password-visibility" aria-label={visibleFields.password_confirmation ? 'Ocultar confirmación de contraseña' : 'Mostrar confirmación de contraseña'} onClick={() => setVisibleFields((current) => ({ ...current, password_confirmation: !current.password_confirmation }))}>
                            <EyeIcon visible={Boolean(visibleFields.password_confirmation)} />
                        </button>
                    </div>

                    <InputError
                        message={errors.password_confirmation}
                        className="mt-2"
                    />
                </div>

                <div className="flex items-center gap-4">
                    <PrimaryButton className="pp-password-submit" disabled={processing}>
                        Actualizar contraseña <span aria-hidden="true">→</span>
                    </PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600">
                            Guardado.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
