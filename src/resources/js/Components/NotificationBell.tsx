import PortalIcon from "@/Components/PortalIcon";
import { useEffect, useState, useRef, useCallback } from "react";
import { router, usePage } from "@inertiajs/react";
import axios from "axios";
import { subscribeNotifications } from "@/notificationChannel";

type Item = {
    id: number;
    titulo: string;
    mensaje: string;
    exit_slip_id: string | null;
    exit_slip_code: string | null;
    leida_at: string | null;
};

function readableTitle(title: string): string {
    // Las notificaciones anteriores conservan el código técnico en la base de datos.
    const withoutCode = title.replace(/^PAP-\d{8}-[A-Z0-9]+\s*[·•-]\s*/i, "");
    return withoutCode === title || withoutCode === "Firma pendiente"
        ? withoutCode
        : `Papeleta: ${withoutCode}`;
}

/**
 * Genera un tono de notificación de forma programática con la Web Audio API.
 * No requiere ningún archivo de audio externo.
 * Se ejecuta únicamente ante notificaciones nuevas vía WebSocket (tiempo real).
 */
function playNotificationSound() {
    try {
        const AudioCtx =
            window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();

        // Tonos: do5 → sol5 (intervalo de quinta ascendente, sonido amigable)
        const notes = [
            { freq: 523.25, start: 0, dur: 0.12 },
            { freq: 659.25, start: 0.1, dur: 0.12 },
            { freq: 783.99, start: 0.2, dur: 0.22 },
        ];

        notes.forEach(({ freq, start, dur }) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, ctx.currentTime + start);

            gain.gain.setValueAtTime(0, ctx.currentTime + start);
            gain.gain.linearRampToValueAtTime(
                0.22,
                ctx.currentTime + start + 0.02,
            );
            gain.gain.exponentialRampToValueAtTime(
                0.0001,
                ctx.currentTime + start + dur,
            );

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(ctx.currentTime + start);
            osc.stop(ctx.currentTime + start + dur + 0.01);
        });

        // Cerrar el contexto después de que terminen los tonos
        setTimeout(() => ctx.close(), 700);
    } catch {
        // La API de audio puede no estar disponible o bloqueada; silenciar silenciosamente
    }
}

export default function NotificationBell() {
    const user = usePage().props.auth.user;
    const [items, setItems] = useState<Item[]>([]);
    const [unread, setUnread] = useState(0);
    const [open, setOpen] = useState(false);
    const [failed, setFailed] = useState(false);
    const [busy, setBusy] = useState(false);
    // Guarda el contador previo para detectar NUEVAS notificaciones
    const prevUnreadRef = useRef(0);
    // Rastrear si es la carga inicial (no reproducir sonido al montar)
    const isFirstLoad = useRef(true);
    const container = useRef<HTMLDivElement>(null);

    // Cerrar cuando se abre otro popover de la barra superior
    useEffect(() => {
        const onPopoverOpen = (event: Event) => {
            if ((event as CustomEvent<string>).detail !== "notifications") {
                setOpen(false);
            }
        };
        window.addEventListener("portal:popover-open", onPopoverOpen);
        return () => window.removeEventListener("portal:popover-open", onPopoverOpen);
    }, []);

    // Cerrar al hacer clic fuera o presionar Escape
    useEffect(() => {
        if (!open) return;
        const outside = (event: MouseEvent) => {
            if (!container.current?.contains(event.target as Node))
                setOpen(false);
        };
        const escape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setOpen(false);
                container.current?.querySelector("button")?.focus();
            }
        };
        document.addEventListener("mousedown", outside);
        document.addEventListener("keydown", escape);
        return () => {
            document.removeEventListener("mousedown", outside);
            document.removeEventListener("keydown", escape);
        };
    }, [open]);

    const refresh = useCallback(async () => {
        try {
            const { data } = await axios.get("/notifications");
            const newUnread: number = data.unread;

            // Reproducir sonido solo si llegaron NUEVAS notificaciones
            // y no es la carga inicial de la página
            if (!isFirstLoad.current && newUnread > prevUnreadRef.current) {
                playNotificationSound();
            }

            prevUnreadRef.current = newUnread;
            isFirstLoad.current = false;
            setItems(data.items);
            setUnread(newUnread);
            setFailed(false);
        } catch {
            setFailed(true);
        }
    }, []);

    useEffect(() => {
        let active = true;
        const reload = () => {
            if (active) void refresh();
        };

        // Carga inicial
        reload();
        // Polling de respaldo cada 60 s (ante pérdida de WebSocket)
        const interval = setInterval(reload, 60000);

        // ─── WebSocket (Laravel Reverb) ───
        const unsubscribe = subscribeNotifications(String(user.id), () => {
            reload();
            router.reload({
                only: [
                    "slips", "counts", "inTransit", "slip", "can",
                    "exitSlips", "exitSlip", "history", "pagination",
                ],
            });
        });

        // Refrescar al volver a la pestaña
        window.addEventListener("focus", reload);
        return () => {
            active = false;
            clearInterval(interval);
            window.removeEventListener("focus", reload);
            unsubscribe();
        };
    }, [user.id, refresh]);

    const read = async (id: number | "all", url?: string | null) => {
        setBusy(true);
        try {
            await axios.patch(`/notifications/${id}/read`);
            await refresh();
            if (url) {
                setOpen(false);
                router.visit(route("papeletas.show", url));
            }
        } catch {
            setFailed(true);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="portal-bell" ref={container}>
            <button
                className={`portal-icon-button nb-bell-btn ${unread > 0 ? "nb-bell-btn--active" : ""}`}
                aria-label={`Notificaciones: ${unread} sin leer`}
                aria-expanded={open}
                aria-haspopup="true"
                onClick={() => {
                    const next = !open;
                    if (next) {
                        window.dispatchEvent(new CustomEvent("portal:popover-open", { detail: "notifications" }));
                    }
                    setOpen(next);
                    void refresh();
                }}
            >
                <PortalIcon name="bell" />
                {unread > 0 && (
                    <span
                        className="portal-bell-count nb-badge-pulse"
                        aria-live="polite"
                    >
                        {unread > 99 ? "99+" : unread}
                    </span>
                )}
            </button>

            {open && (
                <section
                    aria-label="Notificaciones"
                    className="portal-notifications nb-panel"
                >
                    {/* Cabecera del panel */}
                    <div className="nb-panel-header">
                        <div className="nb-panel-title">
                            <PortalIcon name="bell" />
                            <strong>Notificaciones</strong>
                            {unread > 0 && (
                                <span className="nb-count-tag">{unread} nuevas</span>
                            )}
                        </div>
                        <div className="nb-panel-actions">
                            {unread > 0 && (
                                <button
                                    disabled={busy}
                                    className="nb-read-all"
                                    onClick={() => void read("all")}
                                >
                                    Marcar todo
                                </button>
                            )}
                            <button
                                onClick={() => setOpen(false)}
                                aria-label="Cerrar notificaciones"
                                className="nb-close"
                            >
                                <PortalIcon name="close" />
                            </button>
                        </div>
                    </div>

                    {/* Error de conexión */}
                    {failed && (
                        <div className="nb-error" role="alert">
                            <PortalIcon name="alert" />
                            <span>
                                No se pudo actualizar.{" "}
                                <button
                                    className="nb-retry"
                                    onClick={() => void refresh()}
                                >
                                    Reintentar
                                </button>
                            </span>
                        </div>
                    )}

                    {/* Lista de notificaciones */}
                    <div className="nb-list">
                        {items.map((n) => (
                            <button
                                disabled={busy}
                                key={n.id}
                                className={`nb-item ${n.leida_at ? "" : "nb-item--unread"}`}
                                onClick={() => void read(n.id, n.exit_slip_code || n.exit_slip_id)}
                            >
                                <span className="nb-item-dot" />
                                <div className="nb-item-body">
                                    <strong>{readableTitle(n.titulo)}</strong>
                                    <p>{n.mensaje}</p>
                                </div>
                                {n.exit_slip_id && (
                                    <span className="nb-item-arrow">
                                        <PortalIcon name="chevron" />
                                    </span>
                                )}
                            </button>
                        ))}

                        {!items.length && !failed && (
                            <div className="nb-empty">
                                <PortalIcon name="bell" />
                                <p>No tienes notificaciones.</p>
                            </div>
                        )}
                    </div>
                </section>
            )}
        </div>
    );
}
