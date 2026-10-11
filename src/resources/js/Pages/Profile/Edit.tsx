import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageProps } from "@/types";
import { Head } from "@inertiajs/react";
import { useState } from "react";
import { Avatar, roleLabels } from "@/Components/PortalUI";
import DeleteUserForm from "./Partials/DeleteUserForm";
import UpdatePasswordForm from "./Partials/UpdatePasswordForm";
import UpdateProfileInformationForm from "./Partials/UpdateProfileInformationForm";
import UpdateProfilePhotoForm from "./Partials/UpdateProfilePhotoForm";
import UpdateSignatureForm from "./Partials/UpdateSignatureForm";

/* ── SVG icons inline (no emojis) ── */
const IconUser = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
);
const IconPen = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
);
const IconLock = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);
const IconPhoto = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
    </svg>
);
const IconSignature = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 17c3-3 4-9 7-9s3 6 6 6 3-3 5-3" /><path d="M3 21h18" />
    </svg>
);
const IconShield = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    </svg>
);
const IconCheck = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m5 13 4 4L19 7" />
    </svg>
);
const IconWarn = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

const TABS = [
    { id: "profile",   label: "Información personal", Icon: IconUser },
    { id: "signature", label: "Mi firma",              Icon: IconSignature },
    { id: "security",  label: "Seguridad",             Icon: IconLock },
];

export default function Edit({
    auth,
    mustVerifyEmail,
    status,
}: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
    const [tab, setTab] = useState("profile");
    const user = auth.user;
    const fullName = `${user.nombres} ${user.apellidos}`;
    const isAdmin = user.rol === "admin";
    const tabs = isAdmin ? TABS.filter(({ id }) => id !== "signature") : TABS;

    return (
        <AuthenticatedLayout header={<h1>{isAdmin ? "Mi perfil" : "Mi perfil y firma"}</h1>}>
            <Head title="Mi perfil" />
            <div className="portal-stack">

                {/* ── Hero ── */}
                <section className="portal-hero pp-hero">
                    <div className="pp-hero-inner">
                        <Avatar name={fullName} photo={user.profile_photo_url} />
                        <div className="pp-hero-text">
                            <p className="portal-hero-eyebrow">
                                {roleLabels[user.rol]?.toUpperCase()}
                            </p>
                            <h2>{fullName}</h2>
                            <p>{user.cargo_designado || "Portal de personal EPSEL"}</p>
                        </div>
                    </div>
                    <div className="pp-hero-badges">
                        {!isAdmin && (
                            <span className={`pp-badge ${user.has_signature ? "pp-badge--ok" : "pp-badge--warn"}`}>
                                {user.has_signature
                                    ? <><IconCheck /> Firma registrada</>
                                    : <><IconWarn /> Sin firma</>}
                            </span>
                        )}
                        <span className={`pp-badge ${user.profile_photo_path ? "pp-badge--ok" : "pp-badge--neutral"}`}>
                            {user.profile_photo_path
                                ? <><IconCheck /> Foto de perfil</>
                                : "Sin foto"}
                        </span>
                    </div>
                </section>

                {/* ── Tabs ── */}
                <div className="portal-card">
                    <div className="pp-tabs" role="tablist" aria-label="Secciones del perfil">
                        {tabs.map(({ id, label, Icon }) => (
                            <button
                                key={id}
                                role="tab"
                                id={`tab-${id}`}
                                aria-selected={tab === id}
                                aria-controls={`panel-${id}`}
                                className={`pp-tab ${tab === id ? "pp-tab--active" : ""}`}
                                onClick={() => setTab(id)}
                            >
                                <span className="pp-tab-icon"><Icon /></span>
                                {label}
                                {tab === id && <span className="pp-tab-indicator" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Panel: Información personal ── */}
                <div id="panel-profile" role="tabpanel" aria-labelledby="tab-profile" hidden={tab !== "profile"}>
                    <div className="portal-profile-grid">
                        <section className="portal-card">
                            <div className="pp-section-header">
                                <span className="pp-section-icon"><IconPhoto /></span>
                                <div>
                                    <h2>Foto de perfil</h2>
                                    <p>Visible para otros usuarios del sistema.</p>
                                </div>
                            </div>
                            <div className="pp-section-body">
                                <UpdateProfilePhotoForm />
                            </div>
                        </section>
                        <section className="portal-card">
                            <div className="pp-section-header">
                                <span className="pp-section-icon"><IconPen /></span>
                                <div>
                                    <h2>Datos personales</h2>
                                    <p>Actualiza la información de tu cuenta.</p>
                                </div>
                            </div>
                            <div className="pp-section-body">
                                <UpdateProfileInformationForm
                                    mustVerifyEmail={mustVerifyEmail}
                                    status={status}
                                />
                            </div>
                        </section>
                    </div>
                </div>

                {/* ── Panel: Firma ── */}
                {!isAdmin && <div id="panel-signature" role="tabpanel" aria-labelledby="tab-signature" hidden={tab !== "signature"}>
                    <div className="portal-profile-grid">
                        <section className="portal-card">
                            <div className="pp-section-header">
                                <span className="pp-section-icon"><IconSignature /></span>
                                <div>
                                    <h2>Firma digital</h2>
                                    <p>Se estampará en tus papeletas de salida.</p>
                                </div>
                            </div>
                            <div className="pp-section-body">
                                <UpdateSignatureForm />
                            </div>
                        </section>
                        <aside className="pp-signature-tip">
                            <span className="pp-tip-icon"><IconShield /></span>
                            <h3>¿Por qué es importante?</h3>
                            <p>
                                Tu firma se incorpora automáticamente a las
                                papeletas en el momento del envío y aprobación.
                            </p>
                            <ul className="pp-tip-list">
                                <li>Usa una imagen con fondo transparente</li>
                                <li>Formatos aceptados: PNG o JPG</li>
                                <li>Las firmas en papeletas ya emitidas no se modifican</li>
                            </ul>
                            <div className="pp-tip-status">
                                {user.has_signature ? (
                                    <span className="pp-badge pp-badge--ok pp-badge--lg">
                                        <IconCheck /> Firma activa y lista
                                    </span>
                                ) : (
                                    <span className="pp-badge pp-badge--warn pp-badge--lg">
                                        <IconWarn /> Necesitas subir tu firma
                                    </span>
                                )}
                            </div>
                        </aside>
                    </div>
                </div>}

                {/* ── Panel: Seguridad ── */}
                <div id="panel-security" role="tabpanel" aria-labelledby="tab-security" hidden={tab !== "security"}>
                    <div className="portal-profile-grid">
                        <section className="portal-card">
                            <div className="pp-section-header">
                                <span className="pp-section-icon"><IconLock /></span>
                                <div>
                                    <h2>Cambiar contraseña</h2>
                                    <p>Usa una contraseña larga y única.</p>
                                </div>
                            </div>
                            <div className="pp-section-body">
                                <UpdatePasswordForm />
                            </div>
                        </section>
                        <section className="portal-card pp-danger-card">
                            <div className="pp-section-header pp-section-header--danger">
                                <span className="pp-section-icon pp-section-icon--danger"><IconWarn /></span>
                                <div>
                                    <h2>Zona de riesgo</h2>
                                    <p>Acciones permanentes e irreversibles.</p>
                                </div>
                            </div>
                            <div className="pp-section-body">
                                <DeleteUserForm />
                            </div>
                        </section>
                    </div>
                </div>

            </div>
        </AuthenticatedLayout>
    );
}
