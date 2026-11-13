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

it('auto resolves and persists jefe_id upon submit when user has null jefe_id but has area or responsible head', function () {
    \Illuminate\Support\Facades\Storage::fake('private');
    \Illuminate\Support\Facades\Event::fake([\App\Infrastructure\Broadcasting\Events\NotificationCreated::class]);

    $area = \App\Models\Area::create(['nombre' => 'Sub Gerencia de Sistemas e Informática']);
    $head = User::factory()->create([
        'nombres' => 'Jefe',
        'apellidos' => 'Sistemas',
        'rol' => UserRole::AREA_HEAD->value,
        'area_id' => $area->id,
        'activo' => true,
    ]);

    $practitioner = User::factory()->create([
        'rol' => UserRole::PRACTITIONER->value,
        'area_id' => $area->id,
        'jefe_responsable_nombre' => 'Jefe OSI',
        'jefe_id' => null,
    ]);

    $path = 'signatures/'.$practitioner->id.'.png';
    $image = \Illuminate\Http\UploadedFile::fake()->image('sig.png', 200, 100);
    \Illuminate\Support\Facades\Storage::disk('private')->put($path, file_get_contents($image->getRealPath()));
    \App\Models\Signature::create([
        'user_id' => $practitioner->id,
        'ruta_archivo' => $path,
        'mime' => 'image/png',
        'hash_sha256' => hash('sha256', \Illuminate\Support\Facades\Storage::disk('private')->get($path)),
    ]);

    $todayLima = Carbon::now('America/Lima')->startOfDay();
    $payload = [
        'tipo_plantilla' => 'practitioner',
        'fecha_emision' => $todayLima->format('Y-m-d'),
        'designado' => 'Practicante',
        'motivo_salida' => 'personal',
        'motivo_detalle' => 'Trámite urgente',
        'fecha_autorizada' => $todayLima->format('Y-m-d'),
        'hora_desde' => '08:00',
        'hora_hasta' => '12:00',
    ];

    $this->actingAs($practitioner)->post('/exit-slips', $payload)->assertRedirect();
    $slip = \App\Models\ExitSlip::where('user_id', $practitioner->id)->firstOrFail();

    $response = $this->actingAs($practitioner)
        ->post('/exit-slips/'.$slip->id.'/actions/submit');

    $response->assertRedirect();
    $practitioner->refresh();
    expect($practitioner->jefe_id)->toBe($head->id);
    expect($slip->fresh()->estado->value)->toBe('submitted');
});

it('allows security to register exit and return when authorized date is today or in the past', function () {
    \Illuminate\Support\Facades\Storage::fake('private');
    \Illuminate\Support\Facades\Event::fake([\App\Infrastructure\Broadcasting\Events\NotificationCreated::class]);

    $security = User::factory()->create([
        'nombres' => 'Control',
        'apellidos' => 'Vigilancia',
        'rol' => UserRole::SECURITY->value,
        'activo' => true,
    ]);

    $path = 'signatures/'.$security->id.'.png';
    $image = \Illuminate\Http\UploadedFile::fake()->image('sig.png', 200, 100);
    \Illuminate\Support\Facades\Storage::disk('private')->put($path, file_get_contents($image->getRealPath()));
    \App\Models\Signature::create([
        'user_id' => $security->id,
        'ruta_archivo' => $path,
        'mime' => 'image/png',
        'hash_sha256' => hash('sha256', \Illuminate\Support\Facades\Storage::disk('private')->get($path)),
    ]);

    $yesterdayLima = Carbon::now('America/Lima')->subDay()->startOfDay();
    $slip = \App\Models\ExitSlip::create([
        'codigo' => 'PAP-TEST-SEC01',
        'user_id' => $this->practitioner->id,
        'tipo_plantilla' => 'practitioner',
        'fecha_emision' => $yesterdayLima->format('Y-m-d'),
        'fecha_autorizada' => $yesterdayLima->format('Y-m-d'),
        'motivo_salida' => 'commission',
        'motivo_detalle' => 'Compra de insumos',
        'apellidos_nombres' => 'Practicante Test',
        'designado' => 'Practicante',
        'estado' => 'submitted_to_security',
    ]);

    $response = $this->actingAs($security)->post('/exit-slips/'.$slip->id.'/actions/security', [
        'hora_salida' => '04:42',
        'hora_retorno' => '',
        'observaciones' => 'Sin retorno',
    ]);

    $response->assertRedirect();
    $slip->refresh();
    expect($slip->estado->value)->toBe('completed');
    expect($slip->hora_salida)->toStartWith('04:42');
    expect($slip->hora_retorno)->toBeNull();
    expect($slip->supervisor)->toBe('Control Vigilancia');
    expect($slip->firma_vigilancia_path)->toBe($path);
});
