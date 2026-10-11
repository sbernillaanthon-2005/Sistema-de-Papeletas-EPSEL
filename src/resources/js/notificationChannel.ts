import axios from "axios";
import Echo from "laravel-echo";
import Pusher from "pusher-js";

type Subscription = {
    userId: string;
    echo: Echo<"reverb">;
    listeners: Set<() => void>;
    disposeTimer?: ReturnType<typeof setTimeout>;
};

let current: Subscription | undefined;

function disconnect(subscription: Subscription) {
    clearTimeout(subscription.disposeTimer);
    subscription.listeners.clear();
    subscription.echo.disconnect();
    if (current === subscription) current = undefined;
}

// Layouts remount during Inertia navigation. Reuse the private connection across
// that transition, but disconnect on logout and before subscribing as another user.
export function subscribeNotifications(userId: string, listener: () => void) {
    if (!import.meta.env.VITE_REVERB_APP_KEY) return () => {};
    if (current && current.userId !== userId) disconnect(current);

    if (!current) {
        const echo = new Echo({
            broadcaster: "reverb",
            client: new Pusher(import.meta.env.VITE_REVERB_APP_KEY, {
                cluster: "mt1",
                wsHost: import.meta.env.VITE_REVERB_HOST || window.location.hostname,
                wsPort: Number(import.meta.env.VITE_REVERB_PORT || 8080),
                wssPort: Number(import.meta.env.VITE_REVERB_PORT || 443),
                forceTLS: import.meta.env.VITE_REVERB_SCHEME === "https",
                enabledTransports: ["ws", "wss"],
                channelAuthorization: {
                    endpoint: "/broadcasting/auth",
                    transport: "ajax",
                    customHandler: async (params, callback) => {
                        try {
                            const { data } = await axios.post("/broadcasting/auth", {
                                socket_id: params.socketId,
                                channel_name: params.channelName,
                            });
                            callback(null, data);
                        } catch {
                            callback(new Error("No se pudo autenticar el canal"), null);
                        }
                    },
                },
            }),
        });
        const subscription: Subscription = { userId, echo, listeners: new Set() };
        current = subscription;
        echo.private(`App.Models.User.${userId}`).listen(".notification.created", () => {
            subscription.listeners.forEach((notify) => notify());
        });
    }

    const subscription = current;
    clearTimeout(subscription.disposeTimer);
    subscription.listeners.add(listener);

    return () => {
        subscription.listeners.delete(listener);
        if (subscription.listeners.size === 0) {
            subscription.disposeTimer = setTimeout(() => disconnect(subscription), 100);
        }
    };
}

if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        if (current) disconnect(current);
    });
}
