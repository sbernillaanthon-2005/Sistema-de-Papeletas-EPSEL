import { SVGProps } from "react";

type IconName =
    "arrow" | "user" | "lock" | "eye" | "eye-off" | "check" | "shield" | "drop";

export default function LoginIcon({
    name,
    ...props
}: SVGProps<SVGSVGElement> & { name: IconName }) {
    const paths: Record<IconName, React.ReactNode> = {
        arrow: (
            <>
                <path d="M4 12h15M13 5l7 7-7 7" />
            </>
        ),
        user: (
            <>
                <circle cx="12" cy="8" r="3.5" />
                <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
            </>
        ),
        lock: (
            <>
                <rect x="5" y="10" width="14" height="11" rx="3" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
            </>
        ),
        eye: (
            <>
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                <circle cx="12" cy="12" r="3" />
            </>
        ),
        "eye-off": (
            <>
                <path d="m3 3 18 18M10.6 5.1 12 5c6.5 0 10 7 10 7a19 19 0 0 1-3 3.8M6.2 6.2A21 21 0 0 0 2 12s3.5 7 10 7a11 11 0 0 0 5.3-1.4M10 10a3 3 0 0 0 4 4" />
            </>
        ),
        check: <path d="m5 12 4 4L19 6" />,
        shield: (
            <>
                <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" />
                <path d="m8 12 3 3 5-6" />
            </>
        ),
        drop: <path d="M12 2S5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13Z" />,
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
            {paths[name]}
        </svg>
    );
}
