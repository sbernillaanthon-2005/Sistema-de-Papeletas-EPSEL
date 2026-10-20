import { ReactNode, SVGProps } from "react";

export type PortalIconName =
    | "grid"
    | "file"
    | "folder"
    | "plus"
    | "users"
    | "user"
    | "shield"
    | "clock"
    | "check"
    | "arrow"
    | "search"
    | "filter"
    | "menu"
    | "close"
    | "logout"
    | "bell"
    | "download"
    | "edit"
    | "chevron"
    | "drop"
    | "send"
    | "alert"
    | "mic"
    | "sun"
    | "moon"
    | "trash";
export default function PortalIcon({
    name,
    ...props
}: SVGProps<SVGSVGElement> & { name: PortalIconName }) {
    const shapes: Record<PortalIconName, ReactNode> = {
        grid: (
            <>
                <rect x="3" y="3" width="7" height="7" rx="2" />
                <rect x="14" y="3" width="7" height="7" rx="2" />
                <rect x="3" y="14" width="7" height="7" rx="2" />
                <rect x="14" y="14" width="7" height="7" rx="2" />
            </>
        ),
        file: (
            <>
                <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z" />
                <path d="M14 3v6h6M8 13h8M8 17h5" />
            </>
        ),
        folder: <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />,
        plus: <path d="M12 5v14M5 12h14" />,
        users: (
            <>
                <circle cx="9" cy="8" r="3" />
                <path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 5" />
            </>
        ),
        user: (
            <>
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21v-1a8 8 0 0 1 16 0v1" />
            </>
        ),
        shield: (
            <>
                <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" />
                <path d="m8 12 3 3 5-6" />
            </>
        ),
        clock: (
            <>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
            </>
        ),
        check: (
            <>
                <circle cx="12" cy="12" r="9" />
                <path d="m8 12 3 3 5-6" />
            </>
        ),
        arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
        search: (
            <>
                <circle cx="10.5" cy="10.5" r="6.5" />
                <path d="m16 16 5 5" />
            </>
        ),
        filter: (
            <>
                <path d="M3 6h18M6 12h12M9 18h6" />
            </>
        ),
        menu: <path d="M4 6h16M4 12h16M4 18h16" />,
        close: <path d="m6 6 12 12M6 18 18 6" />,
        logout: (
            <>
                <path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4M9 12h12m-5-5 5 5-5 5" />
            </>
        ),
        bell: (
            <>
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
            </>
        ),
        download: (
            <>
                <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />
            </>
        ),
        edit: (
            <>
                <path d="m16 3 5 5-12 12-6 1 1-6L16 3ZM13 6l5 5" />
            </>
        ),
        chevron: <path d="m9 5 7 7-7 7" />,
        drop: <path d="M12 2S5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13Z" />,
        send: (
            <>
                <path d="m22 2-7 20-4-9-9-4L22 2ZM22 2 11 13" />
            </>
        ),
        alert: (
            <>
                <path d="m12 3 10 18H2L12 3ZM12 9v5" />
                <path d="M12 17h.01" />
            </>
        ),
        mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8" /></>,
        sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></>,
        moon: <path d="M20.5 14.1A8.5 8.5 0 0 1 9.9 3.5 8.5 8.5 0 1 0 20.5 14.1Z" />,
        trash: (
            <>
                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
            </>
        ),
    };
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            {...props}
        >
            {shapes[name]}
        </svg>
    );
}
