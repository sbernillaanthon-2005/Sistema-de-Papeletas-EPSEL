<?php

use App\Application\ExitSlip\Actions\ApproveByAreaHead;
use App\Application\ExitSlip\Actions\ApproveByHR;
use App\Application\ExitSlip\Actions\RejectExitSlip;
use App\Application\ExitSlip\Actions\RevertToDraft;
use App\Application\ExitSlip\Actions\SubmitExitSlip;
use App\Domain\ExitSlip\Enums\ExitReason;
use App\Domain\ExitSlip\Enums\ExitSlipStatus;
use App\Domain\ExitSlip\Enums\ExitSlipTemplate;
use App\Domain\ExitSlip\ExitSlip;
use App\Domain\ExitSlip\Repositories\ExitSlipRepositoryInterface;
use Illuminate\Support\Str;

function createSlip(ExitSlipStatus $status): ExitSlip {
    return new ExitSlip(
        id: Str::uuid()->toString(),
        codigo: 'PS-2026-000001',
        practitionerId: Str::uuid()->toString(),
        templateType: ExitSlipTemplate::PRACTITIONER,
        issueDate: new DateTimeImmutable(),
        fullNameSnapshot: 'Juan Perez',
        designationSnapshot: 'Practicante',
        reason: ExitReason::ESSALUD,
        reasonDetail: 'Cita',
        authorizedDate: new DateTimeImmutable(),
        authorizedTime: null,
        status: $status,
        assignedHeadId: Str::uuid()->toString(),
        approvedByHeadId: null,
        approvedByHeadAt: null,
        approvedByHrId: null,
        approvedByHrAt: null,
        practitionerSignaturePath: null,
        areaHeadSignaturePath: null,
        hrSignaturePath: null,
        lineManagerSignaturePath: null,
        exitTime: null,
        returnTime: null,
        securityObservations: null,
        supervisor: null,
        rejectionReason: null,
        finalPdfPath: null,
        createdAt: new DateTimeImmutable(),
    );
}

it('cannot be approved by area head if not submitted', function () {
    $repo = Mockery::mock(ExitSlipRepositoryInterface::class);
    $action = new ApproveByAreaHead($repo);
    $slip = createSlip(ExitSlipStatus::DRAFT);
    $repo->shouldReceive('findById')->andReturn($slip);

    expect(fn() => $action->execute($slip->id, Str::uuid()->toString(), 'sig.png'))
        ->toThrow(DomainException::class, 'no puede ser aprobada por Jefe de Área');
});

it('cannot be approved by hr if not approved by area', function () {
    $repo = Mockery::mock(ExitSlipRepositoryInterface::class);
    $action = new ApproveByHR($repo);
    $slip = createSlip(ExitSlipStatus::SUBMITTED);
    $repo->shouldReceive('findById')->andReturn($slip);

    expect(fn() => $action->execute($slip->id, Str::uuid()->toString(), 'sig.png'))
        ->toThrow(DomainException::class, 'no puede ser aprobada por RRHH');
});

it('cannot be rejected without comment', function () {
    $repo = Mockery::mock(ExitSlipRepositoryInterface::class);
    $action = new RejectExitSlip($repo);
    $slip = createSlip(ExitSlipStatus::SUBMITTED);
    $repo->shouldReceive('findById')->andReturn($slip);

    expect(fn() => $action->execute($slip->id, Str::uuid()->toString(), '   '))
        ->toThrow(DomainException::class, 'requiere un motivo');
});

it('only owner can revert to draft', function () {
    $repo = Mockery::mock(ExitSlipRepositoryInterface::class);
    $action = new RevertToDraft($repo);
    $slip = createSlip(ExitSlipStatus::REJECTED);
    $repo->shouldReceive('findById')->andReturn($slip);

    expect(fn() => $action->execute($slip->id, Str::uuid()->toString()))
        ->toThrow(DomainException::class, 'No tienes permiso');
});

it('cannot mutate an exit slip that is already approved by HR', function () {
    $repo = Mockery::mock(ExitSlipRepositoryInterface::class);
    $rejectAction = new RejectExitSlip($repo);
    $approveHeadAction = new ApproveByAreaHead($repo);
    $approveHRAction = new ApproveByHR($repo);
    $userRepo = Mockery::mock(\App\Domain\User\Repositories\UserRepositoryInterface::class);
    $userRepo->shouldReceive('findById')->andReturn((new \App\Models\User())->forceFill(['jefe_id' => 'dummy-jefe']));
    $submitAction = new SubmitExitSlip($repo, $userRepo);
    
    $slip = createSlip(ExitSlipStatus::APPROVED_BY_HR);
    $repo->shouldReceive('findById')->andReturn($slip);

    // Rejecting
    expect(fn() => $rejectAction->execute($slip->id, Str::uuid()->toString(), 'motivo'))
        ->toThrow(DomainException::class);
        
    // Approving by Head
    expect(fn() => $approveHeadAction->execute($slip->id, Str::uuid()->toString(), 'sig.png'))
        ->toThrow(DomainException::class);
        
    // Approving by HR (already approved)
    expect(fn() => $approveHRAction->execute($slip->id, Str::uuid()->toString(), 'sig.png'))
        ->toThrow(DomainException::class);
        
    // Submitting
    expect(fn() => $submitAction->execute($slip->id, Str::uuid()->toString(), 'sig.png'))
        ->toThrow(DomainException::class);
});
