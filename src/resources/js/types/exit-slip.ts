export const statuses: Record<string, string> = {
    draft: "Borrador",
    submitted: "Enviada",
    approved_by_area: "Aprobada por Área",
    submitted_to_hr: "Enviada a RRHH",
    approved_by_hr: "Aprobada por RRHH",
    completed: "Completada",
    rejected: "Rechazada",
};
export const reasons: Record<string, string> = {
    essalud: "EsSalud",
    personal: "Personal",
    commission: "Comisión",
    other: "Otros",
};
export interface Slip {
    id: string;
    codigo: string;
    estado: string;
    apellidos_nombres: string;
    designado: string | null;
    motivo_salida: string;
    motivo_detalle: string;
    fecha_autorizada: string;
    hora_desde: string;
    hora_hasta: string;
    hora_salida: string | null;
    hora_retorno: string | null;
    aprobado_jefe_at: string | null;
    aprobado_rrhh_at: string | null;
    transitions?: {
        id: number;
        estado_destino: string;
        comentario: string | null;
        created_at: string;
        actor: { nombres: string; apellidos: string } | null;
    }[];
}
export interface Pagination<T> {
    data: T[];
    prev_page_url: string | null;
    next_page_url: string | null;
    current_page: number;
    last_page: number;
    total: number;
}
