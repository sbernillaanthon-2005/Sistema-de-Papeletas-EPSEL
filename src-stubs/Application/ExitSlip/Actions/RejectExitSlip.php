<?php

declare(strict_types=1);

namespace App\Application\ExitSlip\Actions;

use App\Domain\ExitSlip\Enums\ExitSlipStatus;
use App\Domain\ExitSlip\Repositories\ExitSlipRepositoryInterface;
use App\Domain\ExitSlip\ExitSlip;
use DomainException;

/**
 * Caso de uso: Rechazar una papeleta (Jefe de Área o RRHH)
 */
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

        $rejected = new ExitSlip(
            id:                        $exitSlip->id,
            practitionerId:            $exitSlip->practitionerId,
            areaId:                    $exitSlip->areaId,
            reason:                    $exitSlip->reason,
            reasonDetail:              $exitSlip->reasonDetail,
            authorizedDate:            $exitSlip->authorizedDate,
            authorizedTime:            $exitSlip->authorizedTime,
            status:                    ExitSlipStatus::REJECTED,
            createdAt:                 $exitSlip->createdAt,
            practitionerSignaturePath: $exitSlip->practitionerSignaturePath,
            areaHeadSignaturePath:     $exitSlip->areaHeadSignaturePath,
            hrSignaturePath:           $exitSlip->hrSignaturePath,
            lineManagerSignaturePath:  $exitSlip->lineManagerSignaturePath,
            exitTime:                  $exitSlip->exitTime,
            returnTime:                $exitSlip->returnTime,
            securityObservations:      $exitSlip->securityObservations,
            rejectionReason:           $reason,
        );

        return $this->repository->save($rejected);
    }
}
