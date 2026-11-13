import InputError from '@/Components/InputError';
import { Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef, useState, useMemo } from 'react';

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

    // Password strength logic
    const strength = useMemo(() => {
        const val = data.password;
        if (!val) return { score: 0, label: '', color: '' };
        let score = 0;
        if (val.length >= 8) score += 1;
        if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score += 1;
        if (/[0-9]/.test(val)) score += 1;
        if (/[^A-Za-z0-9]/.test(val) || val.length >= 12) score += 1;

        if (score === 1) return { score: 25, label: 'Débil', color: '#ef4444' };
        if (score === 2) return { score: 50, label: 'Regular', color: '#f59e0b' };
        if (score === 3) return { score: 75, label: 'Buena', color: '#06b6d4' };
        return { score: 100, label: 'Excelente', color: '#10b981' };
    }, [data.password]);

    const hasMinLength = data.password.length >= 8;
    const hasMixedCase = /[A-Z]/.test(data.password) && /[a-z]/.test(data.password);
    const hasNumber = /[0-9]/.test(data.password);
    const passwordsMatch = Boolean(data.password && data.password === data.password_confirmation);

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
        <section className={`pp-v2-password-section ${className}`}>
            <form onSubmit={updatePassword} className="pp-v2-password-form">
                {/* Contraseña actual */}
                <div className="pp-v2-field-group">
                    <label htmlFor="current_password" className="pp-v2-label">
                        <span className="pp-v2-label-text">Contraseña Actual</span>
                        <span className="pp-v2-label-badge">Obligatorio</span>
                    </label>

                    <div className="pp-v2-password-input-wrap">
                        <div className="pp-v2-input-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        </div>
                        <input
                            id="current_password"
                            ref={currentPasswordInput}
                            value={data.current_password}
                            onChange={(e) => setData('current_password', e.target.value)}
                            type={visibleFields.current_password ? 'text' : 'password'}
                            className={`pp-v2-input ${errors.current_password ? 'has-error' : ''}`}
                            autoComplete="current-password"
                            placeholder="Tu contraseña actual"
                            required
                        />
                        <button
                            type="button"
                            className="pp-v2-toggle-pwd"
                            aria-label={visibleFields.current_password ? 'Ocultar contraseña actual' : 'Mostrar contraseña actual'}
                            onClick={() => setVisibleFields((curr) => ({ ...curr, current_password: !curr.current_password }))}
                        >
                            <EyeIcon visible={Boolean(visibleFields.current_password)} />
                        </button>
                    </div>

                    <InputError message={errors.current_password} className="mt-1" />
                </div>

                {/* Nueva contraseña */}
                <div className="pp-v2-field-group">
                    <label htmlFor="password" className="pp-v2-label">
                        <span className="pp-v2-label-text">Nueva Contraseña</span>
                        <span className="pp-v2-label-badge">Mínimo 8 caracteres</span>
                    </label>

                    <div className="pp-v2-password-input-wrap">
                        <div className="pp-v2-input-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 2l-2 2m-1.5 1.5L14 9l-1.5-1.5L11 9l-1.5-1.5L8 9 4 13a4.5 4.5 0 0 0 6.36 6.36L21 9v-3l-2-2z" />
                                <circle cx="7.5" cy="15.5" r=".5" />
                            </svg>
                        </div>
                        <input
                            id="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            type={visibleFields.password ? 'text' : 'password'}
                            className={`pp-v2-input ${errors.password ? 'has-error' : ''}`}
                            autoComplete="new-password"
                            placeholder="Crea una contraseña segura"
                            required
                        />
                        <button
                            type="button"
                            className="pp-v2-toggle-pwd"
                            aria-label={visibleFields.password ? 'Ocultar nueva contraseña' : 'Mostrar nueva contraseña'}
                            onClick={() => setVisibleFields((curr) => ({ ...curr, password: !curr.password }))}
                        >
                            <EyeIcon visible={Boolean(visibleFields.password)} />
                        </button>
                    </div>

                    {/* Barra de fortaleza interactiva */}
                    {data.password && (
                        <div className="pp-v2-strength-box">
                            <div className="pp-v2-strength-header">
                                <span className="pp-v2-strength-txt">Fortaleza de contraseña:</span>
                                <strong style={{ color: strength.color }}>{strength.label}</strong>
                            </div>
                            <div className="pp-v2-strength-bar">
                                <div
                                    className="pp-v2-strength-fill"
                                    style={{
                                        width: `${strength.score}%`,
                                        backgroundColor: strength.color,
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    <InputError message={errors.password} className="mt-1" />
                </div>

                {/* Confirmar contraseña */}
                <div className="pp-v2-field-group">
                    <label htmlFor="password_confirmation" className="pp-v2-label">
                        <span className="pp-v2-label-text">Confirmar Nueva Contraseña</span>
                        {passwordsMatch && <span className="pp-v2-label-badge success">Coinciden</span>}
                    </label>

                    <div className="pp-v2-password-input-wrap">
                        <div className="pp-v2-input-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                            </svg>
                        </div>
                        <input
                            id="password_confirmation"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            type={visibleFields.password_confirmation ? 'text' : 'password'}
                            className={`pp-v2-input ${errors.password_confirmation ? 'has-error' : ''}`}
                            autoComplete="new-password"
                            placeholder="Vuelve a escribir la nueva contraseña"
                            required
                        />
                        <button
                            type="button"
                            className="pp-v2-toggle-pwd"
                            aria-label={visibleFields.password_confirmation ? 'Ocultar confirmación de contraseña' : 'Mostrar confirmación de contraseña'}
                            onClick={() => setVisibleFields((curr) => ({ ...curr, password_confirmation: !curr.password_confirmation }))}
                        >
                            <EyeIcon visible={Boolean(visibleFields.password_confirmation)} />
                        </button>
                    </div>

                    <InputError message={errors.password_confirmation} className="mt-1" />
                </div>

                {/* Checklist de requisitos de seguridad */}
                <div className="pp-v2-security-checklist">
                    <span className="pp-v2-checklist-title">Requisitos recomendados:</span>
                    <div className="pp-v2-checklist-grid">
                        <div className={`pp-v2-check-pill ${hasMinLength ? 'is-valid' : ''}`}>
                            <span className="pp-v2-check-dot" />
                            <span>8+ caracteres</span>
                        </div>
                        <div className={`pp-v2-check-pill ${hasMixedCase ? 'is-valid' : ''}`}>
                            <span className="pp-v2-check-dot" />
                            <span>Mayús. y minús.</span>
                        </div>
                        <div className={`pp-v2-check-pill ${hasNumber ? 'is-valid' : ''}`}>
                            <span className="pp-v2-check-dot" />
                            <span>Al menos 1 número</span>
                        </div>
                        <div className={`pp-v2-check-pill ${passwordsMatch ? 'is-valid' : ''}`}>
                            <span className="pp-v2-check-dot" />
                            <span>Contraseñas coinciden</span>
                        </div>
                    </div>
                </div>

                {/* Acciones */}
                <div className="pp-v2-password-actions">
                    <button
                        type="submit"
                        disabled={processing}
                        className="pp-v2-btn pp-v2-btn--primary"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        {processing ? 'Actualizando...' : 'Actualizar contraseña'}
                    </button>

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
                            <span>¡Contraseña actualizada con éxito!</span>
                        </div>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
