<?php

declare(strict_types=1);

namespace App\Domain\ExitSlip\Enums;

enum ExitSlipTemplate: string
{
    case PRACTITIONER = 'practitioner';
    case WORKER       = 'worker';
}
