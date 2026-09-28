<?php

use App\Domain\User\Enums\UserRole;
use App\Models\Area;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class);
});

it('forces PRACTITIONER role when registering even if payload tries to elevate it', function () {
    $area = Area::create(['id' => Str::uuid(), 'nombre' => 'Sistemas']);
    
    $response = $this->post('/register', [
        'nombres' => 'Juan',
        'apellidos' => 'Perez',
        'dni' => '12345678',
        'email' => 'juan@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'area_id' => $area->id,
        'cargo_designado' => 'Practicante',
        'rol' => UserRole::ADMIN->value, // Intentional malicious payload
    ]);
    
    $response->assertRedirect(route('dashboard', absolute: false));
    
    $this->assertAuthenticated();
    $user = User::where('email', 'juan@example.com')->first();
    expect($user->rol)->toBe(UserRole::PRACTITIONER);
});

it('auto assigns jefe_id if the area has a Head', function () {
    $area = Area::create(['id' => Str::uuid(), 'nombre' => 'Sistemas']);
    
    $head = User::create([
        'id' => Str::uuid(),
        'nombres' => 'Jefe',
        'apellidos' => 'Area',
        'dni' => '11111111',
        'email' => 'jefe@example.com',
        'password' => 'password',
        'rol' => UserRole::AREA_HEAD,
        'area_id' => $area->id,
        'activo' => true
    ]);
    
    $response = $this->post('/register', [
        'nombres' => 'Juan',
        'apellidos' => 'Perez',
        'dni' => '12345678',
        'email' => 'juan@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'area_id' => $area->id,
        'cargo_designado' => 'Practicante',
    ]);
    
    $user = User::where('email', 'juan@example.com')->first();
    expect($user->jefe_id)->toBe($head->id);
});
