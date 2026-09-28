<?php

use App\Domain\User\Enums\UserRole;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Config;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

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
            'motivo_salida' => 'other',
            'motivo_detalle' => 'Test',
            'fecha_autorizada' => $todayLima->format('Y-m-d'), // Should be valid (>= today in Lima)
            'hora_desde' => '10:00',
            'hora_hasta' => '12:00',
        ]);
        
    // Assuming the controller returns 201 Created for a draft
    $response->assertStatus(201);
});
