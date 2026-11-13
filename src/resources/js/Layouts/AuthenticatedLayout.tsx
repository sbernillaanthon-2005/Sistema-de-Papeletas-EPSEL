import { Link, usePage } from "@inertiajs/react";
import { PropsWithChildren, ReactNode, useEffect, useState } from "react";
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
    const [visibleFlash, setVisibleFlash] = useState<string | null>(null);
    const [flashLeaving, setFlashLeaving] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
        typeof window !== "undefined" && window.localStorage.getItem("epsel-sidebar") === "collapsed",
    );
    const [theme, setTheme] = useState<"light" | "dark">(() => {
        if (typeof window === "undefined") return "light";

        const savedTheme = window.localStorage.getItem("epsel-theme");
        if (savedTheme === "light" || savedTheme === "dark") return savedTheme;

        return window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
    });
    const role = user.rol_label || roleLabels[user.rol];
    const isAdminDashboard = user.rol === "admin" && /^\/admin\/dashboard(?:\?|$)/.test(url);
    const isCreator = ["practitioner", "worker", "area_head"].includes(
        user.rol,
    );
    const home = user.rol === "admin" ? "admin.dashboard" : "dashboard";

    useEffect(() => {
        window.localStorage.setItem("epsel-theme", theme);
        document.documentElement.dataset.theme = theme;
    }, [theme]);

    useEffect(() => {
        if (!flash?.success) {
            setVisibleFlash(null);
            return;
        }

        setVisibleFlash(flash.success);
        setFlashLeaving(false);
        const fadeTimer = window.setTimeout(() => setFlashLeaving(true), 4000);
        const removeTimer = window.setTimeout(() => setVisibleFlash(null), 4350);

        return () => {
            window.clearTimeout(fadeTimer);
            window.clearTimeout(removeTimer);
        };
    }, [flash]);

    useEffect(() => {
        window.localStorage.setItem(
            "epsel-sidebar",
            sidebarCollapsed ? "collapsed" : "expanded",
        );
    }, [sidebarCollapsed]);

    const toggleTheme = () => {
        setTheme((currentTheme) =>
            currentTheme === "dark" ? "light" : "dark",
        );
    };
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
        nav.push({
            label: "Formatos de papeleta",
            href: route("admin.exit-slip-formats.index"),
            icon: "file",
            active: url.startsWith("/admin/exit-slip-formats"),
        });
        nav.push({
            label: "Documentación Técnica",
            href: route("admin.documentation"),
            icon: "file",
            active: url.startsWith("/admin/documentation"),
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
            <svg className="portal-sidebar-wave" viewBox="0 0 240 128" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                    <linearGradient id="portal-sidebar-wave-fill" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#08619c" />
                        <stop offset="62%" stopColor="#087fc3" />
                        <stop offset="100%" stopColor="#0a9bdd" />
                    </linearGradient>
                </defs>
                <path d="M0 0H240V95C213 105 197 120 165 117C128 113 113 91 78 91C43 91 25 111 0 116Z" fill="url(#portal-sidebar-wave-fill)" />
            </svg>
            <div className="portal-sidebar-brand-row">
                <Link className="portal-brand" href={route(home)}>
                    <span style={{ padding: 0, overflow: 'hidden', background: 'transparent', border: 0, borderRadius: 0 }}>
                        <img src={mascotGif} alt="EPSEL" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </span>
                    <div>
                        EPSEL<small>SISTEMA DE PAPELETAS</small>
                    </div>
                </Link>
                <button
                    type="button"
                    className="portal-sidebar-collapse"
                    onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
                    aria-label={sidebarCollapsed ? "Expandir menú lateral" : "Contraer menú lateral"}
                    aria-expanded={!sidebarCollapsed}
                    title={sidebarCollapsed ? "Expandir menú lateral" : "Contraer menú lateral"}
                >
                    <PortalIcon name="menu" />
                </button>
            </div>
            <div className="portal-workspace-label">ESPACIO DE TRABAJO</div>
            <nav
                className="portal-navigation"
                aria-label="Navegación principal"
            >
                {nav.map((item) => (
                    <Link
                        key={item.label}
                        href={item.href}
                        prefetch
                        onClick={() => setMenuOpen(false)}
                        className={item.active ? "active" : ""}
                        aria-current={item.active ? "page" : undefined}
                        title={item.label}
                    >
                        <span className="portal-nav-icon"><PortalIcon name={item.icon} /></span>
                        <span className="portal-nav-label">{item.label}</span>
                        <span className="portal-nav-chevron" aria-hidden="true"><PortalIcon name="chevron" /></span>
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
                <Link className="portal-sidebar-user" href={route("profile.edit")} title="Mi perfil">
                    <Avatar
                        name={`${user.nombres} ${user.apellidos}`}
                        photo={user.profile_photo_url}
                        small
                    />
                    <div>
                        <strong>{user.nombres}</strong>
                        <span>{role}</span>
                    </div>
                    <PortalIcon className="portal-sidebar-user-chevron" name="chevron" aria-hidden="true" />
                </Link>
                <Link
                    className="portal-logout"
                    href={route("logout")}
                    method="post"
                    as="button"
                >
                    <PortalIcon name="logout" />
                    <span>Cerrar sesión</span>
                </Link>
            </div>
        </>
    );
    return (
        <div
            className="portal-app portal-tailwind-shell selection:bg-epsel-600 selection:text-white"
            data-theme={theme}
            data-sidebar={sidebarCollapsed ? "collapsed" : "expanded"}
        >
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
                            {isAdminDashboard ? <>
                                <PortalIcon name="shield" />
                                <strong>Administración</strong>
                                <PortalIcon name="chevron" />
                                <strong>Usuarios y accesos</strong>
                            </> : <>
                                Portal interno
                                <PortalIcon name="chevron" />
                                <strong>{role}</strong>
                            </>}
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
                        <button
                            type="button"
                            className="portal-icon-button portal-theme-toggle"
                            onClick={toggleTheme}
                            aria-label={
                                theme === "dark"
                                    ? "Modo oscuro activo. Cambiar a modo claro"
                                    : "Modo claro activo. Cambiar a modo oscuro"
                            }
                            aria-pressed={theme === "dark"}
                            title={
                                theme === "dark"
                                    ? "Modo oscuro · cambiar a claro"
                                    : "Modo claro · cambiar a oscuro"
                            }
                        >
                            <PortalIcon
                                name={theme === "dark" ? "moon" : "sun"}
                            />
                        </button>
                        <VoiceAssistant />
                        <NotificationBell />
                        <Menu as="div" className="portal-account-menu">
                            <MenuButton className="portal-profile-link" aria-label="Abrir menú de perfil">
                                <Avatar name={user.nombres} photo={user.profile_photo_url} small />
                            </MenuButton>
                            <MenuItems anchor="bottom end" className="portal-account-popover">
                                <div className="portal-account-summary">
                                    <Avatar
                                        className="portal-account-summary-avatar"
                                        name={`${user.nombres} ${user.apellidos}`}
                                        photo={user.profile_photo_url}
                                        style={{ alignItems: "center", boxSizing: "border-box", display: "inline-flex", flex: "0 0 46px", height: 48, justifyContent: "center", lineHeight: 1, marginTop: 0, padding: 0, textAlign: "center", width: 46 }}
                                    />
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
                <div className={`portal-page-heading${isAdminDashboard ? " portal-page-heading-admin-dashboard" : ""}`}>
                    <div>
                        <p>EPSEL · GESTIÓN DE PERSONAL</p>
                        {header}
                    </div>
                    <span className="portal-role-tag">
                        <PortalIcon name="shield" />
                        {role}
                    </span>
                </div>
                {visibleFlash && (
                    <div className={`portal-flash${flashLeaving ? " portal-flash-leaving" : ""}`} role="status">
                        <PortalIcon name="check" />
                        {visibleFlash}
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
