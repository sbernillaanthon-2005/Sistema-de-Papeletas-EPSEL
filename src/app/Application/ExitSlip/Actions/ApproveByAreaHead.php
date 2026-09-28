<?php

declare(strict_types=1);

namespace App\Application\ExitSlip\Actions;

use App\Domain\ExitSlip\Enums\ExitSlipStatus;
use App\Domain\ExitSlip\Repositories\ExitSlipRepositoryInterface;
use App\Domain\ExitSlip\ExitSlip;
use DomainException;
use DateTimeImmutable;

final class ApproveByAreaHead
{
    public function __construct(
        private readonly ExitSlipRepositoryInterface $repository,
    ) {}

    public function execute(
        string  $exitSlipId,
        string  $areaHeadId,
        string  $signaturePath,
    ): ExitSlip {
        $exitSlip = $this->repository->findById($exitSlipId)
            ?? throw new DomainException("Papeleta no encontrada: {$exitSlipId}");

        if (!$exitSlip->canBeApprovedByArea()) {
            throw new DomainException(
                "La papeleta no puede ser aprobada por Jefe de Área en su estado actual: {$exitSlip->status->label()}"
            );
        }

        $approved = new ExitSlip(
            id:                        $exitSlip->id,
            codigo:                    $exitSlip->codigo,
            practitionerId:            $exitSlip->practitionerId,
            templateType:              $exitSlip->templateType,
            issueDate:                 $exitSlip->issueDate,
            fullNameSnapshot:          $exitSlip->fullNameSnapshot,
            designationSnapshot:       $exitSlip->designationSnapshot,
            reason:                    $exitSlip->reason,
            reasonDetail:              $exitSlip->reasonDetail,
            authorizedDate:            $exitSlip->authorizedDate,
            authorizedTime:            $exitSlip->authorizedTime,
            status:                    ExitSlipStatus::APPROVED_BY_AREA,
            
            assignedHeadId:            $exitSlip->assignedHeadId,
            approvedByHeadId:          $areaHeadId,
            approvedByHeadAt:          new DateTimeImmutable(),
            approvedByHrId:            null,
            approvedByHrAt:            null,

            practitionerSignaturePath: $exitSlip->practitionerSignaturePath,
            areaHeadSignaturePath:     $signaturePath, // Snapshot of signature!
            hrSignaturePath:           null,
            lineManagerSignaturePath:  $exitSlip->lineManagerSignaturePath,
            
            exitTime:                  $exitSlip->exitTime,
            returnTime:                $exitSlip->returnTime,
            securityObservations:      $exitSlip->securityObservations,
            supervisor:                $exitSlip->supervisor,
            
            rejectionReason:           null,
            finalPdfPath:              $exitSlip->finalPdfPath,
            createdAt:                 $exitSlip->createdAt,
        );

        return $this->repository->save($approved, $areaHeadId);
    }
}
