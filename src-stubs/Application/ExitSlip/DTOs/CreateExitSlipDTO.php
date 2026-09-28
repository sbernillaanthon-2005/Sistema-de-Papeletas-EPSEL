<?php

declare(strict_types=1);

namespace App\Application\ExitSlip\DTOs;

use App\Domain\ExitSlip\Enums\ExitReason;
use DateTimeImmutable;

/**
 * DTO: Datos para crear una nueva papeleta de salida
 */
final class CreateExitSlipDTO
{
    public function __construct(
        public readonly string            $practitionerId,
        public readonly string            $areaId,
        public readonly ExitReason        $reason,
        public readonly ?string           $reasonDetail,
        public readonly DateTimeImmutable $authorizedDate,
        public readonly string            $timeFrom,   // "HH:mm"
        public readonly string            $timeUntil,  // "HH:mm"
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            practitionerId: $data['practitioner_id'],
            areaId:         $data['area_id'],
            reason:         ExitReason::from($data['reason']),
            reasonDetail:   $data['reason_detail'] ?? null,
            authorizedDate: new DateTimeImmutable($data['authorized_date']),
            timeFrom:       $data['time_from'],
            timeUntil:      $data['time_until'],
        );
    }
}
