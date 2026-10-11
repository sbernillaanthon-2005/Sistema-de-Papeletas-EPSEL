<?php

declare(strict_types=1);

namespace App\Application\ExitSlip\Actions;

use App\Domain\ExitSlip\Enums\ExitSlipStatus;
use App\Domain\ExitSlip\Repositories\ExitSlipRepositoryInterface;
use App\Domain\User\Repositories\UserRepositoryInterface;
use App\Domain\ExitSlip\ExitSlip;
use DomainException;

final class SubmitExitSlip
{
    public function __construct(
        private readonly ExitSlipRepositoryInterface $exitSlipRepository,
        private readonly UserRepositoryInterface $userRepository,
    ) {}

    public function execute(string $exitSlipId, string $requesterId, string $signaturePath): ExitSlip
    {
        $exitSlip = $this->exitSlipRepository->findById($exitSlipId)
            ?? throw new DomainException("Papeleta no encontrada: {$exitSlipId}");

        if ($exitSlip->practitionerId !== $requesterId) {
            throw new DomainException("No tienes permiso para enviar esta papeleta.");
        }

        $user = $this->userRepository->findById($requesterId)
            ?? throw new DomainException("Usuario no encontrado.");

        if (empty($user->jefe_id)) {
            throw new DomainException("No tienes un jefe asignado. No puedes enviar papeletas hasta que se te asigne uno.");
        }

        if (!$exitSlip->canBeSubmitted()) {
            throw new DomainException(
                "La papeleta no puede enviarse en su estado actual: {$exitSlip->status->label()}"
            );
        }

        $submitted = new ExitSlip(
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
            status:                    ExitSlipStatus::SUBMITTED,
            
            assignedHeadId:            $user->jefe_id,
            approvedByHeadId:          null,
            approvedByHeadAt:          null,
            approvedByHrId:            null,
            approvedByHrAt:            null,

            practitionerSignaturePath: $signaturePath, // Stamped on submit!
            areaHeadSignaturePath:     $exitSlip->areaHeadSignaturePath,
            hrSignaturePath:           $exitSlip->hrSignaturePath,
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

        return $this->exitSlipRepository->save($submitted);
    }
}
