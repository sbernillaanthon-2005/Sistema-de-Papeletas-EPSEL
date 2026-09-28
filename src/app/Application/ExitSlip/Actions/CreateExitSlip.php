<?php

namespace App\Application\ExitSlip\Actions;

use App\Application\ExitSlip\DTOs\CreateExitSlipDTO;
use App\Domain\ExitSlip\Enums\ExitSlipStatus;
use App\Domain\ExitSlip\ExitSlip;
use App\Domain\ExitSlip\Repositories\ExitSlipRepositoryInterface;
use App\Domain\ExitSlip\Services\ExitSlipCodeGeneratorInterface;
use App\Domain\ExitSlip\ValueObjects\TimeRange;
use DateTimeImmutable;
use Ramsey\Uuid\Uuid;

final class CreateExitSlip
{
    public function __construct(private readonly ExitSlipRepositoryInterface $repository, private readonly ExitSlipCodeGeneratorInterface $codes) {}

    public function execute(CreateExitSlipDTO $dto): ExitSlip
    {
        $now = new DateTimeImmutable;

        return $this->repository->save(new ExitSlip(
            id: Uuid::uuid4()->toString(), codigo: $this->codes->generateForYear((int) $now->format('Y')),
            practitionerId: $dto->practitionerId, templateType: $dto->template, issueDate: $now,
            fullNameSnapshot: $dto->fullName, designationSnapshot: $dto->designation,
            reason: $dto->reason, reasonDetail: $dto->reasonDetail, authorizedDate: $dto->authorizedDate,
            authorizedTime: new TimeRange($dto->timeFrom, $dto->timeUntil), status: ExitSlipStatus::DRAFT,
            assignedHeadId: null, approvedByHeadId: null, approvedByHeadAt: null, approvedByHrId: null, approvedByHrAt: null,
            practitionerSignaturePath: null, areaHeadSignaturePath: null, hrSignaturePath: null, lineManagerSignaturePath: null,
            exitTime: null, returnTime: null, securityObservations: null, supervisor: null, rejectionReason: null, finalPdfPath: null, createdAt: $now,
        ), $dto->practitionerId);
    }
}
