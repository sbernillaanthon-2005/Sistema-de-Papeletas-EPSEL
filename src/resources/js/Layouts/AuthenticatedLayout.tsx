import { Link, usePage } from "@inertiajs/react";
import { PropsWithChildren, ReactNode, useState } from "react";
import { Dialog, DialogPanel, DialogTitle, Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import NotificationBell from "@/Components/NotificationBell";
import VoiceAssistant from "@/Components/VoiceAssistant";
import PortalIcon, { PortalIconName } from "@/Components/PortalIcon";
import { Avatar, roleLabels } from "@/Components/PortalUI";
import mascotGif from "../../images/mascota_epsel_animada.gif";
import "../../css/portal.css";

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { auth, flash } = usePage().props;
    const { url } = usePage();
    const user = auth.user;
    const [menuOpen, setMenuOpen] = useState(false);
    const role = roleLabels[user.rol] || user.rol_label;
    const isCreator = ["practitioner", "worker", "area_head"].includes(
        user.rol,
    );
    const home = user.rol === "admin" ? "admin.dashboard" : "dashboard";
    const nav: {
        label: string;
        href: string;
        icon: PortalIconName;
        active: boolean;
    }[] = [
        {
            label: user.rol === "admin" ? "Usuarios y accesos" : "Mi panel",
            href: route(home),
            icon: user.rol === "admin" ? "users" : "grid",
            active: /\/dashboard(?:\?|$)/.test(url),
        },
        {
            label:
                user.rol === "security"
                    ? "Control de papeletas"
                    : "Bandeja de papeletas",
            href: route("exit-slips.index"),
            icon: "file",
            active:
                url.startsWith("/exit-slips") &&
                !url.startsWith("/exit-slips/create"),
        },
        ...(isCreator
            ? [
                  {
                      label: "Nueva papeleta",
                      href: route("exit-slips.create"),
                      icon: "plus" as const,
                      active: url.startsWith("/exit-slips/create"),
                  },
              ]
            : []),
    ];

    if (user.rol === "admin") {
        nav.push({
            label: "Documentación Técnica",
            href: route("admin.documentation"),
            icon: "file",
            active: url.startsWith("/admin/documentation"),
        });
        nav.push({
            label: "Auditoría",
            href: route("admin.audit.index"),
            icon: "shield",
            active: url.startsWith("/admin/audit"),
        });
        nav.push({
            label: "Respaldos",
            href: route("admin.backups.index"),
            icon: "download",
            active: url.startsWith("/admin/backups"),
        });
    }

    if (user.rol === "hr") {
        nav.push({
            label: "Solicitantes",
            href: route("hr.solicitantes"),
            icon: "users",
            active: url.startsWith("/hr/solicitantes"),
        });
    }

    const sidebar = (
        <>
            <Link className="portal-brand" href={route(home)}>
                <span style={{ padding: 0, overflow: 'hidden', background: 'transparent' }}>
                    <img src={mascotGif} alt="EPSEL" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </span>
                <div>
                    EPSEL<small>SISTEMA DE PAPELETAS</small>
                </div>
            </Link>
            <div className="portal-workspace-label">ESPACIO DE TRABAJO</div>
            <nav
                className="portal-navigation"
                aria-label="Navegación principal"
            >
                {nav.map((item) => (
                    <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className={item.active ? "active" : ""}
                        aria-current={item.active ? "page" : undefined}
                    >
                        <PortalIcon name={item.icon} />
                        <span>{item.label}</span>
                        {item.active && <span className="portal-nav-dot" />}
                    </Link>
                ))}
            </nav>
            <div className="portal-sidebar-help">
                <span className="portal-help-icon">
                    <PortalIcon name="shield" />
                </span>
                <strong>Tu gestión, más simple.</strong>
                <p>Solicitudes, firmas y seguimiento en un solo lugar.</p>
            </div>
            <div className="portal-sidebar-bottom">
                <div className="portal-sidebar-user">
                    <Avatar
                        name={`${user.nombres} ${user.apellidos}`}
                        photo={user.profile_photo_url}
                        small
                    />
                    <div>
                        <strong>{user.nombres}</strong>
                        <span>{role}</span>
                    </div>
                </div>
                <Link
                    className="portal-logout"
                    href={route("logout")}
                    method="post"
                    as="button"
                >
                    <PortalIcon name="logout" />
                    Cerrar sesión
                </Link>
            </div>
        </>
    );
    return (
        <div className="portal-app">
            <a className="portal-skip" href="#portal-content">
                Ir al contenido
            </a>
            <aside className="portal-sidebar">{sidebar}</aside>
            <Dialog
                open={menuOpen}
                onClose={setMenuOpen}
                className="portal-mobile-dialog"
            >
                <div className="portal-backdrop" />
                <DialogPanel className="portal-mobile-sidebar">
                    <DialogTitle className="sr-only">
                        Menú de navegación
                    </DialogTitle>
                    <button
                        type="button"
                        className="portal-icon-button portal-menu-close"
                        onClick={() => setMenuOpen(false)}
                        aria-label="Cerrar menú"
                    >
                        <PortalIcon name="close" />
                    </button>
                    {sidebar}
                </DialogPanel>
            </Dialog>
            <div className="portal-workspace">
                <header className="portal-topbar">
                    <div className="portal-topbar-left">
                        <button
                            className="portal-icon-button portal-menu-button"
                            onClick={() => setMenuOpen(true)}
                            aria-label="Abrir menú"
                            aria-expanded={menuOpen}
                        >
                            <PortalIcon name="menu" />
                        </button>
                        <span className="portal-breadcrumb">
                            Portal interno
                            <PortalIcon name="chevron" />
                            <strong>{role}</strong>
                        </span>
                    </div>
                    <div className="portal-topbar-right">
                        <span className="portal-date">
                            {new Intl.DateTimeFormat("es-PE", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                                timeZone: "America/Lima",
                            }).format(new Date())}
                        </span>
                        <VoiceAssistant />
                        <NotificationBell />
                        <Menu as="div" className="portal-account-menu">
                            <MenuButton className="portal-profile-link" aria-label="Abrir menú de perfil">
                                <Avatar name={user.nombres} photo={user.profile_photo_url} small />
                            </MenuButton>
                            <MenuItems anchor="bottom end" className="portal-account-popover">
                                <div className="portal-account-summary">
                                    <Avatar name={`${user.nombres} ${user.apellidos}`} photo={user.profile_photo_url} small />
                                    <div><strong>{user.nombres} {user.apellidos}</strong><span>{role}</span></div>
                                </div>
                                <MenuItem>
                                    <Link href={route("profile.edit")} className="portal-account-item">
                                        <PortalIcon name="user" /> Mi perfil
                                    </Link>
                                </MenuItem>
                                <MenuItem>
                                    <Link href={route("logout")} method="post" as="button" className="portal-account-item portal-account-logout">
                                        <PortalIcon name="logout" /> Cerrar sesión
                                    </Link>
                                </MenuItem>
                            </MenuItems>
                        </Menu>
                    </div>
                </header>
                <div className="portal-page-heading">
                    <div>
                        <p>EPSEL · GESTIÓN DE PERSONAL</p>
                        {header}
                    </div>
                    <span className="portal-role-tag">
                        <PortalIcon name="shield" />
                        {role}
                    </span>
                </div>
                {flash?.success && (
                    <div className="portal-flash" role="status">
                        <PortalIcon name="check" />
                        {flash.success}
                    </div>
                )}
                <main className="portal-content" id="portal-content">
                    {children}
                </main>
                <footer className="portal-bottom-note">
                    EPSEL S.A. <span>Conectados para servir mejor.</span>
                </footer>
            </div>
        </div>
    );
}
