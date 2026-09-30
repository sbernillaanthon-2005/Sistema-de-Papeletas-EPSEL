import LoginIcon from "@/Components/LoginIcon";
import LoginLayout from "@/Layouts/LoginLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { FormEventHandler, useState } from "react";
import mascot from "../../../images/EPSEL-saludo-transparente.gif";

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const [showPassword, setShowPassword] = useState(false);
    const [capsLock, setCapsLock] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: false as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (processing) return;

        post(route("login"), {
            onFinish: () => reset("password"),
        });
    };

    return (
        <LoginLayout>
            <Head title="Iniciar Sesión" />
            <div className="login-welcome">
                <p className="login-eyebrow">PORTAL DEL COLABORADOR</p>
                <h1>
                    Bienvenido
                    <br />
                    de nuevo.
                </h1>
                <img
                    src={mascot}
                    alt="Mascota EPSEL"
                    className="login-mascot transition-transform duration-300 hover:scale-105"
                    width="210"
                    height="250"
                />
            </div>
            <p className="login-description">
                Ingresa a tu espacio de trabajo y gestiona tus papeletas de
                forma sencilla.
            </p>
            {status && (
                <div className="login-status" role="status">
                    {status}
                </div>
            )}

            <form
                id="login-form"
                className="login-form"
                onSubmit={submit}
                aria-busy={processing}
            >
                <div className="login-field">
                    <label htmlFor="email">Correo electrónico o DNI</label>
                    <div className="login-input-wrap">
                        <LoginIcon name="user" className="login-input-icon" />
                        <input
                            id="email"
                            type="text"
                            name="email"
                            value={data.email}
                            className="login-input"
                            placeholder="Tu correo o número de DNI"
                            autoComplete="username"
                            autoCapitalize="none"
                            spellCheck={false}
                            required
                            aria-invalid={Boolean(errors.email)}
                            aria-describedby={
                                errors.email ? "login-email-error" : undefined
                            }
                            onChange={(e) => setData("email", e.target.value)}
                        />
                    </div>
                    {errors.email && (
                        <p
                            id="login-email-error"
                            className="login-error"
                            role="alert"
                        >
                            {errors.email}
                        </p>
                    )}
                </div>
                <div className="login-field">
                    <label htmlFor="password">Contraseña</label>
                    <div className="login-input-wrap">
                        <LoginIcon name="lock" className="login-input-icon" />
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={data.password}
                            className="login-input login-password"
                            placeholder="Ingresa tu contraseña"
                            autoComplete="current-password"
                            required
                            aria-invalid={Boolean(errors.password)}
                            aria-describedby={
                                [
                                    errors.password && "login-password-error",
                                    capsLock && "login-caps",
                                ]
                                    .filter(Boolean)
                                    .join(" ") || undefined
                            }
                            onKeyUp={(e) =>
                                setCapsLock(e.getModifierState("CapsLock"))
                            }
                            onKeyDown={(e) =>
                                setCapsLock(e.getModifierState("CapsLock"))
                            }
                            onBlur={() => setCapsLock(false)}
                            onChange={(e) =>
                                setData("password", e.target.value)
                            }
                        />
                        <button
                            className="login-password-toggle"
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={
                                showPassword
                                    ? "Ocultar contraseña"
                                    : "Mostrar contraseña"
                            }
                            aria-pressed={showPassword}
                            aria-controls="password"
                        >
                            <LoginIcon
                                name={showPassword ? "eye-off" : "eye"}
                            />
                        </button>
                    </div>
                    {capsLock && (
                        <p id="login-caps" className="login-caps" role="status">
                            La tecla Bloq Mayús está activada.
                        </p>
                    )}
                    {errors.password && (
                        <p
                            id="login-password-error"
                            className="login-error"
                            role="alert"
                        >
                            {errors.password}
                        </p>
                    )}
                </div>
                <div className="login-options">
                    <label className="login-remember">
                        <input
                            type="checkbox"
                            className="login-checkbox"
                            name="remember"
                            checked={data.remember}
                            onChange={(e) =>
                                setData("remember", e.target.checked)
                            }
                        />
                        <span>Recordarme</span>
                    </label>
                </div>
                <button
                    type="submit"
                    className="login-submit"
                    disabled={processing}
                >
                    {processing ? (
                        <>
                            <span
                                className="login-spinner"
                                aria-hidden="true"
                            />
                            Ingresando…
                        </>
                    ) : (
                        <>
                            Ingresar
                            <LoginIcon name="arrow" />
                        </>
                    )}
                </button>
            </form>
            <p className="login-support">
                ¿Necesitas acceso a la plataforma?
                <strong>Comunícate con tu administrador.</strong>
            </p>
        </LoginLayout>
    );
}
