<?php

use App\Models\ExitSlip;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('lists every unfinished slip in Por atender and excludes finished ones', function () {
    $admin = User::factory()->create(['rol' => 'admin']);
    foreach (['draft', 'submitted_to_security', 'completed', 'rejected'] as $index => $status) {
        ExitSlip::create([
            'codigo' => 'PENDING-'.($index + 1),
            'user_id' => $admin->id,
            'tipo_plantilla' => 'worker',
            'fecha_emision' => '2026-10-28',
            'apellidos_nombres' => 'Usuario de prueba',
            'motivo_salida' => 'personal',
            'motivo_detalle' => 'Prueba',
            'fecha_autorizada' => '2026-10-28',
            'estado' => $status,
        ]);
    }

    $this->actingAs($admin)->get('/exit-slips?estado=pending')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('pagination.total', 2)
            ->where('filters.estado', 'pending'));
});
