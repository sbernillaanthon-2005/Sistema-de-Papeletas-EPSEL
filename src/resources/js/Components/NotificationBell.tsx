import { useEffect, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import axios from "axios";
import Echo from "laravel-echo";
import Pusher from "pusher-js";
type Item = {
    id: number;
    titulo: string;
    mensaje: string;
    exit_slip_id: string | null;
    leida_at: string | null;
};
export default function NotificationBell() {
    const user = usePage().props.auth.user;
    const [items, setItems] = useState<Item[]>([]),
        [unread, setUnread] = useState(0),
        [open, setOpen] = useState(false),
        [failed, setFailed] = useState(false),
        [busy, setBusy] = useState(false);
    const refresh = async () => {
        try {
            const { data } = await axios.get("/notifications");
            setItems(data.items);
            setUnread(data.unread);
            setFailed(false);
        } catch {
            setFailed(true);
        }
    };
    useEffect(() => {
        let active = true;
        const reload = () => {
            if (active) void refresh();
        };
        reload();
        const interval = setInterval(reload, 60000);
        let echo: Echo<"reverb"> | undefined;
        if (import.meta.env.VITE_REVERB_APP_KEY) {
            echo = new Echo({
                broadcaster: "reverb",
                client: new Pusher(import.meta.env.VITE_REVERB_APP_KEY, {
                    cluster: "mt1",
                    wsHost:
                        import.meta.env.VITE_REVERB_HOST ||
                        window.location.hostname,
                    wsPort: Number(import.meta.env.VITE_REVERB_PORT || 8080),
                    wssPort: Number(import.meta.env.VITE_REVERB_PORT || 443),
                    forceTLS: import.meta.env.VITE_REVERB_SCHEME === "https",
                    enabledTransports: ["ws", "wss"],
                    channelAuthorization: {
                        endpoint: "/broadcasting/auth",
                        transport: "ajax",
                        customHandler: async (params, callback) => {
                            try {
                                const { data } = await axios.post(
                                    "/broadcasting/auth",
                                    {
                                        socket_id: params.socketId,
                                        channel_name: params.channelName,
                                    },
                                );
                                callback(null, data);
                            } catch {
                                callback(
                                    new Error("No se pudo autenticar el canal"),
                                    null,
                                );
                            }
                        },
                    },
                }),
            });
            echo.private(`App.Models.User.${user.id}`).listen(
                ".notification.created",
                () => {
                    reload();
                    router.reload({ only: ["slips", "counts", "slip", "can"] });
                },
            );
        }
        window.addEventListener("focus", reload);
        return () => {
            active = false;
            clearInterval(interval);
            window.removeEventListener("focus", reload);
            echo?.disconnect();
        };
    }, [user.id]);
    const read = async (id: number | "all", url?: string | null) => {
        setBusy(true);
        try {
            await axios.patch(`/notifications/${id}/read`);
            await refresh();
            if (url) {
                setOpen(false);
                router.visit(route("exit-slips.show", url));
            }
        } catch {
            setFailed(true);
        } finally {
            setBusy(false);
        }
    };
    return (
        <div className="relative">
            <button
                className="rounded p-2 text-sm hover:bg-slate-100"
                aria-label={`Notificaciones: ${unread} sin leer`}
                aria-expanded={open}
                onClick={() => {
                    setOpen(!open);
                    void refresh();
                }}
            >
                <span aria-hidden="true">&#128276;</span>{" "}
                <span aria-live="polite">{unread}</span>
            </button>
            {open && (
                <section
                    aria-label="Notificaciones"
                    className="absolute right-0 z-50 mt-2 max-h-96 w-72 overflow-auto rounded-lg border bg-white p-3 shadow-xl"
                >
                    <div className="flex justify-between">
                        <strong>Notificaciones</strong>
                        <button
                            onClick={() => setOpen(false)}
                            aria-label="Cerrar notificaciones"
                        >
                            &#215;
                        </button>
                    </div>
                    {failed && (
                        <p role="alert" className="text-red-700">
                            No se pudo actualizar.{" "}
                            <button
                                className="underline"
                                onClick={() => void refresh()}
                            >
                                Reintentar
                            </button>
                        </p>
                    )}
                    {unread > 0 && (
                        <button
                            disabled={busy}
                            className="my-2 text-sm text-blue-800 underline"
                            onClick={() => void read("all")}
                        >
                            Marcar todas como leídas
                        </button>
                    )}
                    {items.map((n) => (
                        <button
                            disabled={busy}
                            key={n.id}
                            className={`my-1 block w-full rounded p-2 text-left text-sm ${n.leida_at ? "bg-white" : "bg-blue-50"}`}
                            onClick={() => void read(n.id, n.exit_slip_id)}
                        >
                            <strong>{n.titulo}</strong>
                            <p>{n.mensaje}</p>
                        </button>
                    ))}
                    {!items.length && !failed && (
                        <p className="p-3 text-sm text-slate-500">
                            No tienes notificaciones.
                        </p>
                    )}
                </section>
            )}
        </div>
    );
}
