import type { ReactNode } from "react";

type Props = {
    eyebrow: string;
    lead: string;
    accent: string;
    description: string;
    className?: string;
    children?: ReactNode;
};

export default function PortalHeroCopy({ eyebrow, lead, accent, description, className = "", children }: Props) {
    return (
        <div className={`portal-feature-hero-copy ${className}`.trim()}>
            <p className="portal-hero-eyebrow">{eyebrow}</p>
            <h2><span>{lead}</span> <em>{accent}</em></h2>
            <p className="portal-feature-hero-description">{description}</p>
            {children}
        </div>
    );
}
