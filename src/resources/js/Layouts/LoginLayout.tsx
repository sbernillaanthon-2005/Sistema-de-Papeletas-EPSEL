import { CSSProperties, PropsWithChildren, useCallback, useEffect, useState } from "react";
import LoginIcon from "@/Components/LoginIcon";
import PortalIcon from "@/Components/PortalIcon";
import background from "../../images/Fondo de login.png";
import mascotaValvula from "../../images/Mascota EPSEL junto a la válvula de agua.png";
import plantaCostera from "../../images/Planta de agua costera al amanecer.png";
import "../../css/login.css";

function DropLetters({ text, delay = 0 }: { text: string; delay?: number }) {
    return <span className="login-drop-text" aria-label={text}>{Array.from(text).map((letter, index) => (
        <span aria-hidden="true" className="login-drop-letter" key={`${letter}-${index}`} style={{ "--login-letter-delay": `${delay + index * 24}ms` } as CSSProperties}>{letter === " " ? "\u00a0" : letter}</span>
    ))}</span>;
}

const CAROUSEL_SLIDES = [
    {
        src: background,
        alt: "Instalaciones de agua potable de EPSEL",
        position: "77% center",
    },
    {
        src: mascotaValvula,
        alt: "Mascota EPSEL junto a la válvula de agua",
        position: "center center",
    },
    {
        src: plantaCostera,
        alt: "Planta de agua costera al amanecer",
        position: "center center",
    },
] as const;

const CAROUSEL_INTERVAL_MS = 5000;

export default function LoginLayout({ children }: PropsWithChildren) {
    const [activeSlide, setActiveSlide] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
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

    const goToSlide = useCallback((index: number) => {
        setActiveSlide(index);
    }, []);

    useEffect(() => {
        if (isPaused) return;
        const timer = setInterval(() => {
            setActiveSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
        }, CAROUSEL_INTERVAL_MS);
        return () => clearInterval(timer);
    }, [isPaused]);

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
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    {/* Carrusel de fondo — crossfade entre 3 imágenes */}
                    <div
                        className="login-carousel"
                        aria-label="Galería de instalaciones EPSEL"
                        role="region"
                    >
                        {CAROUSEL_SLIDES.map((slide, index) => (
                            <img
                                key={slide.alt}
                                className={`login-visual-photo login-carousel-slide${
                                    index === activeSlide ? " is-active" : ""
                                }`}
                                src={slide.src}
                                alt={slide.alt}
                                decoding="async"
                                fetchPriority={index === 0 ? "high" : "low"}
                                style={{ objectPosition: slide.position }}
                                aria-hidden={index !== activeSlide}
                            />
                        ))}
                    </div>
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
                        {/* Dots de navegación del carrusel */}
                        <div
                            className="login-carousel-dots"
                            role="tablist"
                            aria-label="Seleccionar imagen del carrusel"
                        >
                            {CAROUSEL_SLIDES.map((slide, index) => (
                                <button
                                    key={slide.alt}
                                    type="button"
                                    role="tab"
                                    className={`login-carousel-dot${
                                        index === activeSlide ? " is-active" : ""
                                    }`}
                                    aria-label={`Imagen ${index + 1}: ${slide.alt}`}
                                    aria-selected={index === activeSlide}
                                    onClick={() => goToSlide(index)}
                                />
                            ))}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
