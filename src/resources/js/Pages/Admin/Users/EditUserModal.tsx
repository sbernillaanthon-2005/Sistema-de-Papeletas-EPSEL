import { useEffect, useRef, useState } from "react";
import { DialogTitle } from "@headlessui/react";
import { useForm } from "@inertiajs/react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import Modal from "@/Components/Modal";
import PortalIcon from "@/Components/PortalIcon";
import { Avatar } from "@/Components/PortalUI";

export type Person = {
    id: string;
    nombres: string;
    apellidos: string;
    dni: string;
    rol: string;
    custom_role_id?: string | null;
    rol_label?: string;
    activo: boolean;
    area_id: string | null;
    jefe_id: string | null;
    jefe_responsable_nombre: string | null;
    area?: { nombre: string };
    jefe?: { nombres: string; apellidos: string };
    profile_photo_url?: string;
};

interface EditUserModalProps {
    show: boolean;
    user: Person | null;
    roles: { value: string; label: string; base_role?: string }[];
    areas: { id: string; nombre: string }[];
    responsibleHeads: string[];
    me: string;
    onClose: () => void;
}

gsap.registerPlugin(useGSAP);

export default function EditUserModal({
    show,
    user,
    roles,
    areas,
    responsibleHeads,
    me,
    onClose,
}: EditUserModalProps) {
    const [passwordVisible, setPasswordVisible] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const passwordConfirmRef = useRef<HTMLDivElement>(null);
    const switchKnobRef = useRef<HTMLSpanElement>(null);
    const statusCardRef = useRef<HTMLDivElement>(null);

    const edit = useForm({
        nombres: "",
        apellidos: "",
        activo: true,
        area_id: "",
        jefe_responsable_nombre: "",
        rol: "worker",
        password: "",
        password_confirmation: "",
    });

    const isSelf = user?.id === me;
    const isAreaHead = edit.data.rol === "area_head";

    // Synchronize form values whenever the selected user changes
    useEffect(() => {
        if (user) {
            edit.clearErrors();
            edit.setData({
                nombres: user.nombres || "",
                apellidos: user.apellidos || "",
                activo: user.activo ?? true,
                area_id: user.area_id || "",
                jefe_responsable_nombre:
                    user.jefe_responsable_nombre ||
                    (user.jefe ? `${user.jefe.nombres} ${user.jefe.apellidos}` : ""),
                rol: user.custom_role_id
                    ? `custom:${user.custom_role_id}`
                    : user.rol || "worker",
                password: "",
                password_confirmation: "",
            });
            setPasswordVisible(false);
        }
    }, [user]);

    // GSAP animations for entrance and micro-interactions
    useGSAP(
        () => {
            if (!show || !user) return;

            const prefersReducedMotion = window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches;

            if (prefersReducedMotion) return;

            // Entrance animation for modal contents
            const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

            tl.fromTo(
                ".edit-user-identity",
                { opacity: 0, y: -10, scale: 0.98 },
                { opacity: 1, y: 0, scale: 1, duration: 0.3 }
            ).fromTo(
                ".edit-user-section",
                { opacity: 0, y: 14 },
                { opacity: 1, y: 0, duration: 0.32, stagger: 0.05 },
                "-=0.15"
            );
        },
        { scope: containerRef, dependencies: [show, user?.id] }
    );

    // GSAP animation for revealing the password confirmation field
    useEffect(() => {
        if (!passwordConfirmRef.current) return;
        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        if (edit.data.password.length > 0) {
            if (prefersReducedMotion) {
                gsap.set(passwordConfirmRef.current, { height: "auto", opacity: 1 });
            } else {
                gsap.fromTo(
                    passwordConfirmRef.current,
                    { height: 0, opacity: 0, marginTop: 0 },
                    {
                        height: "auto",
                        opacity: 1,
                        marginTop: 12,
                        duration: 0.28,
                        ease: "power2.out",
                    }
                );
            }
        }
    }, [edit.data.password.length > 0]);

    // GSAP animation for the status switch toggle
    const handleStatusToggle = (newStatus: boolean) => {
        if (isSelf) return;
        edit.setData("activo", newStatus);

        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        if (!prefersReducedMotion && switchKnobRef.current) {
            gsap.to(switchKnobRef.current, {
                x: newStatus ? 22 : 0,
                duration: 0.22,
                ease: "back.out(1.4)",
            });
        }
        if (!prefersReducedMotion && statusCardRef.current) {
            gsap.fromTo(
                statusCardRef.current,
                { scale: 0.99 },
                { scale: 1, duration: 0.2, ease: "power1.out" }
            );
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        edit.transform((data) => ({
            ...data,
            area_id: data.area_id || null,
            jefe_responsable_nombre: data.jefe_responsable_nombre || null,
        }));

        edit.put(route("admin.users.update", user.id), {
            preserveScroll: true,
            onSuccess: () => {
                onClose();
            },
        });
    };

    const fullNamePreview = `${edit.data.nombres.trim()} ${edit.data.apellidos.trim()}`.trim() ||
        `${user?.nombres || ""} ${user?.apellidos || ""}`.trim() ||
        "Usuario";

    const currentRoleLabel =
        roles.find((r) => r.value === edit.data.rol)?.label ||
        user?.rol_label ||
        user?.rol ||
        "Personal";

    const passwordsMatch =
        edit.data.password &&
        edit.data.password_confirmation &&
        edit.data.password === edit.data.password_confirmation;

    const passwordsMismatch =
        edit.data.password &&
        edit.data.password_confirmation &&
        edit.data.password !== edit.data.password_confirmation;

    return (
        <Modal
            show={show}
            onClose={() => {
                if (!edit.processing) {
                    onClose();
                }
            }}
            closeable={!edit.processing}
            maxWidth="2xl"
        >
            <div ref={containerRef} className="edit-user-modal-wrapper">
                <form
                    onSubmit={handleSubmit}
                    className="edit-user-modal-form"
                    noValidate
                >
                    {/* Fixed Top Bar */}
                    <div className="edit-user-topbar-stripe" />

                    {/* Sticky Header */}
                    <header className="edit-user-header">
                        <div className="edit-user-header-main">
                            <div className="edit-user-identity">
                                <div className="edit-user-avatar-wrap">
                                    <Avatar
                                        name={fullNamePreview}
                                        photo={user?.profile_photo_url}
                                        className="edit-user-avatar"
                                    />
                                    <span
                                        className={`edit-user-avatar-indicator ${
                                            edit.data.activo
                                                ? "is-active"
                                                : "is-inactive"
                                        }`}
                                        title={
                                            edit.data.activo
                                                ? "Cuenta activa"
                                                : "Cuenta inactiva"
                                        }
                                    />
                                </div>
                                <div className="edit-user-header-text">
                                    <div className="edit-user-eyebrow-row">
                                        <span className="edit-user-badge-category">
                                            Directorio de Personal
                                        </span>
                                        <span className="edit-user-badge-dni">
                                            DNI: {user?.dni}
                                        </span>
                                    </div>
                                    <DialogTitle className="edit-user-title">
                                        Editar usuario
                                    </DialogTitle>
                                    <div className="edit-user-subtitle-row">
                                        <strong className="edit-user-current-name">
                                            {fullNamePreview}
                                        </strong>
                                        <span className="edit-user-bullet">·</span>
                                        <span className="edit-user-role-chip">
                                            {currentRoleLabel}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="edit-user-close-btn"
                                aria-label="Cerrar modal"
                                title="Cerrar (Esc)"
                                disabled={edit.processing}
                                onClick={onClose}
                            >
                                <PortalIcon name="close" />
                            </button>
                        </div>
                    </header>

                    {/* Scrollable Form Body */}
                    <div className="edit-user-scroll-body">
                        {/* Summary error banner if backend errors occur */}
                        {Object.values(edit.errors).length > 0 && (
                            <div className="edit-user-error-banner" role="alert">
                                <div className="edit-user-error-banner-icon">
                                    <PortalIcon name="alert" />
                                </div>
                                <div className="edit-user-error-banner-body">
                                    <strong>Por favor revisa los campos señalados:</strong>
                                    <ul>
                                        {Object.entries(edit.errors).map(([key, err]) => (
                                            <li key={key}>{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* SECTION 1: Personal Information */}
                        <section className="edit-user-section">
                            <div className="edit-user-section-head">
                                <div className="edit-user-section-icon edit-user-icon-user">
                                    <PortalIcon name="user" />
                                </div>
                                <div>
                                    <h3 className="edit-user-section-title">
                                        Información personal
                                    </h3>
                                    <p className="edit-user-section-desc">
                                        Identidad registrada en las papeletas y firmas de salida.
                                    </p>
                                </div>
                            </div>

                            <div className="edit-user-grid-2">
                                <div className="portal-field">
                                    <label htmlFor="edit-nombres">
                                        Nombres <span className="edit-user-required">*</span>
                                    </label>
                                    <input
                                        id="edit-nombres"
                                        type="text"
                                        required
                                        maxLength={255}
                                        autoComplete="given-name"
                                        value={edit.data.nombres}
                                        onChange={(e) => edit.setData("nombres", e.target.value)}
                                        aria-invalid={!!edit.errors.nombres}
                                        className="edit-user-input"
                                        placeholder="Nombres completos"
                                    />
                                    {edit.errors.nombres && (
                                        <small className="portal-error" role="alert">
                                            {edit.errors.nombres}
                                        </small>
                                    )}
                                </div>

                                <div className="portal-field">
                                    <label htmlFor="edit-apellidos">
                                        Apellidos <span className="edit-user-required">*</span>
                                    </label>
                                    <input
                                        id="edit-apellidos"
                                        type="text"
                                        required
                                        maxLength={255}
                                        autoComplete="family-name"
                                        value={edit.data.apellidos}
                                        onChange={(e) => edit.setData("apellidos", e.target.value)}
                                        aria-invalid={!!edit.errors.apellidos}
                                        className="edit-user-input"
                                        placeholder="Apellidos completos"
                                    />
                                    {edit.errors.apellidos && (
                                        <small className="portal-error" role="alert">
                                            {edit.errors.apellidos}
                                        </small>
                                    )}
                                </div>
                            </div>

                            <div className="edit-user-info-pill">
                                <PortalIcon name="shield" />
                                <span>
                                    El <strong>DNI {user?.dni}</strong> está vinculado permanentemente para trazabilidad de auditoría.
                                </span>
                            </div>
                        </section>

                        {/* SECTION 2: Role and Organization */}
                        <section className="edit-user-section">
                            <div className="edit-user-section-head">
                                <div className="edit-user-section-icon edit-user-icon-shield">
                                    <PortalIcon name="shield" />
                                </div>
                                <div>
                                    <h3 className="edit-user-section-title">
                                        Organización y permisos
                                    </h3>
                                    <p className="edit-user-section-desc">
                                        Define las facultades dentro del flujo y la jerarquía de aprobación.
                                    </p>
                                </div>
                            </div>

                            <div className="portal-field">
                                <div className="flex items-center justify-between">
                                    <label htmlFor="edit-role">Rol asignado</label>
                                    {isSelf && (
                                        <span className="edit-user-chip-locked">
                                            Protegido por el sistema
                                        </span>
                                    )}
                                </div>
                                <select
                                    id="edit-role"
                                    value={edit.data.rol}
                                    onChange={(e) => edit.setData("rol", e.target.value)}
                                    aria-invalid={!!edit.errors.rol}
                                    disabled={isSelf}
                                    className="edit-user-select"
                                >
                                    {user?.rol === "admin" && (
                                        <option value="admin">Administrador del sistema</option>
                                    )}
                                    {roles.map((role) => (
                                        <option key={role.value} value={role.value}>
                                            {role.label}
                                        </option>
                                    ))}
                                </select>
                                {isSelf ? (
                                    <small className="edit-user-hint-warning">
                                        Tu propio rol de administrador no puede modificarse por seguridad.
                                    </small>
                                ) : (
                                    <small className="edit-user-hint">
                                        Determina si puede formular papeletas, autorizar como jefatura o supervisar en vigilancia.
                                    </small>
                                )}
                                {edit.errors.rol && (
                                    <small className="portal-error" role="alert">
                                        {edit.errors.rol}
                                    </small>
                                )}
                            </div>

                            <div className="edit-user-grid-2">
                                <div className="portal-field">
                                    <label htmlFor="edit-area">
                                        Área de trabajo{" "}
                                        {isAreaHead && (
                                            <span className="edit-user-required">
                                                (Requerida para Jefe de Área)
                                            </span>
                                        )}
                                    </label>
                                    <select
                                        id="edit-area"
                                        value={edit.data.area_id}
                                        onChange={(e) => edit.setData("area_id", e.target.value)}
                                        aria-invalid={!!edit.errors.area_id}
                                        className="edit-user-select"
                                    >
                                        <option value="">Sin área asignada</option>
                                        {areas.map((area) => (
                                            <option key={area.id} value={area.id}>
                                                {area.nombre}
                                            </option>
                                        ))}
                                    </select>
                                    {edit.errors.area_id && (
                                        <small className="portal-error" role="alert">
                                            {edit.errors.area_id}
                                        </small>
                                    )}
                                </div>

                                <div className="portal-field">
                                    <label htmlFor="edit-head">
                                        Jefe responsable de aprobación
                                    </label>
                                    <select
                                        id="edit-head"
                                        value={edit.data.jefe_responsable_nombre}
                                        onChange={(e) =>
                                            edit.setData("jefe_responsable_nombre", e.target.value)
                                        }
                                        aria-invalid={!!edit.errors.jefe_responsable_nombre}
                                        className="edit-user-select"
                                    >
                                        <option value="">Sin jefe asignado</option>
                                        {responsibleHeads.map((name) => (
                                            <option key={name} value={name}>
                                                {name}
                                            </option>
                                        ))}
                                    </select>
                                    {edit.errors.jefe_responsable_nombre && (
                                        <small className="portal-error" role="alert">
                                            {edit.errors.jefe_responsable_nombre}
                                        </small>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* SECTION 3: Security & Credentials */}
                        <section className="edit-user-section">
                            <div className="edit-user-section-head">
                                <div className="edit-user-section-icon edit-user-icon-key">
                                    <PortalIcon name="settings" />
                                </div>
                                <div>
                                    <h3 className="edit-user-section-title">
                                        Seguridad y contraseña
                                    </h3>
                                    <p className="edit-user-section-desc">
                                        Actualiza la clave solo si el usuario necesita restablecer su acceso.
                                    </p>
                                </div>
                            </div>

                            <div className="portal-field">
                                <label htmlFor="edit-password">
                                    Nueva contraseña (opcional)
                                </label>
                                <div className="edit-user-password-wrap">
                                    <input
                                        id="edit-password"
                                        type={passwordVisible ? "text" : "password"}
                                        autoComplete="new-password"
                                        minLength={8}
                                        value={edit.data.password}
                                        onChange={(e) => edit.setData("password", e.target.value)}
                                        aria-invalid={!!edit.errors.password}
                                        className="edit-user-input pr-24"
                                        placeholder="Mínimo 8 caracteres"
                                    />
                                    <button
                                        type="button"
                                        className="edit-user-eye-btn"
                                        aria-pressed={passwordVisible}
                                        onClick={() => setPasswordVisible(!passwordVisible)}
                                        title={passwordVisible ? "Ocultar contraseña" : "Ver contraseña"}
                                    >
                                        <PortalIcon name={passwordVisible ? "eye" : "eye"} />
                                        <span>{passwordVisible ? "Ocultar" : "Mostrar"}</span>
                                    </button>
                                </div>
                                <small className="edit-user-hint">
                                    Déjala en blanco si no deseas cambiarla. Si ingresas una clave, se requerirá confirmación.
                                </small>
                                {edit.errors.password && (
                                    <small className="portal-error" role="alert">
                                        {edit.errors.password}
                                    </small>
                                )}
                            </div>

                            {/* Dynamically revealed password confirmation */}
                            {edit.data.password.length > 0 && (
                                <div
                                    ref={passwordConfirmRef}
                                    className="portal-field edit-user-confirm-reveal"
                                >
                                    <div className="flex items-center justify-between">
                                        <label htmlFor="edit-password-confirmation">
                                            Confirmar nueva contraseña <span className="edit-user-required">*</span>
                                        </label>
                                        {passwordsMatch && (
                                            <span className="edit-user-match-badge is-valid">
                                                <PortalIcon name="check" /> Las contraseñas coinciden
                                            </span>
                                        )}
                                        {passwordsMismatch && (
                                            <span className="edit-user-match-badge is-invalid">
                                                No coinciden aún
                                            </span>
                                        )}
                                    </div>
                                    <input
                                        id="edit-password-confirmation"
                                        type={passwordVisible ? "text" : "password"}
                                        autoComplete="new-password"
                                        minLength={8}
                                        value={edit.data.password_confirmation}
                                        onChange={(e) =>
                                            edit.setData("password_confirmation", e.target.value)
                                        }
                                        aria-invalid={!!edit.errors.password}
                                        className="edit-user-input"
                                        placeholder="Vuelve a escribir la nueva contraseña"
                                    />
                                </div>
                            )}
                        </section>

                        {/* SECTION 4: Account Access State */}
                        <section className="edit-user-section">
                            <div
                                ref={statusCardRef}
                                className={`edit-user-status-card ${
                                    edit.data.activo ? "is-active" : "is-inactive"
                                }`}
                            >
                                <div className="edit-user-status-copy">
                                    <span className="edit-user-status-eyebrow">
                                        ESTADO DE ACCESO AL SISTEMA
                                    </span>
                                    <div className="edit-user-status-headline">
                                        <span
                                            className={`edit-user-status-pulse ${
                                                edit.data.activo
                                                    ? "is-active"
                                                    : "is-inactive"
                                            }`}
                                        />
                                        <h4>
                                            {edit.data.activo
                                                ? "Cuenta activa y autorizada"
                                                : "Cuenta desactivada"}
                                        </h4>
                                    </div>
                                    <p>
                                        {edit.data.activo
                                            ? "El personal puede autenticarse, formular papeletas y recibir notificaciones oficiales."
                                            : "No podrá iniciar sesión ni tramitar papeletas hasta que un administrador reactive su acceso."}
                                    </p>
                                    {isSelf && (
                                        <small className="edit-user-hint-warning">
                                            Tu propia cuenta de administrador no puede desactivarse.
                                        </small>
                                    )}
                                </div>

                                <div className="edit-user-status-toggle-wrap">
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={edit.data.activo}
                                        disabled={isSelf}
                                        onClick={() => handleStatusToggle(!edit.data.activo)}
                                        className={`edit-user-switch-btn ${
                                            edit.data.activo ? "is-checked" : ""
                                        }`}
                                    >
                                        <span
                                            ref={switchKnobRef}
                                            className="edit-user-switch-thumb"
                                        />
                                    </button>
                                    <span className="edit-user-switch-label">
                                        {edit.data.activo ? "Activa" : "Desactivada"}
                                    </span>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Sticky Modal Footer */}
                    <footer className="edit-user-footer">
                        <div className="edit-user-footer-left">
                            <span className="edit-user-shortcut-hint">
                                Presiona <kbd>Esc</kbd> para cancelar
                            </span>
                        </div>
                        <div className="edit-user-footer-actions">
                            <button
                                type="button"
                                className="portal-btn portal-btn-light edit-user-btn-cancel"
                                disabled={edit.processing}
                                onClick={onClose}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="portal-btn portal-btn-primary edit-user-btn-submit"
                                disabled={
                                    edit.processing ||
                                    !edit.data.nombres.trim() ||
                                    !edit.data.apellidos.trim() ||
                                    Boolean(passwordsMismatch)
                                }
                            >
                                {edit.processing ? (
                                    <>
                                        <span className="edit-user-spinner" />
                                        <span>Guardando…</span>
                                    </>
                                ) : (
                                    <>
                                        <PortalIcon name="check" />
                                        <span>Guardar cambios</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </footer>
                </form>
            </div>
        </Modal>
    );
}

