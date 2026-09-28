<?php

declare(strict_types=1);

namespace App\Application\ExitSlip\Actions;

use App\Application\ExitSlip\DTOs\CreateExitSlipDTO;
use App\Domain\ExitSlip\ExitSlip;
use App\Domain\ExitSlip\Enums\ExitSlipStatus;
use App\Domain\ExitSlip\Repositories\ExitSlipRepositoryInterface;
use App\Domain\ExitSlip\ValueObjects\TimeRange;
use DateTimeImmutable;
use Ramsey\Uuid\Uuid;

/**
 * Caso de uso: Crear una papeleta de salida (borrador)
 *
 * Capa: Application — no depende de Eloquent ni de Laravel.
 */
final class CreateExitSlip
{
    public function __construct(
        private readonly ExitSlipRepositoryInterface $repository,
    ) {}

    public function execute(CreateExitSlipDTO $dto): ExitSlip
    {
        $exitSlip = new ExitSlip(
            id:                        Uuid::uuid4()->toString(),
            practitionerId:            $dto->practitionerId,
            areaId:                    $dto->areaId,
            reason:                    $dto->reason,
            reasonDetail:              $dto->reasonDetail,
            authorizedDate:            $dto->authorizedDate,
            authorizedTime:            new TimeRange($dto->timeFrom, $dto->timeUntil),
            status:                    ExitSlipStatus::DRAFT,
            createdAt:                 new DateTimeImmutable(),
            practitionerSignaturePath: null,
            areaHeadSignaturePath:     null,
            hrSignaturePath:           null,
            lineManagerSignaturePath:  null,
            exitTime:                  null,
            returnTime:                null,
            securityObservations:      null,
            rejectionReason:           null,
        );

        return $this->repository->save($exitSlip);
    }
}
