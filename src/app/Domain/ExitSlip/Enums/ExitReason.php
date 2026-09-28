<?php

declare(strict_types=1);

namespace App\Domain\ExitSlip\Enums;

enum ExitReason: string
{
    case ESSALUD = 'essalud';
    case PERSONAL = 'personal';
    case COMMISSION = 'commission';
    case OTHER = 'other';

    public function label(): string
    {
        return match($this) {
            self::ESSALUD => 'EsSalud',
            self::PERSONAL => 'Personal',
            self::COMMISSION => 'Comisión',
            self::OTHER => 'Otros',
        };
    }
}
