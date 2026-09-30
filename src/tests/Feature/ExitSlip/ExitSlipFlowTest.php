<?php

use App\Domain\User\Enums\UserRole;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->practitioner = User::factory()->create([
        'rol' => UserRole::PRACTITIONER->value,
    ]);
});

it('validates authorized date based on America/Lima timezone', function () {
    // Set system time to 9 PM UTC (4 PM in Lima, same day)
    $todayLima = Carbon::now('America/Lima')->startOfDay();

    // Simulate timezone
    Config::set('app.timezone', 'America/Lima');
    date_default_timezone_set('America/Lima');

    $response = $this->actingAs($this->practitioner)
        ->postJson('/exit-slips', [
            'tipo_plantilla' => 'practitioner',
            'fecha_emision' => $todayLima->format('Y-m-d'),
            'designado' => 'Practicante',
            'motivo_salida' => 'other',
            'motivo_detalle' => 'Test',
            'fecha_autorizada' => $todayLima->format('Y-m-d'), // Should be valid (>= today in Lima)
            'hora_desde' => '10:00',
            'hora_hasta' => '12:00',
        ]);

    // The web form redirects to the saved draft.
    $response->assertRedirect();
    $this->assertDatabaseHas('exit_slips', ['user_id' => $this->practitioner->id, 'estado' => 'draft']);
});
