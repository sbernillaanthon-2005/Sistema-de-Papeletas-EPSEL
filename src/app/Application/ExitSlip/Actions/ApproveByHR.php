<?php

declare(strict_types=1);

namespace App\Application\ExitSlip\Actions;

use App\Domain\ExitSlip\Enums\ExitSlipStatus;
use App\Domain\ExitSlip\Repositories\ExitSlipRepositoryInterface;
use App\Domain\ExitSlip\ExitSlip;
use DomainException;
use DateTimeImmutable;

final class ApproveByHR
{
    public function __construct(
        private readonly ExitSlipRepositoryInterface $repository,
    ) {}

    public function execute(
        string  $exitSlipId,
        string  $hrUserId,
        string  $signaturePath,
    ): ExitSlip {
        $exitSlip = $this->repository->findById($exitSlipId)
            ?? throw new DomainException("Papeleta no encontrada: {$exitSlipId}");

        if (!$exitSlip->canBeApprovedByHR()) {
            throw new DomainException(
                "La papeleta no puede ser aprobada por RRHH en su estado actual: {$exitSlip->status->label()}"
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
            status:                    ExitSlipStatus::APPROVED_BY_HR,
            
            assignedHeadId:            $exitSlip->assignedHeadId,
            approvedByHeadId:          $exitSlip->approvedByHeadId,
            approvedByHeadAt:          $exitSlip->approvedByHeadAt,
            approvedByHrId:            $hrUserId,
            approvedByHrAt:            new DateTimeImmutable(),

            practitionerSignaturePath: $exitSlip->practitionerSignaturePath,
            areaHeadSignaturePath:     $exitSlip->areaHeadSignaturePath,
            hrSignaturePath:           $signaturePath,
            lineManagerSignaturePath:  $exitSlip->lineManagerSignaturePath,
            
            exitTime:                  $exitSlip->exitTime,
            returnTime:                $exitSlip->returnTime,
            securityObservations:      $exitSlip->securityObservations,
            supervisor:                $exitSlip->supervisor,
            firmaVigilanciaPath:       $exitSlip->firmaVigilanciaPath,
            
            rejectionReason:           null,
            finalPdfPath:              $exitSlip->finalPdfPath,
            createdAt:                 $exitSlip->createdAt,
        );

        return $this->repository->save($approved, $hrUserId);
    }
}
