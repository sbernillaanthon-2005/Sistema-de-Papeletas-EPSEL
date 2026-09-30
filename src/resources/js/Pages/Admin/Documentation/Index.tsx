import { Head } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PortalIcon from "@/Components/PortalIcon";
import { useEffect, useRef, useState } from "react";
import { Block, chapterText, guide, layers, workflow } from "./guide";
import "../../../../css/documentation.css";

const normalize = (text: string) =>
    text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
const initialChapter = () => {
    if (typeof window === "undefined") return guide[0].id;
    const id = window.location.hash.slice(1).split("/")[0];
    return guide.some((chapter) => chapter.id === id) ? id : guide[0].id;
};

function ContentBlock({ block }: { block: Block }) {
    if (block.type === "text") return <p>{block.text}</p>;
    if (block.type === "list") {
        const Tag = block.ordered ? "ol" : "ul";
        return (
            <Tag>
                {block.items.map((item) => (
                    <li key={item}>{item}</li>
                ))}
            </Tag>
        );
    }
    if (block.type === "note")
        return (
            <aside className="guide-note">
                <PortalIcon name="shield" />
                <div>
                    <strong>{block.title}</strong>
                    <p>{block.text}</p>
                </div>
            </aside>
        );
    if (block.type === "table")
        return (
            <div
                className="guide-table-scroll"
                tabIndex={0}
                role="region"
                aria-label={block.headers.join(", ")}
            >
                <table>
                    <thead>
                        <tr>
                            {block.headers.map((header) => (
                                <th key={header} scope="col">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {block.rows.map((row, index) => (
                            <tr key={index}>
                                {row.map((cell, column) =>
                                    column === 0 ? (
                                        <th key={column} scope="row">
                                            {cell}
                                        </th>
                                    ) : (
                                        <td key={column}>{cell}</td>
                                    ),
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    return (
        <div className="guide-code">
            <div>
                <PortalIcon name="file" />
                {block.label}
            </div>
            <pre>
                <code>{block.text}</code>
            </pre>
        </div>
    );
}

function ProcessDiagram({ architecture = false }: { architecture?: boolean }) {
    const [selected, setSelected] = useState(0);
    const entries = architecture
        ? layers.map((layer) => ({ label: layer.title, caption: layer.tech }))
        : workflow.map((step) => ({ label: step.label, caption: step.actor }));
    const step = workflow[selected];
    const layer = layers[selected];
    return (
        <section
            className={`guide-diagram ${architecture ? "guide-diagram-architecture" : ""}`}
            aria-label={
                architecture
                    ? "Recorrido de una petición"
                    : "Explorador de estados"
            }
        >
            <div className="guide-diagram-heading">
                <span>
                    <span className="guide-live-dot" />
                    EXPLORA EL RECORRIDO
                </span>
                <small>Selecciona una etapa</small>
            </div>
            <div
                className="guide-diagram-steps"
                role="group"
                aria-label="Etapas"
            >
                {entries.map((entry, index) => (
                    <button
                        type="button"
                        key={entry.label}
                        aria-pressed={index === selected}
                        aria-controls={
                            architecture
                                ? "architecture-detail"
                                : "workflow-detail"
                        }
                        className={index === selected ? "is-selected" : ""}
                        onClick={() => setSelected(index)}
                    >
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <strong>{entry.label}</strong>
                        {architecture && <small>{entry.caption}</small>}
                    </button>
                ))}
            </div>
            <div
                className="guide-diagram-detail"
                id={architecture ? "architecture-detail" : "workflow-detail"}
                aria-live="polite"
            >
                <div>
                    <p className="guide-kicker">
                        {architecture ? layer.tech : step.actor}
                    </p>
                    <h3>{architecture ? layer.title : step.action}</h3>
                    <p>{architecture ? layer.detail : step.detail}</p>
                </div>
                <div className="guide-diagram-reference">
                    <span>
                        {architecture ? "PUNTO DE ENTRADA" : "ESTADO Y CÓDIGO"}
                    </span>
                    {!architecture && <code>{step.state}</code>}
                    <small>{architecture ? layer.path : step.source}</small>
                </div>
            </div>
        </section>
    );
}

export default function DocumentationIndex() {
    const [selected, setSelected] = useState(initialChapter);
    const [query, setQuery] = useState("");
    const [copied, setCopied] = useState("");
    const articleTitle = useRef<HTMLHeadingElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const copyTimer = useRef<ReturnType<typeof setTimeout>>();
    const index = guide.findIndex((chapter) => chapter.id === selected);
    const chapter = guide[index];
    const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);
    const results = guide.filter((item) =>
        terms.every((term) => normalize(chapterText(item)).includes(term)),
    );
    const groups = [...new Set(guide.map((item) => item.category))];
    const minutes = Math.max(
        1,
        Math.ceil(chapterText(chapter).split(/\s+/).length / 200),
    );

    useEffect(() => {
        const sync = () => {
            const id = window.location.hash.slice(1).split("/")[0];
            if (guide.some((item) => item.id === id)) setSelected(id);
        };
        const shortcut = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement;
            if (
                event.key === "/" &&
                !["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) &&
                !target.isContentEditable &&
                !event.ctrlKey &&
                !event.metaKey &&
                !event.altKey
            ) {
                event.preventDefault();
                searchRef.current?.focus();
            }
        };
        window.addEventListener("hashchange", sync);
        window.addEventListener("keydown", shortcut);
        return () => {
            window.removeEventListener("hashchange", sync);
            window.removeEventListener("keydown", shortcut);
            clearTimeout(copyTimer.current);
        };
    }, []);

    const openChapter = (id: string) => {
        window.history.pushState(null, "", `#${id}`);
        setSelected(id);
        setCopied("");
        requestAnimationFrame(() => {
            articleTitle.current?.focus({ preventScroll: true });
            articleTitle.current?.scrollIntoView({
                behavior: "auto",
                block: "start",
            });
        });
    };
    const shareChapter = async () => {
        try {
            await navigator.clipboard.writeText(
                `${window.location.origin}${window.location.pathname}#${chapter.id}`,
            );
            setCopied("Enlace copiado");
        } catch {
            setCopied("Copia el enlace desde la barra de direcciones");
        }
        clearTimeout(copyTimer.current);
        copyTimer.current = setTimeout(() => setCopied(""), 3500);
    };

    return (
        <AuthenticatedLayout header={<h1>Centro de conocimiento</h1>}>
            <Head title={`${chapter.title} · Guía técnica EPSEL`} />
            <div className="guide-page">
                <section className="guide-hero">
                    <div className="guide-hero-copy">
                        <p className="guide-kicker">
                            <span className="guide-live-dot" />
                            INGENIERÍA · PRODUCTO · OPERACIÓN
                        </p>
                        <h2>
                            Conoce el sistema.
                            <br />
                            <span>Construye lo que sigue.</span>
                        </h2>
                        <p>
                            La historia, las decisiones y el funcionamiento de
                            EPSEL Papeletas. Una guía para entender el proyecto
                            de principio a fin.
                        </p>
                        <div className="guide-hero-meta">
                            <span>Guía para desarrolladores</span>
                            <span>Edición · 30 sep 2026</span>
                        </div>
                    </div>
                    <div className="guide-hero-map" aria-hidden="true">
                        <div className="guide-map-orbit" />
                        <div className="guide-map-core">
                            <PortalIcon name="drop" />
                            <strong>EPSEL</strong>
                            <small>PAPELETAS</small>
                        </div>
                        <span className="guide-map-node node-a">
                            <PortalIcon name="file" />
                            Solicitud
                        </span>
                        <span className="guide-map-node node-b">
                            <PortalIcon name="check" />
                            Aprobación
                        </span>
                        <span className="guide-map-node node-c">
                            <PortalIcon name="shield" />
                            Control
                        </span>
                        <span className="guide-map-label">
                            UN PROCESO. CADA PASO CONECTADO.
                        </span>
                    </div>
                </section>
                <div className="guide-intro-strip">
                    <span>
                        <PortalIcon name="file" />
                        <strong>10</strong> capítulos conectados
                    </span>
                    <span>
                        <PortalIcon name="users" />
                        <strong>6</strong> roles de operación
                    </span>
                    <span>
                        <PortalIcon name="grid" />
                        Del contexto al código
                    </span>
                    <a href="#guide-reading">
                        Ir a la lectura
                        <PortalIcon name="arrow" />
                    </a>
                </div>
                <div className="guide-workspace">
                    <aside className="guide-sidebar">
                        <div className="guide-search">
                            <PortalIcon name="search" />
                            <input
                                ref={searchRef}
                                id="guide-search"
                                aria-label="Buscar en la guía"
                                value={query}
                                onChange={(event) =>
                                    setQuery(event.target.value)
                                }
                                placeholder="Buscar en la guía…"
                                autoComplete="off"
                            />
                            {query ? (
                                <button
                                    aria-label="Limpiar búsqueda"
                                    onClick={() => {
                                        setQuery("");
                                        searchRef.current?.focus();
                                    }}
                                >
                                    <PortalIcon name="close" />
                                </button>
                            ) : (
                                <kbd>/</kbd>
                            )}
                        </div>
                        <p className="guide-search-status" role="status">
                            {query.trim()
                                ? `${results.length} capítulos encontrados`
                                : "TU RUTA DE LECTURA"}
                        </p>
                        <nav aria-label="Capítulos de la guía">
                            {groups.map((group) => {
                                const items = results.filter(
                                    (item) => item.category === group,
                                );
                                return items.length ? (
                                    <div
                                        className="guide-nav-group"
                                        key={group}
                                    >
                                        <p>{group}</p>
                                        {items.map((item) => (
                                            <a
                                                key={item.id}
                                                href={`#${item.id}`}
                                                className={
                                                    selected === item.id
                                                        ? "is-active"
                                                        : ""
                                                }
                                                aria-current={
                                                    selected === item.id
                                                        ? "page"
                                                        : undefined
                                                }
                                                onClick={(event) => {
                                                    event.preventDefault();
                                                    openChapter(item.id);
                                                }}
                                            >
                                                <span>
                                                    {String(
                                                        guide.indexOf(item) + 1,
                                                    ).padStart(2, "0")}
                                                </span>
                                                <div>
                                                    <strong>
                                                        {item.title}
                                                    </strong>
                                                    {query.trim() && (
                                                        <small>
                                                            {item.summary}
                                                        </small>
                                                    )}
                                                </div>
                                                {selected === item.id && (
                                                    <PortalIcon name="chevron" />
                                                )}
                                            </a>
                                        ))}
                                    </div>
                                ) : null;
                            })}
                        </nav>
                        {!results.length && (
                            <div className="guide-no-results">
                                <PortalIcon name="search" />
                                <strong>No hay coincidencias</strong>
                                <p>
                                    Prueba con «firma», «Docker» o «vigilancia».
                                </p>
                                <button onClick={() => setQuery("")}>
                                    Ver todos los capítulos
                                </button>
                            </div>
                        )}
                        <div className="guide-sidebar-foot">
                            <PortalIcon name="shield" />
                            <p>
                                Una referencia compartida
                                <br />
                                <strong>
                                    para mantener y hacer crecer EPSEL.
                                </strong>
                            </p>
                        </div>
                    </aside>
                    <article className="guide-article" id="guide-reading">
                        <header className="guide-article-header">
                            <div className="guide-article-meta">
                                <span>
                                    CAPÍTULO{" "}
                                    {String(index + 1).padStart(2, "0")} / 10
                                </span>
                                <span>
                                    <PortalIcon name="clock" />
                                    {minutes} min de lectura
                                </span>
                            </div>
                            <h2 ref={articleTitle} tabIndex={-1}>
                                {chapter.title}
                            </h2>
                            <p>{chapter.summary}</p>
                            <div className="guide-article-tools">
                                <span>{chapter.category}</span>
                                <button
                                    onClick={() => void shareChapter()}
                                    aria-label="Copiar enlace al capítulo"
                                >
                                    <PortalIcon name="arrow" />
                                    Compartir
                                </button>
                                <button onClick={() => window.print()}>
                                    <PortalIcon name="file" />
                                    Imprimir capítulo
                                </button>
                            </div>
                            <span className="guide-copy-status" role="status">
                                {copied}
                            </span>
                        </header>
                        <details className="guide-mobile-toc">
                            <summary>
                                En este capítulo{" "}
                                <span>{chapter.sections.length} apartados</span>
                            </summary>
                            <nav aria-label="Apartados del capítulo">
                                {chapter.sections.map((section) => (
                                    <a
                                        key={section.id}
                                        href={`#${chapter.id}/${section.id}`}
                                    >
                                        {section.title}
                                    </a>
                                ))}
                            </nav>
                        </details>
                        {chapter.id === "flujo" && (
                            <ProcessDiagram key="workflow" />
                        )}
                        {chapter.id === "arquitectura" && (
                            <ProcessDiagram architecture key="architecture" />
                        )}
                        <div className="guide-prose">
                            {chapter.sections.map((section, sectionIndex) => (
                                <section
                                    id={`${chapter.id}/${section.id}`}
                                    key={section.id}
                                >
                                    <div className="guide-section-heading">
                                        <span>
                                            {String(sectionIndex + 1).padStart(
                                                2,
                                                "0",
                                            )}
                                        </span>
                                        <h3>{section.title}</h3>
                                    </div>
                                    {section.blocks.map((block, blockIndex) => (
                                        <ContentBlock
                                            key={blockIndex}
                                            block={block}
                                        />
                                    ))}
                                </section>
                            ))}
                        </div>
                        <nav
                            className="guide-chapter-pager"
                            aria-label="Continuar lectura"
                        >
                            {index > 0 ? (
                                <button
                                    onClick={() =>
                                        openChapter(guide[index - 1].id)
                                    }
                                >
                                    <span>← CAPÍTULO ANTERIOR</span>
                                    <strong>{guide[index - 1].title}</strong>
                                </button>
                            ) : (
                                <div>
                                    <span>ESTÁS EN EL PUNTO DE PARTIDA</span>
                                    <p>
                                        Sigue la ruta o elige un tema del
                                        índice.
                                    </p>
                                </div>
                            )}
                            {index < guide.length - 1 ? (
                                <button
                                    onClick={() =>
                                        openChapter(guide[index + 1].id)
                                    }
                                >
                                    <span>SIGUIENTE CAPÍTULO →</span>
                                    <strong>{guide[index + 1].title}</strong>
                                </button>
                            ) : (
                                <button
                                    onClick={() => openChapter(guide[0].id)}
                                >
                                    <span>VOLVER AL INICIO →</span>
                                    <strong>Entender el sistema</strong>
                                </button>
                            )}
                        </nav>
                        <footer className="guide-article-footer">
                            <span>EPSEL / DOCUMENTACIÓN DE INGENIERÍA</span>
                            <a href="#guide-reading">Volver arriba ↑</a>
                        </footer>
                    </article>
                    <aside className="guide-toc">
                        <p>EN ESTE CAPÍTULO</p>
                        <nav aria-label="Índice del capítulo">
                            {chapter.sections.map((section, sectionIndex) => (
                                <a
                                    key={section.id}
                                    href={`#${chapter.id}/${section.id}`}
                                >
                                    <span>
                                        {String(sectionIndex + 1).padStart(
                                            2,
                                            "0",
                                        )}
                                    </span>
                                    {section.title}
                                </a>
                            ))}
                        </nav>
                        <div className="guide-toc-note">
                            <span>LECTURA CON CONTEXTO</span>
                            <p>
                                El recorrido histórico y el código actual se
                                explican por separado para facilitar el
                                mantenimiento.
                            </p>
                        </div>
                    </aside>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
