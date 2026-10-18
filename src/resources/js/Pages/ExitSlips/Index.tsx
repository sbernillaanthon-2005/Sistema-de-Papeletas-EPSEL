import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { PageProps } from "@/types";
import { useState, useEffect, useRef } from "react";
import PortalIcon from "@/Components/PortalIcon";
import {
    Avatar,
    StatCard,
    StatusBadge,
    PaginationBar,
    formatDate,
} from "@/Components/PortalUI";
import { statuses } from "@/types/exit-slip";

interface Slip {
    id: string;
    codigo: string;
    fecha_autorizada: string;
    motivo_label: string;
    estado: string;
    estado_label: string;
    apellidos_nombres: string;
    hora_salida?: string;
    hora_retorno?: string;
}
type Page = {
    current_page: number;
    last_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};
const content: Record<
    string,
    { title: string; intro: string; pending: string; hint: string }
> = {
    admin: {
        title: "Supervisión de papeletas",
        intro: "Consulta el recorrido de las solicitudes y su estado en cada etapa.",
        pending: "submitted",
        hint: "Pendientes de revisión del jefe",
    },
    hr: {
        title: "Gestión de Recursos Humanos",
        intro: "Revisa las solicitudes recibidas, valida su información y completa la autorización.",
        pending: "submitted_to_hr",
        hint: "Esperan tu revisión en RRHH",
    },
    security: {
        title: "Control de salidas y retornos",
        intro: "Verifica las autorizaciones y registra los movimientos del personal.",
        pending: "approved_by_hr",
        hint: "Autorizadas para el control de acceso",
    },
    area_head: {
        title: "Gestión de tu equipo",
        intro: "Revisa las solicitudes de tu equipo y mantén sus autorizaciones al día.",
        pending: "submitted",
        hint: "Solicitudes enviadas a jefatura",
    },
    practitioner: {
        title: "Mi espacio de practicante",
        intro: "Crea tu papeleta y acompaña cada paso de su aprobación, desde un solo lugar.",
        pending: "draft",
        hint: "Borradores por completar y enviar",
    },
    worker: {
        title: "Mi espacio de trabajo",
        intro: "Gestiona tus permisos de salida y consulta el avance de tus solicitudes.",
        pending: "draft",
        hint: "Borradores por completar y enviar",
    },
};
export default function Index({
    auth,
    exitSlips = [],
    pagination,
    counts = {},
    inTransit = 0,
    filters = {},
    canCreate,
    folders = [],
    selectedFolder = null,
}: PageProps<{
    exitSlips: Slip[];
    pagination: Page;
    counts: Record<string, number>;
    inTransit: number;
    filters: { q?: string; estado?: string; fecha?: string; solicitante?: string };
    canCreate: boolean;
    folders?: { id: string; name: string; dni: string; total: number; pending: number }[];
    selectedFolder?: string | null;
}>) {
    const config = content[auth.user.rol] || content.worker;
    const [query, setQuery] = useState(filters.q || "");
    const [date, setDate] = useState(filters.fecha || "");
    const [state, setState] = useState(filters.estado || "");
    const [folder, setFolder] = useState(selectedFolder || "");
    const [folderSearch, setFolderSearch] = useState("");
    const [busy, setBusy] = useState(false);

    // Ref para controlar el debounce del buscador principal
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const apply = (estado = state, q = query, fecha = date, solicitante = folder) =>
        router.get(
            route("exit-slips.index"),
            { q, estado, fecha, solicitante },
            {
                preserveState: true,
                preserveScroll: true,
                onStart: () => setBusy(true),
                onFinish: () => setBusy(false),
            },
        );

    // Dispara la búsqueda automáticamente 350ms después de que el usuario
    // deje de escribir en el campo de texto principal (debounce).
    // isMounted evita una petición extra redundante en el primer render.
    const isMounted = useRef(false);
    useEffect(() => {
        if (!isMounted.current) {
            isMounted.current = true;
            return;
        }
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            apply(state, query, date, folder);
        }, 350);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

    const total = Object.values(counts).reduce(
        (sum, value) => sum + Number(value),
        0,
    );
    const visibleFolders = folders.filter((item) =>
        `${item.name} ${item.dni}`.toLocaleLowerCase("es-PE").includes(folderSearch.toLocaleLowerCase("es-PE")),
    );
    return (
        <AuthenticatedLayout header={<h1>{config.title}</h1>}>
            <Head title={config.title} />
            <div className="portal-stack">
                <section className="portal-hero">
                    <div>
                        <p className="portal-hero-eyebrow">TU PORTAL EPSEL</p>
                        <h2>Hola, {auth.user.nombres.split(" ")[0]}.</h2>
                        <p>{config.intro}</p>
                    </div>
                    {canCreate && (
                        <Link
                            className="portal-btn portal-btn-white"
                            href={route("exit-slips.create")}
                        >
                            <PortalIcon name="plus" />
                            Nueva papeleta
                        </Link>
                    )}
                </section>
                <section
                    className="portal-stats"
                    aria-label="Resumen de papeletas"
                >
                    <StatCard
                        label="Total de papeletas"
                        value={total}
                        hint="Dentro de tu ámbito de acceso"
                        icon="file"
                        tone="blue"
                    />
                    <StatCard
                        label={
                            auth.user.rol === "security"
                                ? "Autorizadas"
                                : "Por atender"
                        }
                        value={Number(counts[config.pending] || 0)}
                        hint={config.hint}
                        icon="clock"
                        tone="amber"
                    />
                    <StatCard
                        label={
                            auth.user.rol === "security"
                                ? "Fuera de sede"
                                : "Aprobadas por RRHH"
                        }
                        value={
                            auth.user.rol === "security"
                                ? inTransit
                                : Number(counts.approved_by_hr || 0)
                        }
                        hint={
                            auth.user.rol === "security"
                                ? "Con salida y sin retorno registrado"
                                : "Con autorización completa"
                        }
                        icon="check"
                        tone="green"
                    />
                    <StatCard
                        label="Finalizadas"
                        value={Number(counts.completed || 0)}
                        hint="Salida y retorno registrados"
                        icon="shield"
                    />
                </section>
                {auth.user.rol === "hr" && (
                    <section className="portal-card hr-folder-browser" aria-label="Expedientes por solicitante">
                        <div className="hr-folder-head">
                            <div>
                                <p>ORGANIZACIÓN DE EXPEDIENTES</p>
                                <h2>Papeletas por solicitante</h2>
                                <span>Abre una carpeta para revisar el historial visible de cada persona.</span>
                            </div>

                            {/* Buscador mejorado con contador y botón limpiar */}
                            <div className="hr-folder-search-wrap">
                                {folderSearch ? (
                                    <span className="hr-folder-search-count">
                                        <strong>{visibleFolders.length}</strong> de {folders.length} carpeta{folders.length !== 1 ? "s" : ""}
                                    </span>
                                ) : (
                                    <span className="hr-folder-search-count">
                                        {folders.length} solicitante{folders.length !== 1 ? "s" : ""}
                                    </span>
                                )}
                                <div className="hr-folder-search">
                                    <PortalIcon name="search" />
                                    <input
                                        id="hr-folder-search-input"
                                        value={folderSearch}
                                        onChange={(event) => setFolderSearch(event.target.value)}
                                        placeholder="Buscar persona o DNI…"
                                        aria-label="Buscar carpeta de solicitante"
                                    />
                                    {folderSearch && (
                                        <button
                                            type="button"
                                            className="hr-folder-search-clear"
                                            aria-label="Limpiar búsqueda"
                                            onClick={() => setFolderSearch("")}
                                        >
                                            <PortalIcon name="close" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="hr-folder-grid">
                            {/* Carpeta comodín: todas las papeletas */}
                            <button
                                className={`hr-folder-card hr-folder-card--all ${!folder ? "is-selected" : ""}`}
                                onClick={() => { setFolder(""); apply(state, query, date, ""); }}
                            >
                                <span className="hr-folder-icon"><PortalIcon name="folder" /></span>
                                <span className="hr-folder-copy">
                                    <strong>Todas las papeletas</strong>
                                    <small>{folders.length} solicitante{folders.length !== 1 ? "s" : ""} · {total} registro{total !== 1 ? "s" : ""}</small>
                                </span>
                            </button>

                            {/* Carpetas individuales filtradas por búsqueda */}
                            {visibleFolders.map((item) => (
                                <button
                                    key={item.id}
                                    className={`hr-folder-card ${folder === item.id ? "is-selected" : ""}`}
                                    onClick={() => { setFolder(item.id); apply(state, query, date, item.id); }}
                                >
                                    <span className="hr-folder-icon"><PortalIcon name="folder" /></span>
                                    <span className="hr-folder-copy">
                                        <strong>{item.name}</strong>
                                        <small>DNI {item.dni} · {item.total} papeleta{item.total !== 1 ? "s" : ""}</small>
                                    </span>
                                    {item.pending > 0 && (
                                        <em>{item.pending} pendiente{item.pending !== 1 ? "s" : ""}</em>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Estado vacío mejorado con botón para limpiar */}
                        {folderSearch && visibleFolders.length === 0 && (
                            <div className="hr-folder-empty">
                                <PortalIcon name="search" />
                                <strong>Sin resultados para "{folderSearch}"</strong>
                                <span>Intenta con otro nombre o número de DNI.</span>
                                <button type="button" onClick={() => setFolderSearch("")}>Limpiar búsqueda</button>
                            </div>
                        )}
                    </section>
                )}
                <section className="portal-card" aria-busy={busy}>
                    <div className="portal-card-head">
                        <div>
                            <h2>
                                {auth.user.rol === "security"
                                    ? "Registro de movimientos"
                                    : "Bandeja de papeletas"}
                            </h2>
                            <p>Información actualizada para tu rol.</p>
                        </div>
                        <div className="portal-card-actions">
                            <a
                                className="portal-btn portal-btn-light portal-export-btn"
                                href={route("exit-slips.export", {
                                    q: query || undefined,
                                    estado: state || undefined,
                                    fecha: date || undefined,
                                    solicitante: folder || undefined,
                                })}
                            >
                                <PortalIcon name="download" />
                                Exportar Excel
                            </a>
                            <span className="portal-badge">
                                {pagination.total} registros
                            </span>
                        </div>
                    </div>
                    <div
                        className="portal-tabs"
                        aria-label="Vistas de papeletas"
                    >
                        {[
                            ["", "Todas"],
                            [config.pending, "Por atender"],
                            ["completed", "Finalizadas"],
                        ].map(([value, label]) => (
                            <button
                                key={value}
                                className={state === value ? "active" : ""}
                                aria-pressed={state === value}
                                onClick={() => {
                                    setState(value);
                                    apply(value);
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <form
                        className="portal-toolbar"
                        onSubmit={(event) => {
                            event.preventDefault();
                            apply();
                        }}
                    >
                        <div className="portal-search">
                            <PortalIcon name="search" />
                            <input
                                aria-label="Buscar por código o solicitante"
                                placeholder="Buscar código o solicitante…"
                                value={query}
                                maxLength={120}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>
                        <select
                            aria-label="Filtrar por estado"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                        >
                            <option value="">Todos los estados</option>
                            {Object.entries(statuses).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                        <input
                            aria-label="Fecha autorizada"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                        <button
                            className="portal-btn portal-btn-primary"
                            disabled={busy}
                        >
                            <PortalIcon name="filter" />
                            Filtrar
                        </button>
                        {(filters.q || filters.estado || filters.fecha || folder) && (
                            <button
                                type="button"
                                className="portal-btn portal-btn-light"
                                onClick={() => {
                                    setQuery("");
                                    setDate("");
                                    setState("");
                                    setFolder("");
                                    apply("", "", "", "");
                                }}
                            >
                                Limpiar
                            </button>
                        )}
                    </form>
                    {exitSlips.length ? (
                        <div className="portal-table-wrap">
                            <table className="portal-table">
                                <thead>
                                    <tr>
                                        <th>Papeleta</th>
                                        <th>Solicitante</th>
                                        <th>Fecha autorizada</th>
                                        <th>
                                            {auth.user.rol === "security"
                                                ? "Movimientos"
                                                : "Motivo"}
                                        </th>
                                        <th>Estado</th>
                                        <th>
                                            <span className="sr-only">
                                                Acciones
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {exitSlips.map((slip) => (
                                        <tr key={slip.id}>
                                            <td>
                                                <Link
                                                    className="portal-cell-code"
                                                    href={route(
                                                        "exit-slips.show",
                                                        slip.id,
                                                    )}
                                                >
                                                    <span>
                                                        <PortalIcon name="file" />
                                                    </span>
                                                    {slip.codigo}
                                                </Link>
                                            </td>
                                            <td>
                                                <div className="portal-person">
                                                    <Avatar
                                                        name={
                                                            slip.apellidos_nombres
                                                        }
                                                        small
                                                    />
                                                    <strong>
                                                        {slip.apellidos_nombres}
                                                    </strong>
                                                </div>
                                            </td>
                                            <td>
                                                {formatDate(
                                                    slip.fecha_autorizada,
                                                )}
                                            </td>
                                            <td className="portal-cell-muted">
                                                {auth.user.rol ===
                                                "security" ? (
                                                    <>
                                                        <div>
                                                            Salida:{" "}
                                                            {slip.hora_salida ||
                                                                "Pendiente"}
                                                        </div>
                                                        <div>
                                                            Retorno:{" "}
                                                            {slip.hora_retorno ||
                                                                "Pendiente"}
                                                        </div>
                                                    </>
                                                ) : (
                                                    slip.motivo_label
                                                )}
                                            </td>
                                            <td>
                                                <StatusBadge
                                                    state={slip.estado}
                                                    label={slip.estado_label}
                                                />
                                            </td>
                                            <td>
                                                <Link
                                                    className="portal-row-link"
                                                    href={route(
                                                        "exit-slips.show",
                                                        slip.id,
                                                    )}
                                                    aria-label={`Ver papeleta ${slip.codigo}`}
                                                >
                                                    Ver detalle
                                                    <PortalIcon name="arrow" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="portal-empty">
                            <PortalIcon name="file" />
                            <strong>
                                {total
                                    ? "No encontramos coincidencias"
                                    : "Tu bandeja está lista"}
                            </strong>
                            <p>
                                {total
                                    ? "Prueba con otro código, fecha o estado."
                                    : canCreate
                                      ? "Crea tu primera papeleta para iniciar su proceso de autorización."
                                      : "Las solicitudes aparecerán aquí cuando lleguen a tu etapa del proceso."}
                            </p>
                            {canCreate && !total && (
                                <Link
                                    className="portal-btn portal-btn-primary"
                                    href={route("exit-slips.create")}
                                >
                                    Crear mi primera papeleta
                                    <PortalIcon name="plus" />
                                </Link>
                            )}
                        </div>
                    )}
                    <PaginationBar page={pagination} />
                </section>
                <aside className="portal-tip">
                    <PortalIcon name="shield" />
                    <p>
                        {auth.user.rol === "security"
                            ? "Registra la salida y el retorno únicamente en la fecha autorizada. Cada movimiento queda en el historial de la papeleta."
                            : "Cada aprobación queda registrada. Después de la firma del jefe, el solicitante debe enviar la papeleta a RRHH para continuar."}
                    </p>
                </aside>
            </div>
        </AuthenticatedLayout>
    );
}
