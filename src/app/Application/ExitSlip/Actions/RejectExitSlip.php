<?php

declare(strict_types=1);

namespace App\Application\ExitSlip\Actions;

use App\Domain\ExitSlip\Enums\ExitSlipStatus;
use App\Domain\ExitSlip\Repositories\ExitSlipRepositoryInterface;
use App\Domain\ExitSlip\ExitSlip;
use DomainException;

final class RejectExitSlip
{
    public function __construct(
        private readonly ExitSlipRepositoryInterface $repository,
    ) {}

    public function execute(
        string  $exitSlipId,
        string  $reviewerId,
        string  $reason,
    ): ExitSlip {
        $exitSlip = $this->repository->findById($exitSlipId)
            ?? throw new DomainException("Papeleta no encontrada: {$exitSlipId}");

        if (!$exitSlip->canBeRejected()) {
            throw new DomainException(
                "La papeleta no puede ser rechazada en su estado actual: {$exitSlip->status->label()}"
            );
        }

        if (empty(trim($reason))) {
            throw new DomainException("Se requiere un motivo de rechazo.");
        }

        // Changed target status to REJECTED, but from rejected, it can go to DRAFT via a new action if we wanted.
        // Or we can just set it to REJECTED here, and the Submit action handles REJECTED -> SUBMITTED.
        $rejected = new ExitSlip(
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
            status:                    ExitSlipStatus::REJECTED,
            
            assignedHeadId:            $exitSlip->assignedHeadId,
            approvedByHeadId:          $exitSlip->approvedByHeadId,
            approvedByHeadAt:          $exitSlip->approvedByHeadAt,
            approvedByHrId:            $exitSlip->approvedByHrId,
            approvedByHrAt:            $exitSlip->approvedByHrAt,

            practitionerSignaturePath: $exitSlip->practitionerSignaturePath,
            areaHeadSignaturePath:     $exitSlip->areaHeadSignaturePath,
            hrSignaturePath:           $exitSlip->hrSignaturePath,
            lineManagerSignaturePath:  $exitSlip->lineManagerSignaturePath,
            
            exitTime:                  $exitSlip->exitTime,
            returnTime:                $exitSlip->returnTime,
            securityObservations:      $exitSlip->securityObservations,
            supervisor:                $exitSlip->supervisor,
            firmaVigilanciaPath:       $exitSlip->firmaVigilanciaPath,
            
            rejectionReason:           $reason,
            finalPdfPath:              $exitSlip->finalPdfPath,
            createdAt:                 $exitSlip->createdAt,
        );

        return $this->repository->save($rejected, $reviewerId);
    }
}
