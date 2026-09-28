<?php

namespace App\Application\ExitSlip\DTOs;

use App\Domain\ExitSlip\Enums\ExitReason;
use App\Domain\ExitSlip\Enums\ExitSlipTemplate;
use DateTimeImmutable;

final class CreateExitSlipDTO
{
    public function __construct(
        public readonly string $practitionerId,
        public readonly string $fullName,
        public readonly ?string $designation,
        public readonly ExitSlipTemplate $template,
        public readonly ExitReason $reason,
        public readonly string $reasonDetail,
        public readonly DateTimeImmutable $authorizedDate,
        public readonly string $timeFrom,
        public readonly string $timeUntil,
    ) {}
}
