import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageProps } from "@/types";
import { Head } from "@inertiajs/react";
import { useState, useRef } from "react";
import { Avatar, roleLabels } from "@/Components/PortalUI";
import UpdatePasswordForm from "./Partials/UpdatePasswordForm";
import UpdateProfileInformationForm from "./Partials/UpdateProfileInformationForm";
import UpdateProfilePhotoForm from "./Partials/UpdateProfilePhotoForm";
import UpdateSignatureForm from "./Partials/UpdateSignatureForm";
import heroBg from "../../../images/Banner tecnológico azul con datos y seguridad.png";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

/* ── SVG Icons ── */
const IconUser = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
);
const IconSignature = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 17c3-3 4-9 7-9s3 6 6 6 3-3 5-3" /><path d="M3 21h18" />
    </svg>
);
const IconLock = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);
const IconShield = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    </svg>
);
const IconCheck = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);
const IconWarn = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);
const IconCopy = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
);

const TABS = [
    { id: "profile",   label: "Información personal", Icon: IconUser },
    { id: "signature", label: "Mi firma digital",     Icon: IconSignature },
    { id: "security",  label: "Seguridad y acceso",   Icon: IconLock },
];

export default function Edit({
    auth,
    mustVerifyEmail,
    status,
}: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
    const [tab, setTab] = useState("profile");
    const [copiedEmail, setCopiedEmail] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const user = auth.user;
    const fullName = `${user.nombres} ${user.apellidos}`.trim();
    const isAdmin = user.rol === "admin";
    const tabs = isAdmin ? TABS.filter(({ id }) => id !== "signature") : TABS;

    // Animación suave con GSAP al cambiar de pestaña
    useGSAP(() => {
        if (panelRef.current) {
            gsap.fromTo(
                panelRef.current,
                { opacity: 0, y: 12 },
                { opacity: 1, y: 0, duration: 0.32, ease: "power2.out" }
            );
        }
    }, [tab]);

    const handleCopyEmail = () => {
        navigator.clipboard.writeText(user.email);
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2200);
    };

    return (
        <AuthenticatedLayout header={<h1>{isAdmin ? "Mi perfil" : "Mi perfil y credenciales"}</h1>}>
            <Head title="Mi perfil · EPSEL" />

            <div className="portal-stack pp-v2-container">
                {/* ── Executive Hero Banner ── */}
                <header className="pp-v2-hero">
                    <img className="pp-v2-hero-bg" src={heroBg} alt="" aria-hidden="true" />
                    <div className="pp-v2-hero-overlay" />

                    <div className="pp-v2-hero-content">
                        {/* Avatar & Identidad */}
                        <div className="pp-v2-hero-identity">
                            <div className="pp-v2-avatar-halo-wrap">
                                <Avatar
                                    name={fullName}
                                    photo={user.profile_photo_url}
                                    className="pp-v2-hero-avatar"
                                />
                                <span className="pp-v2-avatar-indicator" title="Cuenta activa y operativa">
                                    <IconCheck />
                                </span>
                            </div>

                            <div className="pp-v2-hero-text">
                                <div className="pp-v2-role-pill">
                                    <IconShield />
                                    <span>{(user.rol_label || roleLabels[user.rol] || user.rol)?.toUpperCase()} · EPSEL</span>
                                </div>
                                <h2 className="pp-v2-hero-title">{fullName}</h2>
                                <p className="pp-v2-hero-subtitle">
                                    {user.cargo_designado || "Personal de operaciones y gestión"}
                                </p>
                                <div className="pp-v2-hero-meta-row">
                                    <span className="pp-v2-meta-chip">
                                        <strong>DNI:</strong> {user.dni || "No asignado"}
                                    </span>
                                    <span className="pp-v2-meta-chip">
                                        <strong>Correo:</strong> {user.email}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Status Badges en el Hero */}
                        <div className="pp-v2-hero-stats">
                            <div className="pp-v2-status-card">
                                <span className="pp-v2-status-dot green" />
                                <div>
                                    <small>ESTADO DE CUENTA</small>
                                    <strong>Institucional activa</strong>
                                </div>
                            </div>

                            {!isAdmin && (
                                <button
                                    type="button"
                                    onClick={() => setTab("signature")}
                                    className={`pp-v2-status-card is-interactive ${user.has_signature ? "is-ok" : "is-pending"}`}
                                    title="Haz clic para gestionar tu firma digital"
                                >
                                    <span className={`pp-v2-status-dot ${user.has_signature ? "green" : "amber"}`} />
                                    <div>
                                        <small>FIRMA DIGITAL</small>
                                        <strong>{user.has_signature ? "Registrada y vigente" : "Pendiente de registro"}</strong>
                                    </div>
                                    <span className="pp-v2-status-arrow">→</span>
                                </button>
                            )}
                        </div>
                    </div>
                </header>

                {/* ── Segmented Control Tabs ── */}
                <nav className="pp-v2-nav-bar" role="tablist" aria-label="Secciones del perfil">
                    <div className="pp-v2-tabs">
                        {tabs.map(({ id, label, Icon }) => {
                            const isActive = tab === id;
                            return (
                                <button
                                    key={id}
                                    role="tab"
                                    id={`tab-${id}`}
                                    aria-selected={isActive}
                                    aria-controls={`panel-${id}`}
                                    className={`pp-v2-tab ${isActive ? "is-active" : ""}`}
                                    onClick={() => setTab(id)}
                                >
                                    <span className="pp-v2-tab-icon"><Icon /></span>
                                    <span className="pp-v2-tab-label">{label}</span>
                                    {id === "signature" && !isAdmin && (
                                        <span className={`pp-v2-tab-tag ${user.has_signature ? "tag-ok" : "tag-warn"}`}>
                                            {user.has_signature ? "✓" : "!"}
                                        </span>
                                    )}
                                    {isActive && <span className="pp-v2-tab-active-pill" />}
                                </button>
                            );
                        })}
                    </div>
                </nav>

                {/* ── Dynamic Tab Panels Container ── */}
                <div ref={panelRef} className="pp-v2-tab-panels">
                    {/* PANEL 1: Información personal */}
                    {tab === "profile" && (
                        <div id="panel-profile" role="tabpanel" aria-labelledby="tab-profile" className="pp-v2-grid">
                            {/* Columna Izquierda: Foto de Perfil & Credencial Digital */}
                            <div className="pp-v2-col">
                                {/* Card: Foto de perfil */}
                                <div className="pp-v2-card">
                                    <div className="pp-v2-card-header">
                                        <div className="pp-v2-card-icon tone-cyan">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="pp-v2-card-title">Foto de perfil</h3>
                                            <p className="pp-v2-card-desc">Visible para todos los módulos y aprobadores del portal</p>
                                        </div>
                                    </div>
                                    <div className="pp-v2-card-body">
                                        <UpdateProfilePhotoForm />
                                    </div>
                                </div>

                                {/* Card: Credencial Digital EPSEL */}
                                <div className="pp-v2-card pp-v2-card--badge">
                                    <div className="pp-v2-badge-inner">
                                        <div className="pp-v2-badge-header">
                                            <div className="pp-v2-badge-brand">
                                                <strong>EPSEL S.A.</strong>
                                                <span>CREDENCIAL DIGITAL</span>
                                            </div>
                                            <span className="pp-v2-badge-security">
                                                <IconShield /> OFICIAL
                                            </span>
                                        </div>

                                        <div className="pp-v2-badge-body">
                                            <Avatar
                                                name={fullName}
                                                photo={user.profile_photo_url}
                                                className="pp-v2-badge-avatar"
                                            />
                                            <div className="pp-v2-badge-info">
                                                <strong className="pp-v2-badge-name">{fullName}</strong>
                                                <span className="pp-v2-badge-role">
                                                    {user.rol_label || roleLabels[user.rol] || user.rol}
                                                </span>
                                                <span className="pp-v2-badge-sub">
                                                    DNI: {user.dni || "—"} · Sistema de Papeletas
                                                </span>
                                            </div>
                                        </div>

                                        <div className="pp-v2-badge-footer">
                                            <div className="pp-v2-badge-seal">
                                                <IconCheck /> VERIFICADO POR RRHH
                                            </div>
                                            <span className="pp-v2-badge-year">EPSEL · 2026</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Columna Derecha: Datos personales & Cuenta */}
                            <div className="pp-v2-col">
                                <div className="pp-v2-card">
                                    <div className="pp-v2-card-header">
                                        <div className="pp-v2-card-icon tone-teal">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="pp-v2-card-title">Datos personales e identidad</h3>
                                            <p className="pp-v2-card-desc">Información oficial registrada en el servidor de la entidad</p>
                                        </div>
                                    </div>

                                    <div className="pp-v2-card-body">
                                        {/* Ficha rápida de cuenta institucional */}
                                        <div className="pp-v2-facts-banner">
                                            <div className="pp-v2-fact-item">
                                                <span className="pp-v2-fact-label">Correo institucional</span>
                                                <div className="pp-v2-fact-value-wrap">
                                                    <strong className="pp-v2-fact-value">{user.email}</strong>
                                                    <button
                                                        type="button"
                                                        onClick={handleCopyEmail}
                                                        className="pp-v2-copy-btn"
                                                        title="Copiar correo al portapapeles"
                                                    >
                                                        <IconCopy />
                                                        <span>{copiedEmail ? "¡Copiado!" : "Copiar"}</span>
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="pp-v2-fact-item">
                                                <span className="pp-v2-fact-label">Estado de cuenta</span>
                                                <div className="pp-v2-fact-status-badge">
                                                    <span className="pp-v2-pulse-dot success" />
                                                    <span>Activa y habilitada</span>
                                                </div>
                                            </div>

                                            <div className="pp-v2-fact-item">
                                                <span className="pp-v2-fact-label">Rol institucional</span>
                                                <strong className="pp-v2-fact-value">
                                                    {user.rol_label || roleLabels[user.rol] || user.rol}
                                                </strong>
                                            </div>

                                            <div className="pp-v2-fact-item">
                                                <span className="pp-v2-fact-label">Documento DNI</span>
                                                <strong className="pp-v2-fact-value">{user.dni || "—"}</strong>
                                            </div>
                                        </div>

                                        {/* Formulario de actualización de nombres */}
                                        <div className="pp-v2-form-wrapper">
                                            <UpdateProfileInformationForm
                                                mustVerifyEmail={mustVerifyEmail}
                                                status={status}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PANEL 2: Mi firma digital */}
                    {tab === "signature" && !isAdmin && (
                        <div id="panel-signature" role="tabpanel" aria-labelledby="tab-signature" className="pp-v2-grid">
                            <div className="pp-v2-col pp-v2-col--wide">
                                <div className="pp-v2-card">
                                    <div className="pp-v2-card-header">
                                        <div className="pp-v2-card-icon tone-cyan">
                                            <IconSignature />
                                        </div>
                                        <div>
                                            <h3 className="pp-v2-card-title">Firma digital institucional</h3>
                                            <p className="pp-v2-card-desc">
                                                Esta firma se estampará en las papeletas de salida que emitas o autorices
                                            </p>
                                        </div>
                                    </div>
                                    <div className="pp-v2-card-body">
                                        <UpdateSignatureForm />
                                    </div>
                                </div>
                            </div>

                            <div className="pp-v2-col pp-v2-col--narrow">
                                <div className="pp-v2-card pp-v2-card--guidelines">
                                    <div className="pp-v2-guidelines-header">
                                        <div className="pp-v2-guidelines-icon">
                                            <IconShield />
                                        </div>
                                        <h4>Directivas de firma digital</h4>
                                    </div>
                                    <ul className="pp-v2-guidelines-list">
                                        <li>
                                            <strong>Fondo transparente (PNG):</strong> Asegúrate de que no tenga recuadro blanco para que el visado oficial sea transparente sobre el documento.
                                        </li>
                                        <li>
                                            <strong>Trazo claro y nítido:</strong> Utiliza un lapicero azul o negro con trazo continuo antes de escanearlo o fotografiarlo.
                                        </li>
                                        <li>
                                            <strong>Validez jurídica interna:</strong> La firma vinculada a tu cuenta tiene valor legal y administrativo dentro de EPSEL S.A.
                                        </li>
                                        <li>
                                            <strong>Inmutabilidad histórica:</strong> Las papeletas emitidas previamente mantendrán la firma con la que fueron autorizadas en su momento.
                                        </li>
                                    </ul>

                                    <div className="pp-v2-security-guarantee">
                                        <IconCheck />
                                        <span>Canal cifrado y custodia segura en el servidor de base de datos PostgreSQL de EPSEL.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PANEL 3: Seguridad y acceso */}
                    {tab === "security" && (
                        <div id="panel-security" role="tabpanel" aria-labelledby="tab-security" className="pp-v2-grid">
                            <div className="pp-v2-col pp-v2-col--wide">
                                <div className="pp-v2-card">
                                    <div className="pp-v2-card-header">
                                        <div className="pp-v2-card-icon tone-amber">
                                            <IconLock />
                                        </div>
                                        <div>
                                            <h3 className="pp-v2-card-title">Cambiar contraseña de acceso</h3>
                                            <p className="pp-v2-card-desc">
                                                Usa una contraseña robusta con al menos 8 caracteres para mantener segura tu cuenta
                                            </p>
                                        </div>
                                    </div>
                                    <div className="pp-v2-card-body">
                                        <UpdatePasswordForm />
                                    </div>
                                </div>
                            </div>

                            <div className="pp-v2-col pp-v2-col--narrow">
                                <div className="pp-v2-card pp-v2-card--guidelines">
                                    <div className="pp-v2-guidelines-header">
                                        <div className="pp-v2-guidelines-icon tone-green">
                                            <IconShield />
                                        </div>
                                        <h4>Seguridad de la cuenta</h4>
                                    </div>
                                    <p className="pp-v2-guidelines-intro">
                                        Tu cuenta de EPSEL tiene acceso al sistema de gestión de salidas y autorizaciones del personal.
                                    </p>
                                    <ul className="pp-v2-guidelines-list">
                                        <li>
                                            <strong>Cifrado criptográfico:</strong> Tus credenciales se almacenan con algoritmos de hashing seguro (Bcrypt / Argon2).
                                        </li>
                                        <li>
                                            <strong>Cierre automático:</strong> Por seguridad de la entidad, las sesiones inactivas caducan periódicamente.
                                        </li>
                                        <li>
                                            <strong>No compartas tu clave:</strong> Ningún administrador de sistemas te pedirá tu contraseña institucional.
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
