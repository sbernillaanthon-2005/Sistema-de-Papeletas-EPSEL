<?php

declare(strict_types=1);

namespace App\Application\ExitSlip\Actions;

use App\Domain\ExitSlip\Enums\ExitSlipStatus;
use App\Domain\ExitSlip\Repositories\ExitSlipRepositoryInterface;
use App\Domain\ExitSlip\ExitSlip;
use DomainException;

final class RevertToDraft
{
    public function __construct(
        private readonly ExitSlipRepositoryInterface $repository,
    ) {}

    public function execute(string $exitSlipId, string $requesterId): ExitSlip
    {
        $exitSlip = $this->repository->findById($exitSlipId)
            ?? throw new DomainException("Papeleta no encontrada: {$exitSlipId}");

        if ($exitSlip->practitionerId !== $requesterId) {
            throw new DomainException("No tienes permiso para modificar esta papeleta.");
        }

        if ($exitSlip->status !== ExitSlipStatus::REJECTED) {
            throw new DomainException(
                "Solo las papeletas rechazadas pueden devolverse a borrador."
            );
        }

        $draft = new ExitSlip(
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
            status:                    ExitSlipStatus::DRAFT,
            
            assignedHeadId:            $exitSlip->assignedHeadId,
            approvedByHeadId:          null, // Reset approvals
            approvedByHeadAt:          null,
            approvedByHrId:            null,
            approvedByHrAt:            null,

            practitionerSignaturePath: null, // User must sign again upon re-submitting
            areaHeadSignaturePath:     null,
            hrSignaturePath:           null,
            lineManagerSignaturePath:  null,
            
            exitTime:                  $exitSlip->exitTime,
            returnTime:                $exitSlip->returnTime,
            securityObservations:      $exitSlip->securityObservations,
            supervisor:                $exitSlip->supervisor,
            firmaVigilanciaPath:       $exitSlip->firmaVigilanciaPath,
            
            rejectionReason:           null, // Clear rejection as it's now a fresh draft
            finalPdfPath:              null,
            createdAt:                 $exitSlip->createdAt,
        );

        return $this->repository->save($draft, $requesterId);
    }
}
