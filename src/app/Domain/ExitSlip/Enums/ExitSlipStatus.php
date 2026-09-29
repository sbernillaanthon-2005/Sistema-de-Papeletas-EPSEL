<?php

declare(strict_types=1);

namespace App\Domain\ExitSlip\Enums;

enum ExitSlipStatus: string
{
    case DRAFT = 'draft';
    case SUBMITTED = 'submitted';
    case APPROVED_BY_AREA = 'approved_by_area';
    case SUBMITTED_TO_HR = 'submitted_to_hr';
    case APPROVED_BY_HR = 'approved_by_hr';
    case COMPLETED = 'completed';
    case REJECTED = 'rejected';

    public function label(): string
    {
        return match($this) {
            self::DRAFT => 'Borrador',
            self::SUBMITTED => 'Enviada',
            self::APPROVED_BY_AREA => 'Aprobada por Área',
            self::SUBMITTED_TO_HR => 'Enviada a RRHH',
            self::APPROVED_BY_HR => 'Aprobada por RRHH',
            self::COMPLETED => 'Completada',
            self::REJECTED => 'Rechazada',
        };
    }
}
