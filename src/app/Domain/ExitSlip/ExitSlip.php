<?php

declare(strict_types=1);

namespace App\Domain\ExitSlip;

use App\Domain\ExitSlip\Enums\ExitSlipStatus;
use App\Domain\ExitSlip\Enums\ExitReason;
use App\Domain\ExitSlip\Enums\ExitSlipTemplate;
use App\Domain\ExitSlip\ValueObjects\TimeRange;
use DateTimeImmutable;

final class ExitSlip
{
    public function __construct(
        public readonly string             $id,
        public readonly string             $codigo,
        public readonly string             $practitionerId,
        public readonly ExitSlipTemplate   $templateType,
        public readonly DateTimeImmutable  $issueDate,
        public readonly string             $fullNameSnapshot,
        public readonly ?string            $designationSnapshot,
        public readonly ExitReason         $reason,
        public readonly string             $reasonDetail,
        public readonly DateTimeImmutable  $authorizedDate,
        public readonly ?TimeRange         $authorizedTime,
        public readonly ExitSlipStatus     $status,
        
        public readonly ?string            $assignedHeadId,
        public readonly ?string            $approvedByHeadId,
        public readonly ?DateTimeImmutable $approvedByHeadAt,
        public readonly ?string            $approvedByHrId,
        public readonly ?DateTimeImmutable $approvedByHrAt,

        public readonly ?string            $practitionerSignaturePath,
        public readonly ?string            $areaHeadSignaturePath,
        public readonly ?string            $hrSignaturePath,
        public readonly ?string            $lineManagerSignaturePath,
        
        public readonly ?string            $exitTime,
        public readonly ?string            $returnTime,
        public readonly ?string            $securityObservations,
        public readonly ?string            $supervisor,
        
        public readonly ?string            $rejectionReason,
        public readonly ?string            $finalPdfPath,
        
        public readonly DateTimeImmutable  $createdAt,
    ) {}

    // ── Reglas de la Máquina de Estados ────────────────────────────────

    public function isPending(): bool
    {
        return in_array($this->status, [ExitSlipStatus::SUBMITTED, ExitSlipStatus::APPROVED_BY_AREA], true);
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
    
    public function canBeSubmitted(): bool
    {
        return $this->status === ExitSlipStatus::DRAFT;
    }

    public function canBeApprovedByArea(): bool
    {
        return $this->status === ExitSlipStatus::SUBMITTED;
    }

    public function canBeSubmittedToHR(): bool
    {
        return $this->status === ExitSlipStatus::APPROVED_BY_AREA;
    }

    public function canBeApprovedByHR(): bool
    {
        return $this->status === ExitSlipStatus::SUBMITTED_TO_HR;
    }

    public function canBeRejected(): bool
    {
        return in_array($this->status, [
            ExitSlipStatus::SUBMITTED,
            ExitSlipStatus::APPROVED_BY_AREA,
            ExitSlipStatus::SUBMITTED_TO_HR,
        ], true);
    }
}
