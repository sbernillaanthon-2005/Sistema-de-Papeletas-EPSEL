<?php

use App\Application\ExitSlip\Actions\ApproveByAreaHead;
use App\Application\ExitSlip\Actions\ApproveByHR;
use App\Application\ExitSlip\Actions\RejectExitSlip;
use App\Application\ExitSlip\Actions\SubmitExitSlip;
use App\Domain\ExitSlip\Enums\ExitReason;
use App\Domain\ExitSlip\Enums\ExitSlipStatus;
use App\Domain\ExitSlip\Enums\ExitSlipTemplate;
use App\Domain\ExitSlip\ExitSlip;
use App\Domain\ExitSlip\Repositories\ExitSlipRepositoryInterface;
use Illuminate\Support\Str;

it('stamps practitioner signature and changes status to SUBMITTED when submitted', function () {
    $repo = Mockery::mock(ExitSlipRepositoryInterface::class);
    $userRepo = Mockery::mock(\App\Domain\User\Repositories\UserRepositoryInterface::class);
    $userRepo->shouldReceive('findById')->andReturn((new \App\Models\User())->forceFill(['jefe_id' => 'dummy-jefe']));
    $action = new SubmitExitSlip($repo, $userRepo);
    
    $practitionerId = Str::uuid()->toString();
    
    $exitSlip = new ExitSlip(
        id: Str::uuid()->toString(),
        codigo: 'PS-2026-000001',
        practitionerId: $practitionerId,
        templateType: ExitSlipTemplate::PRACTITIONER,
        issueDate: new DateTimeImmutable(),
        fullNameSnapshot: 'Juan Perez',
        designationSnapshot: 'Practicante',
        reason: ExitReason::ESSALUD,
        reasonDetail: 'Cita médica',
        authorizedDate: new DateTimeImmutable(),
        authorizedTime: null,
        status: ExitSlipStatus::DRAFT,
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
    
    $repo->shouldReceive('findById')->with($exitSlip->id)->andReturn($exitSlip);
    $repo->shouldReceive('save')->once()->andReturnUsing(fn($es) => $es);
    
    $result = $action->execute($exitSlip->id, $practitionerId, 'path/to/prac_sig.png');
    
    expect($result->status)->toBe(ExitSlipStatus::SUBMITTED)
        ->and($result->practitionerSignaturePath)->toBe('path/to/prac_sig.png');
});

it('can be rejected and then re-submitted from rejected state', function () {
    $repo = Mockery::mock(ExitSlipRepositoryInterface::class);
    $rejectAction = new RejectExitSlip($repo);
    $userRepo = Mockery::mock(\App\Domain\User\Repositories\UserRepositoryInterface::class);
    $userRepo->shouldReceive('findById')->andReturn((new \App\Models\User())->forceFill(['jefe_id' => 'dummy-jefe']));
    $submitAction = new SubmitExitSlip($repo, $userRepo);
    
    $practitionerId = Str::uuid()->toString();
    $headId = Str::uuid()->toString();
    
    $exitSlip = new ExitSlip(
        id: Str::uuid()->toString(),
        codigo: 'PS-2026-000001',
        practitionerId: $practitionerId,
        templateType: ExitSlipTemplate::PRACTITIONER,
        issueDate: new DateTimeImmutable(),
        fullNameSnapshot: 'Juan Perez',
        designationSnapshot: 'Practicante',
        reason: ExitReason::ESSALUD,
        reasonDetail: 'Cita médica',
        authorizedDate: new DateTimeImmutable(),
        authorizedTime: null,
        status: ExitSlipStatus::SUBMITTED,
        assignedHeadId: $headId,
        approvedByHeadId: null,
        approvedByHeadAt: null,
        approvedByHrId: null,
        approvedByHrAt: null,
        practitionerSignaturePath: 'old/sig.png',
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
    $revertAction = new \App\Application\ExitSlip\Actions\RevertToDraft($repo);
    $repo->shouldReceive('findById')->with($exitSlip->id)->andReturnUsing(function() use (&$currentExitSlip) {
        return $currentExitSlip;
    });
    $repo->shouldReceive('save')->times(3)->andReturnUsing(function($es) use (&$currentExitSlip) {
        $currentExitSlip = $es;
        return $es;
    });
    
    $currentExitSlip = $exitSlip;
    
    // 1. Rechazar
    $rejectedResult = $rejectAction->execute($exitSlip->id, $headId, 'Motivo de prueba');
    expect($rejectedResult->status)->toBe(ExitSlipStatus::REJECTED)
        ->and($rejectedResult->rejectionReason)->toBe('Motivo de prueba');
        
    // 2. Revertir a borrador para edición
    $draftResult = $revertAction->execute($exitSlip->id, $practitionerId);
    expect($draftResult->status)->toBe(ExitSlipStatus::DRAFT)
        ->and($draftResult->rejectionReason)->toBeNull()
        ->and($draftResult->practitionerSignaturePath)->toBeNull();
        
    // 3. Re-enviar (con nueva firma)
    $resubmitted = $submitAction->execute($exitSlip->id, $practitionerId, 'new/sig.png');
    
    expect($resubmitted->status)->toBe(ExitSlipStatus::SUBMITTED)
        ->and($resubmitted->practitionerSignaturePath)->toBe('new/sig.png');
});
