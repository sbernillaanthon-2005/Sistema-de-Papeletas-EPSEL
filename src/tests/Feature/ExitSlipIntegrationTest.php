<?php

use App\Domain\ExitSlip\Enums\ExitReason;
use App\Domain\ExitSlip\Enums\ExitSlipStatus;
use App\Domain\ExitSlip\Enums\ExitSlipTemplate;
use App\Domain\ExitSlip\ExitSlip;
use App\Domain\ExitSlip\ValueObjects\TimeRange;
use App\Infrastructure\Persistence\Eloquent\EloquentExitSlipCodeGenerator;
use App\Infrastructure\Persistence\Eloquent\EloquentExitSlipRepository;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

it('saves exit slip to database and logs transition', function () {
    $user = User::factory()->create();
    
    $repo = new EloquentExitSlipRepository();
    
    $slip = new ExitSlip(
        id: Str::uuid()->toString(),
        codigo: 'PS-2026-000001',
        practitionerId: $user->id,
        templateType: ExitSlipTemplate::PRACTITIONER,
        issueDate: new DateTimeImmutable(),
        fullNameSnapshot: 'Juan Perez',
        designationSnapshot: 'Practicante',
        reason: ExitReason::ESSALUD,
        reasonDetail: 'Cita',
        authorizedDate: new DateTimeImmutable(),
        authorizedTime: new TimeRange('08:00:00', '12:00:00'),
        status: ExitSlipStatus::DRAFT,
        assignedHeadId: null,
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
    
    $repo->save($slip);
    
    $this->assertDatabaseHas('exit_slips', [
        'id' => $slip->id,
        'estado' => 'draft'
    ]);
    
    $this->assertDatabaseHas('exit_slip_transitions', [
        'exit_slip_id' => $slip->id,
        'estado_destino' => 'draft'
    ]);
    
    // Read from DB
    $loaded = $repo->findById($slip->id);
    expect($loaded->id)->toBe($slip->id)
        ->and($loaded->authorizedTime->from)->toBe('08:00')
        ->and($loaded->authorizedTime->until)->toBe('12:00');
});

it('generates sequential codes without duplicates', function () {
    $generator = new EloquentExitSlipCodeGenerator();
    
    $code1 = $generator->generateForYear(2026);
    $code2 = $generator->generateForYear(2026);
    
    expect($code1)->toBe('PS-2026-000001')
        ->and($code2)->toBe('PS-2026-000002');
        
    $this->assertDatabaseHas('exit_slip_sequences', [
        'year' => 2026,
        'last_number' => 2
    ]);
});

it('throws DomainException if user tries to submit a slip without a jefe_id', function () {
    $user = (new User())->forceFill([
        'id' => Str::uuid()->toString(),
        'jefe_id' => null,
    ]);
    
    $repo = Mockery::mock(\App\Domain\ExitSlip\Repositories\ExitSlipRepositoryInterface::class);
    $userRepo = Mockery::mock(\App\Domain\User\Repositories\UserRepositoryInterface::class);
    
    $slipId = Str::uuid()->toString();
    $slip = new \App\Domain\ExitSlip\ExitSlip(
        $slipId,
        'TEST',
        $user->id,
        \App\Domain\ExitSlip\Enums\ExitSlipTemplate::PRACTITIONER,
        new DateTimeImmutable(),
        'Test',
        'Test',
        \App\Domain\ExitSlip\Enums\ExitReason::OTHER,
        'Test',
        new DateTimeImmutable(),
        null,
        \App\Domain\ExitSlip\Enums\ExitSlipStatus::DRAFT,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        new DateTimeImmutable()
    );
    
    $repo->shouldReceive('findById')->with($slipId)->andReturn($slip);
    $userRepo->shouldReceive('findById')->with($user->id)->andReturn($user);
    
    $submitAction = new \App\Application\ExitSlip\Actions\SubmitExitSlip($repo, $userRepo);
    
    expect(fn() => $submitAction->execute($slipId, $user->id, 'sig.png'))
        ->toThrow(DomainException::class, 'No tienes un jefe asignado. No puedes enviar papeletas hasta que se te asigne uno.');
});
