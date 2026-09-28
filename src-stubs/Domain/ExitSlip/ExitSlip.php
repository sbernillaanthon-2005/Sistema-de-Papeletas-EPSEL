<?php

declare(strict_types=1);

namespace App\Domain\ExitSlip;

use App\Domain\ExitSlip\Enums\ExitSlipStatus;
use App\Domain\ExitSlip\Enums\ExitReason;
use App\Domain\ExitSlip\ValueObjects\TimeRange;
use DateTimeImmutable;

/**
 * Entidad de dominio: Papeleta de Salida (Exit Slip)
 *
 * Representa la "Autorización de Salida Practicante" en el dominio.
 * No depende de Eloquent, Facades ni ningún helper de Laravel.
 */
final class ExitSlip
{
    public function __construct(
        public readonly string             $id,
        public readonly string             $practitionerId,
        public readonly string             $areaId,
        public readonly ExitReason         $reason,
        public readonly ?string            $reasonDetail,
        public readonly DateTimeImmutable  $authorizedDate,
        public readonly TimeRange          $authorizedTime,
        public readonly ExitSlipStatus     $status,
        public readonly DateTimeImmutable  $createdAt,
        public readonly ?string            $practitionerSignaturePath,
        public readonly ?string            $areaHeadSignaturePath,
        public readonly ?string            $hrSignaturePath,
        public readonly ?string            $lineManagerSignaturePath,
        public readonly ?string            $exitTime,
        public readonly ?string            $returnTime,
        public readonly ?string            $securityObservations,
        public readonly ?string            $rejectionReason,
    ) {}

    // ── Reglas de negocio ──────────────────────────────────────────

    public function isPending(): bool
    {
        return $this->status === ExitSlipStatus::PENDING;
    }

    public function isApprovedByArea(): bool
    {
        return in_array($this->status, [
            ExitSlipStatus::APPROVED_BY_AREA,
            ExitSlipStatus::APPROVED_BY_HR,
            ExitSlipStatus::COMPLETED,
        ], true);
    }

    public function isFullyApproved(): bool
    {
        return $this->status === ExitSlipStatus::APPROVED_BY_HR
            || $this->status === ExitSlipStatus::COMPLETED;
    }

    public function isRejected(): bool
    {
        return $this->status === ExitSlipStatus::REJECTED;
    }

    public function canBeApprovedByArea(): bool
    {
        return $this->status === ExitSlipStatus::SUBMITTED;
    }

    public function canBeApprovedByHR(): bool
    {
        return $this->status === ExitSlipStatus::APPROVED_BY_AREA;
    }

    public function canBeRejected(): bool
    {
        return in_array($this->status, [
            ExitSlipStatus::SUBMITTED,
            ExitSlipStatus::APPROVED_BY_AREA,
        ], true);
    }
}
