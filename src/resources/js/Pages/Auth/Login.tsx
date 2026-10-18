import LoginIcon from "@/Components/LoginIcon";
import LoginLayout from "@/Layouts/LoginLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { CSSProperties, FormEventHandler, useState } from "react";
import mascot from "../../../images/EPSEL-saludo-transparente.gif";

function DropLetters({ text, delay = 0 }: { text: string; delay?: number }) {
    return (
        <span className="login-drop-text" aria-label={text}>
            {Array.from(text).map((letter, index) => (
                <span
                    aria-hidden="true"
                    className="login-drop-letter"
                    key={`${letter}-${index}`}
                    style={{ "--login-letter-delay": `${delay + index * 28}ms` } as CSSProperties}
                >
                    {letter === " " ? "\u00a0" : letter}
                </span>
            ))}
        </span>
    );
}

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
        dni: "",
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
                <h1 aria-label="Bienvenido de nuevo.">
                    <DropLetters text="Bienvenido" />
                    <br />
                    <DropLetters text="de nuevo." delay={220} />
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
            <div className="login-access-note">
                <span><LoginIcon name="shield" /></span>
                <div>
                    <strong>Acceso institucional</strong>
                    <small>Usa tu DNI y contraseña asignada.</small>
                </div>
            </div>
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
                <div className={"login-field " + (data.dni ? "is-filled" : "")}>
                    <label htmlFor="dni">DNI</label>
                    <div className="login-input-wrap">
                        <LoginIcon name="user" className="login-input-icon" />
                        <input
                            id="dni"
                            type="text"
                            name="dni"
                            value={data.dni}
                            className="login-input"
                            placeholder="Tu número de DNI"
                            autoComplete="username"
                            inputMode="numeric"
                            maxLength={8}
                            pattern="[0-9]{8}"
                            autoCapitalize="none"
                            spellCheck={false}
                            required
                            aria-invalid={Boolean(errors.dni)}
                            aria-describedby={
                                errors.dni ? "login-dni-error" : undefined
                            }
                            onChange={(e) =>
                                setData(
                                    "dni",
                                    e.target.value.replace(/\D/g, "").slice(0, 8),
                                )
                            }
                        />
                        {data.dni.length === 8 && (
                            <span className="login-field-ready" aria-label="DNI completo">
                                <LoginIcon name="check" />
                            </span>
                        )}
                    </div>
                    <span className="login-field-hint">
                        {data.dni ? data.dni.length + " de 8 dígitos" : "Ingresa los 8 dígitos de tu documento"}
                    </span>
                    {errors.dni && (
                        <p
                            id="login-dni-error"
                            className="login-error"
                            role="alert"
                        >
                            {errors.dni}
                        </p>
                    )}
                </div>
                <div className={"login-field " + (data.password ? "is-filled" : "")}>
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
                    <span className="login-options-state">
                        <LoginIcon name="shield" /> Sesión protegida
                    </span>
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
