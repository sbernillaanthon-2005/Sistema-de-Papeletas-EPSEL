export interface User {
    id: string;
    nombres: string;
    apellidos: string;
    email: string;
    email_verified_at?: string;
    dni: string;
    rol: string;
    rol_label: string;
    area_id: string | null;
    cargo_designado: string | null;
    has_signature: boolean;
    signature_id: string | null;
    profile_photo_path: string | null;
    profile_photo_url: string;
    theme?: "light" | "dark";
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    flash?: { success?: string };
    auth: {
        user: User;
    };
};
