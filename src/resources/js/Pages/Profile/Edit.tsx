import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageProps } from "@/types";
import { Head } from "@inertiajs/react";
import { useState } from "react";
import { Avatar, roleLabels } from "@/Components/PortalUI";
import PortalIcon from "@/Components/PortalIcon";
import DeleteUserForm from "./Partials/DeleteUserForm";
import UpdatePasswordForm from "./Partials/UpdatePasswordForm";
import UpdateProfileInformationForm from "./Partials/UpdateProfileInformationForm";
import UpdateProfilePhotoForm from "./Partials/UpdateProfilePhotoForm";
import UpdateSignatureForm from "./Partials/UpdateSignatureForm";

export default function Edit({
    auth,
    mustVerifyEmail,
    status,
}: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
    const [tab, setTab] = useState("profile");
    return (
        <AuthenticatedLayout header={<h1>Mi perfil y firma</h1>}>
            <Head title="Mi perfil" />
            <div className="portal-stack">
                <section className="portal-hero">
                    <div className="flex items-center gap-5">
                        <Avatar
                            name={`${auth.user.nombres} ${auth.user.apellidos}`}
                            photo={auth.user.profile_photo_url}
                        />
                        <div>
                            <p className="portal-hero-eyebrow">
                                {roleLabels[auth.user.rol]?.toUpperCase()}
                            </p>
                            <h2>
                                {auth.user.nombres} {auth.user.apellidos}
                            </h2>
                            <p>
                                {auth.user.cargo_designado ||
                                    "Portal de personal EPSEL"}
                            </p>
                        </div>
                    </div>
                </section>
                <div className="portal-card">
                    <div
                        className="portal-tabs"
                        aria-label="Secciones del perfil"
                    >
                        {[
                            ["profile", "Información personal"],
                            ["signature", "Mi firma"],
                            ["security", "Seguridad"],
                        ].map(([value, label]) => (
                            <button
                                key={value}
                                className={tab === value ? "active" : ""}
                                aria-pressed={tab === value}
                                onClick={() => setTab(value)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
                <div hidden={tab !== "profile"}>
                    <div className="portal-profile-grid">
                        <section className="portal-card">
                            <UpdateProfilePhotoForm />
                        </section>
                        <section className="portal-card">
                            <UpdateProfileInformationForm
                                mustVerifyEmail={mustVerifyEmail}
                                status={status}
                            />
                        </section>
                    </div>
                </div>
                <div hidden={tab !== "signature"}>
                    <div className="portal-profile-grid">
                        <section className="portal-card">
                            <UpdateSignatureForm />
                        </section>
                        <aside className="portal-tip self-start">
                            <PortalIcon name="shield" />
                            <p>
                                Tu firma se incorpora a las papeletas en las
                                acciones de envío y aprobación. Revisa que la
                                imagen sea clara y corresponda a tu firma antes
                                de continuar.
                            </p>
                        </aside>
                    </div>
                </div>
                <div hidden={tab !== "security"}>
                    <div className="portal-profile-grid">
                        <section className="portal-card">
                            <UpdatePasswordForm />
                        </section>
                        <section className="portal-card">
                            <DeleteUserForm />
                        </section>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
