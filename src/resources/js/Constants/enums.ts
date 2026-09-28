export const UserRole = {
    ADMIN: 'admin',
    PRACTITIONER: 'practitioner',
    WORKER: 'worker',
    AREA_HEAD: 'area_head',
    LINE_MANAGER: 'line_manager',
    HR: 'hr',
    SECURITY: 'security',
} as const;

export const UserRoleLabels: Record<string, string> = {
    [UserRole.ADMIN]: 'Administrador',
    [UserRole.PRACTITIONER]: 'Practicante',
    [UserRole.WORKER]: 'Trabajador',
    [UserRole.AREA_HEAD]: 'Jefe de Área',
    [UserRole.LINE_MANAGER]: 'Gerente de Línea',
    [UserRole.HR]: 'Recursos Humanos',
    [UserRole.SECURITY]: 'Vigilancia / Seguridad',
};

export const ExitSlipStatus = {
    DRAFT: 'draft',
    SUBMITTED: 'submitted',
    APPROVED_BY_AREA: 'approved_by_area',
    APPROVED_BY_LINE_MANAGER: 'approved_by_line_manager',
    APPROVED_BY_HR: 'approved_by_hr',
    REJECTED: 'rejected',
} as const;

export const ExitSlipStatusLabels: Record<string, string> = {
    [ExitSlipStatus.DRAFT]: 'Borrador',
    [ExitSlipStatus.SUBMITTED]: 'Enviada al Jefe',
    [ExitSlipStatus.APPROVED_BY_AREA]: 'Aprobada por Área',
    [ExitSlipStatus.APPROVED_BY_LINE_MANAGER]: 'Aprobada por Gerencia',
    [ExitSlipStatus.APPROVED_BY_HR]: 'Aprobada por RRHH',
    [ExitSlipStatus.REJECTED]: 'Rechazada',
};

export const ExitReason = {
    ESSALUD: 'essalud',
    PERSONAL_PROCEDURES: 'personal_procedures',
    COMMISSION: 'commission',
    OTHER: 'other',
} as const;

export const ExitReasonLabels: Record<string, string> = {
    [ExitReason.ESSALUD]: 'EsSalud',
    [ExitReason.PERSONAL_PROCEDURES]: 'P / Personal',
    [ExitReason.COMMISSION]: 'Comisión',
    [ExitReason.OTHER]: 'Otros',
};
