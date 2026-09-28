<?php

declare(strict_types=1);

namespace App\Application\ExitSlip\Actions;

use App\Domain\ExitSlip\Enums\ExitSlipStatus;
use App\Domain\ExitSlip\Repositories\ExitSlipRepositoryInterface;
use App\Domain\ExitSlip\ExitSlip;
use DomainException;

/**
 * Caso de uso: Recursos Humanos aprueba la papeleta
 */
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
            practitionerId:            $exitSlip->practitionerId,
            areaId:                    $exitSlip->areaId,
            reason:                    $exitSlip->reason,
            reasonDetail:              $exitSlip->reasonDetail,
            authorizedDate:            $exitSlip->authorizedDate,
            authorizedTime:            $exitSlip->authorizedTime,
            status:                    ExitSlipStatus::APPROVED_BY_HR,
            createdAt:                 $exitSlip->createdAt,
            practitionerSignaturePath: $exitSlip->practitionerSignaturePath,
            areaHeadSignaturePath:     $exitSlip->areaHeadSignaturePath,
            hrSignaturePath:           $signaturePath,
            lineManagerSignaturePath:  $exitSlip->lineManagerSignaturePath,
            exitTime:                  null,
            returnTime:                null,
            securityObservations:      null,
            rejectionReason:           null,
        );

        return $this->repository->save($approved);
    }
}
