import { CSSProperties, PropsWithChildren, useEffect, useState } from "react";
import LoginIcon from "@/Components/LoginIcon";
import PortalIcon from "@/Components/PortalIcon";
import background from "../../images/Fondo de login.png";
import "../../css/login.css";

function DropLetters({ text, delay = 0 }: { text: string; delay?: number }) {
    return <span className="login-drop-text" aria-label={text}>{Array.from(text).map((letter, index) => (
        <span aria-hidden="true" className="login-drop-letter" key={`${letter}-${index}`} style={{ "--login-letter-delay": `${delay + index * 24}ms` } as CSSProperties}>{letter === " " ? "\u00a0" : letter}</span>
    ))}</span>;
}

export default function LoginLayout({ children }: PropsWithChildren) {
    const [theme, setTheme] = useState<"light" | "dark">(() => {
        if (typeof window === "undefined") return "light";

        const savedTheme = window.localStorage.getItem("epsel-theme");
        if (savedTheme === "light" || savedTheme === "dark") return savedTheme;

        return window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
    });

    useEffect(() => {
        window.localStorage.setItem("epsel-theme", theme);
    }, [theme]);

    return (
        <div className="login-page" data-theme={theme}>
            <a href="#login-form" className="login-skip">
                Ir al formulario de acceso
            </a>
            <div className="login-shell">
                <section className="login-panel" aria-label="Acceso a EPSEL">
                    <header className="login-brand">
                        <div>
                            <span className="login-brand-name">
                                EPSEL<span> S.A.</span>
                            </span>
                            <span className="login-brand-caption">
                                SISTEMA DE PAPELETAS
                            </span>
                        </div>
                        <button
                            type="button"
                            className="login-theme-toggle"
                            onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")}
                            aria-label={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
                            aria-pressed={theme === "dark"}
                            title={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
                        >
                            <PortalIcon name={theme === "dark" ? "sun" : "moon"} />
                        </button>
                    </header>
                    <main className="login-content">{children}</main>
                    <footer className="login-footer">
                        <LoginIcon name="shield" />
                        <span>Uso exclusivo del personal autorizado.</span>
                    </footer>
                </section>

                <aside
                    className="login-visual"
                    aria-label="Sistema de gestión de papeletas"
                >
                    <img
                        className="login-visual-photo"
                        src={background}
                        alt="Instalaciones de agua potable de EPSEL"
                        decoding="async"
                        fetchPriority="high"
                    />
                    <div className="login-visual-orbit login-visual-orbit-one" aria-hidden="true" />
                    <div className="login-visual-orbit login-visual-orbit-two" aria-hidden="true" />
                    <div className="login-visual-shade" />
                    <div className="login-visual-top">
                        <span className="login-visual-tag">
                            <span /> GESTIÓN INTERNA
                        </span>
                        <span className="login-visual-location">
                            Lambayeque, Perú
                        </span>
                    </div>
                    <div className="login-visual-console">
                        <span className="login-visual-console-icon">
                            <LoginIcon name="shield" />
                        </span>
                        <div>
                            <small>ESTADO DEL PORTAL</small>
                            <strong>Listo para operar</strong>
                        </div>
                        <span className="login-visual-console-status"><i /> En línea</span>
                    </div>
                    <div className="login-visual-copy">
                        <span className="login-visual-eyebrow">
                            CONECTADOS PARA SERVIR MEJOR
                        </span>
                        <h2 aria-label="Tu tiempo cuenta.">
                            <DropLetters text="Tu tiempo" delay={120} />
                            <br />
                            <span><DropLetters text="cuenta." delay={340} /></span>
                        </h2>
                        <p>
                            Menos trámites. Más tranquilidad.
                            <br />
                            Tus papeletas y aprobaciones, en un solo lugar.
                        </p>
                        <div className="login-visual-assurance">
                            <LoginIcon name="shield" />
                            <span>Gestión de salidas con trazabilidad por etapas.</span>
                        </div>
                        <div
                            className="login-steps"
                            aria-label="Proceso de una papeleta"
                        >
                            {["Solicita", "Aprueba", "Continúa"].map(
                                (step, index) => (
                                    <div key={step}>
                                        <span className="login-step-number">
                                            0{index + 1}
                                        </span>
                                        <span>{step}</span>
                                    </div>
                                ),
                            )}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
