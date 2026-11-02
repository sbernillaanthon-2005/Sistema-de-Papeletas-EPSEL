<?php

use App\Models\AuditLog;
use App\Models\ExitSlip;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function managedSlip(User $owner, string $status = 'completed'): ExitSlip
{
    return ExitSlip::create([
        'codigo' => 'PAP-ADMIN-TEST-001',
        'user_id' => $owner->id,
        'tipo_plantilla' => 'worker',
        'fecha_emision' => '2026-10-28',
        'apellidos_nombres' => 'Persona de prueba',
        'designado' => 'Trabajador',
        'motivo_salida' => 'personal',
        'motivo_detalle' => 'Motivo original',
        'fecha_autorizada' => '2026-10-28',
        'estado' => $status,
    ]);
}

it('lets an admin edit a completed slip without resetting its workflow', function () {
    $admin = User::factory()->create(['rol' => 'admin']);
    $owner = User::factory()->create(['rol' => 'worker']);
    $slip = managedSlip($owner);

    $this->actingAs($admin)->get("/exit-slips/{$slip->id}/edit")->assertOk();
    $this->actingAs($admin)->put("/exit-slips/{$slip->id}", [
        'tipo_plantilla' => 'worker',
        'fecha_emision' => '2026-10-28',
        'designado' => 'Trabajador',
        'motivo_salida' => 'personal',
        'motivo_detalle' => 'Motivo corregido',
        'fecha_autorizada' => '2026-10-28',
    ])->assertRedirect();

    expect($slip->fresh()->motivo_detalle)->toBe('Motivo corregido');
    expect($slip->fresh()->estado->value)->toBe('completed');
    expect(AuditLog::where('action', 'exit_slip.updated')->where('subject_id', $slip->id)->exists())->toBeTrue();
});

it('only lets an admin delete a slip and records its reference', function () {
    $admin = User::factory()->create(['rol' => 'admin']);
    $owner = User::factory()->create(['rol' => 'worker']);
    $slip = managedSlip($owner);

    $this->actingAs($owner)->delete("/exit-slips/{$slip->id}")->assertForbidden();
    expect(ExitSlip::find($slip->id))->not->toBeNull();

    $this->actingAs($admin)->delete("/exit-slips/{$slip->id}")->assertRedirect('/exit-slips');
    expect(ExitSlip::find($slip->id))->toBeNull();
    expect(AuditLog::where('action', 'exit_slip.deleted')->where('subject_id', $slip->id)->first()?->metadata['codigo'])->toBe($slip->codigo);
});
