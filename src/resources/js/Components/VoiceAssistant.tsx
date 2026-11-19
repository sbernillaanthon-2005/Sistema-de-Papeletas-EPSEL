import { router, usePage } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";
import PortalIcon from "@/Components/PortalIcon";

type Recognition = {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    start: () => void;
    stop: () => void;
    onresult: ((event: any) => void) | null;
    onend: (() => void) | null;
    onerror: ((event: any) => void) | null;
};

const normalize = (value: string) => value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-PE")
    .replace(/[¿?¡!,.;:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const has = (text: string, words: string[]) => words.some((word) => text.includes(word));

const personAfter = (text: string, subjects: string[]) => {
    const subject = subjects.find((item) => text.includes(item));

    if (!subject) return "";

    return text
        .slice(text.lastIndexOf(subject) + subject.length)
        .replace(/^(?:\s+(?:de|del|para|a|al|la|el))?\s+/, "")
        .replace(/^(?:por|sobre)\s+/, "")
        .replace(/\b(?:por favor|gracias)\b/g, "")
        .trim();
};

export default function VoiceAssistant() {
    const user = usePage().props.auth.user;
    const [open, setOpen] = useState(false);
    const [listening, setListening] = useState(false);
    const [supported, setSupported] = useState(true);
    const [heard, setHeard] = useState("");
    const [message, setMessage] = useState("Pulsa el micrófono y habla con naturalidad.");
    const recognition = useRef<Recognition | null>(null);
    const keepListening = useRef(false);
    const container = useRef<HTMLDivElement>(null);

    const closePanel = () => {
        setOpen(false);
        if (listening || keepListening.current) {
            keepListening.current = false;
            recognition.current?.stop();
            setListening(false);
        }
    };

    useEffect(() => {
        const onPopoverOpen = (event: Event) => {
            if ((event as CustomEvent<string>).detail !== "voice") {
                closePanel();
            }
        };
        window.addEventListener("portal:popover-open", onPopoverOpen);
        return () => window.removeEventListener("portal:popover-open", onPopoverOpen);
    }, [listening]);

    useEffect(() => {
        if (!open && !listening) return;
        const outside = (event: MouseEvent) => {
            if (!container.current?.contains(event.target as Node)) {
                closePanel();
            }
        };
        const escape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                closePanel();
                container.current?.querySelector("button")?.focus();
            }
        };
        document.addEventListener("mousedown", outside);
        document.addEventListener("keydown", escape);
        return () => {
            document.removeEventListener("mousedown", outside);
            document.removeEventListener("keydown", escape);
        };
    }, [open, listening]);

    const respond = (text: string) => {
        setMessage(text);
        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = "es-PE";
            utterance.rate = 1.08;
            window.speechSynthesis.speak(utterance);
        }
    };

    const execute = (raw: string) => {
        const command = normalize(raw);
        const visit = (url: string, confirmation: string) => {
            respond(confirmation);
            router.visit(url);
        };
        const slipPerson = personAfter(command, ["papeletas", "papeleta", "solicitudes", "solicitud", "salidas", "salida"]);
        const userPerson = personAfter(command, ["usuarios", "usuario", "personas", "persona", "empleados", "empleado", "trabajadores", "trabajador"]);
        const canCreate = ["practitioner", "worker", "area_head"].includes(user.rol);

        if (has(command, ["ayuda", "comandos", "que puedo", "como uso", "instrucciones"])) {
            setOpen(true);
            respond("Puedes hablar naturalmente. Por ejemplo: muéstrame las salidas de Anthony, quiero ver mi cuenta o llévame a recursos humanos.");
            return;
        }

        if (has(command, ["volver", "ir atras", "regresar", "pagina anterior"])) {
            respond("Volviendo a la página anterior.");
            window.history.back();
            return;
        }

        if (has(command, ["leer pagina", "leer pantalla", "cuentame esta pagina", "resume esta pagina", "resumen de la pagina"])) {
            respond(document.querySelector("main")?.innerText.slice(0, 700) || "No encontré contenido para leer.");
            return;
        }

        if (slipPerson && has(command, ["buscar", "busca", "mostrar", "muestrame", "ver", "quiero", "dame", "ensename"])) {
            visit(route("exit-slips.index", { q: slipPerson }), "Buscando papeletas de " + slipPerson + ".");
            return;
        }

        if (has(command, ["inicio", "pagina principal", "panel principal", "mi panel", "ir al panel", "resumen general"])) {
            visit(route(user.rol === "admin" ? "admin.dashboard" : "dashboard"), "Abriendo tu panel.");
            return;
        }

        if (has(command, ["bandeja", "mis papeletas", "lista de papeletas", "ver papeletas", "abrir papeletas", "ver solicitudes"])) {
            visit(route("exit-slips.index"), "Abriendo la bandeja de papeletas.");
            return;
        }

        if (has(command, ["mi perfil", "abrir perfil", "perfil", "mi cuenta", "mis datos", "datos personales"])) {
            visit(route("profile.edit"), "Abriendo tu perfil.");
            return;
        }

        if (has(command, ["notificaciones", "notificacion", "avisos", "aviso", "alertas", "alerta"])) {
            document.querySelector<HTMLButtonElement>(".nb-bell-btn")?.click();
            respond("Abriendo notificaciones.");
            return;
        }

        if (canCreate && has(command, ["nueva papeleta", "crear papeleta", "registrar papeleta", "solicitar salida", "pedir salida"])) {
            visit(route("exit-slips.create"), "Abriendo una nueva papeleta.");
            return;
        }

        if (user.rol === "hr" && has(command, ["solicitantes", "recursos humanos", "colaboradores", "empleados"])) {
            visit(route("hr.solicitantes"), "Abriendo los solicitantes de Recursos Humanos.");
            return;
        }

        if (user.rol === "admin" && userPerson && has(command, ["buscar", "busca", "mostrar", "muestrame", "ver", "quiero"])) {
            visit(route("admin.dashboard", { q: userPerson }), "Buscando a " + userPerson + ".");
            return;
        }

        if (user.rol === "admin" && has(command, ["usuarios", "accesos", "personal", "equipo"])) {
            visit(route("admin.dashboard"), "Abriendo usuarios y accesos.");
            return;
        }

        if (user.rol === "admin" && has(command, ["auditoria", "historial", "actividad del sistema", "registro de actividad"])) {
            visit(route("admin.audit.index"), "Abriendo la auditoría del sistema.");
            return;
        }

        if (user.rol === "admin" && has(command, ["respaldos", "respaldo", "backup", "copia de seguridad", "copias de seguridad"])) {
            visit(route("admin.backups.index"), "Abriendo los respaldos del sistema.");
            return;
        }

        respond("No entendí “" + raw + "”. Prueba con frases como: “muéstrame las salidas de Anthony”, “quiero ver mi cuenta” o “abrir bandeja”.");
    };

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setSupported(false);
            return;
        }

        const instance: Recognition = new SpeechRecognition();
        instance.lang = "es-PE";
        instance.continuous = true;
        instance.interimResults = true;
        instance.onresult = (event) => {
            let text = "";
            for (let i = event.resultIndex; i < event.results.length; i += 1) text += event.results[i][0].transcript;
            setHeard(text.trim());
            if (event.results[event.results.length - 1].isFinal && text.trim()) execute(text.trim());
        };
        instance.onerror = (event) => {
            if (event.error === "not-allowed") {
                keepListening.current = false;
                setListening(false);
                setMessage("Debes permitir el uso del micrófono para activar la voz.");
            }
        };
        instance.onend = () => {
            if (keepListening.current) window.setTimeout(() => instance.start(), 250);
            else setListening(false);
        };
        recognition.current = instance;

        return () => {
            keepListening.current = false;
            instance.stop();
            window.speechSynthesis?.cancel();
        };
    }, []);

    const toggle = () => {
        window.dispatchEvent(new CustomEvent("portal:popover-open", { detail: "voice" }));

        if (!recognition.current) {
            setOpen((prev) => !prev);
            return;
        }

        if (listening) {
            keepListening.current = false;
            recognition.current.stop();
            setListening(false);
            setMessage("Asistente de voz en pausa.");
            return;
        }

        keepListening.current = true;
        setListening(true);
        setOpen(true);
        setHeard("");
        setMessage("Te escucho. Puedes hablar con tus propias palabras.");
        recognition.current.start();
    };

    return <div className="voice-assistant" ref={container}>
        <button type="button" className={"portal-icon-button voice-assistant-button " + (listening ? "is-listening" : "")} onClick={toggle} aria-label={listening ? "Pausar asistente de voz" : "Activar asistente de voz"} aria-pressed={listening} title="Asistente de voz"><PortalIcon name="mic" /></button>
        {(open || listening) && <section className="voice-assistant-panel" aria-live="polite">
            <div className="voice-assistant-head"><div><span className={listening ? "voice-status is-live" : "voice-status"} /> <strong>{listening ? "Escuchando" : "Asistente de voz"}</strong></div><button type="button" onClick={() => setOpen(false)} aria-label="Cerrar asistente"><PortalIcon name="close" /></button></div>
            <p className="voice-heard">{heard ? "“" + heard + "”" : message}</p>
            <div className="voice-command-list"><span>“Muéstrame las salidas de Anthony”</span><span>“Quiero ver mi cuenta”</span><span>“Llévame a recursos humanos”</span><span>“Abrir bandeja”</span><span>“Ayuda”</span></div>
            {!supported && <p className="voice-unsupported">Este navegador no admite reconocimiento de voz. Usa una versión reciente de Chrome o Edge.</p>}
        </section>}
    </div>;
}
