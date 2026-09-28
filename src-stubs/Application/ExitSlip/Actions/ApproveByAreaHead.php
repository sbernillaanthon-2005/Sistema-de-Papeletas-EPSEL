<?php

declare(strict_types=1);

namespace App\Application\ExitSlip\Actions;

use App\Domain\ExitSlip\Enums\ExitSlipStatus;
use App\Domain\ExitSlip\Repositories\ExitSlipRepositoryInterface;
use App\Domain\ExitSlip\ExitSlip;
use DomainException;

/**
 * Caso de uso: Jefe de Área aprueba la papeleta
 */
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
            practitionerId:            $exitSlip->practitionerId,
            areaId:                    $exitSlip->areaId,
            reason:                    $exitSlip->reason,
            reasonDetail:              $exitSlip->reasonDetail,
            authorizedDate:            $exitSlip->authorizedDate,
            authorizedTime:            $exitSlip->authorizedTime,
            status:                    ExitSlipStatus::APPROVED_BY_AREA,
            createdAt:                 $exitSlip->createdAt,
            practitionerSignaturePath: $exitSlip->practitionerSignaturePath,
            areaHeadSignaturePath:     $signaturePath,
            hrSignaturePath:           null,
            lineManagerSignaturePath:  $exitSlip->lineManagerSignaturePath,
            exitTime:                  null,
            returnTime:                null,
            securityObservations:      null,
            rejectionReason:           null,
        );

        return $this->repository->save($approved);
    }
}
