<?php

declare(strict_types=1);

namespace App\Application\ExitSlip\Actions;

use App\Domain\ExitSlip\Enums\ExitSlipStatus;
use App\Domain\ExitSlip\Repositories\ExitSlipRepositoryInterface;
use App\Domain\ExitSlip\ExitSlip;
use DomainException;

/**
 * Caso de uso: Practicante envía su papeleta para aprobación
 */
final class SubmitExitSlip
{
    public function __construct(
        private readonly ExitSlipRepositoryInterface $repository,
    ) {}

    public function execute(string $exitSlipId, string $requesterId): ExitSlip
    {
        $exitSlip = $this->repository->findById($exitSlipId)
            ?? throw new DomainException("Papeleta no encontrada: {$exitSlipId}");

        if ($exitSlip->practitionerId !== $requesterId) {
            throw new DomainException("No tienes permiso para enviar esta papeleta.");
        }

        if ($exitSlip->status !== ExitSlipStatus::DRAFT) {
            throw new DomainException(
                "La papeleta no puede enviarse en su estado actual: {$exitSlip->status->label()}"
            );
        }

        $submitted = new ExitSlip(
            id:                        $exitSlip->id,
            practitionerId:            $exitSlip->practitionerId,
            areaId:                    $exitSlip->areaId,
            reason:                    $exitSlip->reason,
            reasonDetail:              $exitSlip->reasonDetail,
            authorizedDate:            $exitSlip->authorizedDate,
            authorizedTime:            $exitSlip->authorizedTime,
            status:                    ExitSlipStatus::SUBMITTED,
            createdAt:                 $exitSlip->createdAt,
            practitionerSignaturePath: $exitSlip->practitionerSignaturePath,
            areaHeadSignaturePath:     $exitSlip->areaHeadSignaturePath,
            hrSignaturePath:           $exitSlip->hrSignaturePath,
            lineManagerSignaturePath:  $exitSlip->lineManagerSignaturePath,
            exitTime:                  $exitSlip->exitTime,
            returnTime:                $exitSlip->returnTime,
            securityObservations:      $exitSlip->securityObservations,
            rejectionReason:           null,
        );

        return $this->repository->save($submitted);
    }
}
