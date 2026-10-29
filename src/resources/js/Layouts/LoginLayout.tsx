import { CSSProperties, PropsWithChildren, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
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
    { src: background, alt: "Instalaciones de agua potable de EPSEL", position: "center center" },
    { src: mascotaValvula, alt: "Mascota EPSEL junto a una válvula de agua", position: "center center" },
    { src: plantaCostera, alt: "Planta de agua costera al amanecer", position: "center center" },
] as const;
gsap.registerPlugin(useGSAP);

export default function LoginLayout({ children }: PropsWithChildren) {
    const [activeSlide, setActiveSlide] = useState(0);
    const pageRef = useRef<HTMLDivElement>(null);
    const carouselRef = useRef<HTMLDivElement>(null);
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

    useEffect(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const timer = window.setInterval(() => {
            setActiveSlide((current) => (current + 1) % CAROUSEL_SLIDES.length);
        }, 5000);
        return () => window.clearInterval(timer);
    }, []);

    useGSAP(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        gsap.timeline({ defaults: { ease: "power2.out" } })
            .from(".login-brand", { y: -12, opacity: 0, duration: .5 })
            .from(".login-content > .login-welcome, .login-content > .login-description, .login-content > .login-access-note, .login-content > .login-form, .login-content > .login-support", {
                y: 16, opacity: 0, duration: .5, stagger: .09, clearProps: "all",
            }, "-=.25");
    }, { scope: pageRef });

    useGSAP(() => {
        if (!carouselRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const slides = carouselRef.current.querySelectorAll<HTMLElement>(".login-carousel-slide");
        slides.forEach((slide, index) => {
            if (index !== activeSlide) gsap.to(slide, { opacity: 0, duration: .8, overwrite: true });
        });
        gsap.fromTo(slides[activeSlide], { opacity: 0, scale: 1.03 }, {
            opacity: 1, scale: 1.08, duration: 1.1, ease: "power2.out", overwrite: true,
        });
    }, { scope: carouselRef, dependencies: [activeSlide] });

    return (
        <div className="login-page login-gsap" data-theme={theme} ref={pageRef}>
            <a href="#login-form" className="login-skip">
                Ir al formulario de acceso
            </a>
            <div className="login-shell">
                <section className="login-panel" aria-label="Acceso a EPSEL">
                    <header className="login-brand">
                        <div className="login-brand-lockup">
                            <span className="login-brand-copy">
                                <span className="login-brand-name">EPSEL<span> S.A.</span></span>
                                <span className="login-brand-caption">SISTEMA DE PAPELETAS</span>
                            </span>
                            <span className="login-brand-promise">Gestión eficiente<br />para un mejor servicio.</span>
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
                    {/* Fondo institucional */}
                    <div className="login-carousel" aria-hidden="true" ref={carouselRef}>
                        {CAROUSEL_SLIDES.map((slide, index) => (
                            <img
                                key={slide.alt}
                                className={`login-visual-photo login-carousel-slide${index === activeSlide ? " is-active" : ""}`}
                                src={slide.src}
                                alt=""
                                decoding="async"
                                style={{ objectPosition: slide.position }}
                                aria-hidden="true"
                            />
                        ))}
                    </div>
                    <div className="login-visual-orbit login-visual-orbit-one" aria-hidden="true" />
                    <div className="login-visual-orbit login-visual-orbit-two" aria-hidden="true" />
                    <div className="login-visual-shade" />
                    <div className="login-visual-top">
                        <span className="login-visual-location">
                            <span className="login-location-pin" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg></span>
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
                            {[
                                { title: "Solicita", detail: "Registra tu papeleta de forma simple.", icon: "file" as const },
                                { title: "Aprueba", detail: "Sigue su gestión en tiempo real.", icon: "check" as const },
                                { title: "Continúa", detail: "Retoma tu trabajo con tranquilidad.", icon: "grid" as const },
                            ].map(({ title, detail, icon }, index) => (
                                <div key={title}>
                                    <span className="login-step-icon"><PortalIcon name={icon} /></span>
                                    <span className="login-step-copy">
                                        <small>0{index + 1}</small>
                                        <strong>{title}</strong>
                                        <em>{detail}</em>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="login-carousel-dots" role="group" aria-label="Cambiar imagen de fondo">
                        {CAROUSEL_SLIDES.map((slide, index) => (
                            <button
                                key={slide.alt}
                                type="button"
                                className={`login-carousel-dot${index === activeSlide ? " is-active" : ""}`}
                                aria-label={`Mostrar imagen ${index + 1}: ${slide.alt}`}
                                aria-pressed={index === activeSlide}
                                onClick={() => setActiveSlide(index)}
                            />
                        ))}
                    </div>
                </aside>
            </div>
        </div>
    );
}
