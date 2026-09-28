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

it('prevents non-admins from accessing admin endpoints', function () {
    $practitioner = User::create([
        'id' => Str::uuid(),
        'nombres' => 'Juan',
        'apellidos' => 'Perez',
        'dni' => '12345678',
        'email' => 'juan@example.com',
        'password' => 'password',
        'rol' => UserRole::PRACTITIONER,
        'activo' => true
    ]);
    
    $this->actingAs($practitioner);
    
    $response = $this->post('/admin/users', []);
    $response->assertStatus(403);
});

it('retroactively assigns jefe_id to area practitioners when an Area Head is created', function () {
    $area = Area::create(['id' => Str::uuid(), 'nombre' => 'Sistemas']);
    
    // Create practitioner without jefe_id
    $practitioner = User::create([
        'id' => Str::uuid(),
        'nombres' => 'Juan',
        'apellidos' => 'Perez',
        'dni' => '12345678',
        'email' => 'juan@example.com',
        'password' => 'password',
        'rol' => UserRole::PRACTITIONER,
        'area_id' => $area->id,
        'jefe_id' => null,
        'activo' => true
    ]);
    
    $admin = User::create([
        'id' => Str::uuid(),
        'nombres' => 'Admin',
        'apellidos' => 'Root',
        'dni' => '00000000',
        'email' => 'admin@example.com',
        'password' => 'password',
        'rol' => UserRole::ADMIN,
        'activo' => true
    ]);
    
    $this->actingAs($admin);
    
    $response = $this->post('/admin/users', [
        'nombres' => 'Jefe',
        'apellidos' => 'Area',
        'dni' => '11111111',
        'email' => 'jefe@example.com',
        'password' => 'password123',
        'rol' => UserRole::AREA_HEAD->value,
        'area_id' => $area->id,
        'cargo_designado' => 'Jefe de Sistemas',
    ]);
    
    $response->assertRedirect();
    
    $head = User::where('email', 'jefe@example.com')->first();
    expect($head)->not->toBeNull();
    
    $practitioner->refresh();
    expect($practitioner->jefe_id)->toBe($head->id);
});
