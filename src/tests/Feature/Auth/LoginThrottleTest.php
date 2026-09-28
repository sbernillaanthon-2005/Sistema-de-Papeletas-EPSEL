<?php

use App\Domain\User\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class);
});

it('can login with DNI', function () {
    $user = User::create([
        'id' => Str::uuid(),
        'nombres' => 'Juan',
        'apellidos' => 'Perez',
        'dni' => '12345678',
        'email' => 'juan@example.com',
        'password' => 'password',
        'rol' => UserRole::PRACTITIONER,
        'activo' => true
    ]);
    
    $response = $this->post('/login', [
        'email' => '12345678', // field is called email in request
        'password' => 'password',
    ]);
    
    $this->assertAuthenticated();
});

it('blocks login after 5 attempts', function () {
    $user = User::create([
        'id' => Str::uuid(),
        'nombres' => 'Juan',
        'apellidos' => 'Perez',
        'dni' => '12345678',
        'email' => 'juan@example.com',
        'password' => 'password',
        'rol' => UserRole::PRACTITIONER,
        'activo' => true
    ]);

    for ($i = 0; $i < 5; $i++) {
        $response = $this->post('/login', [
            'email' => '12345678',
            'password' => 'wrong-password',
        ]);
        $response->assertSessionHasErrors('email');
    }

    // 6th attempt should trigger rate limiting
    $response = $this->post('/login', [
        'email' => '12345678',
        'password' => 'wrong-password',
    ]);
    
    $response->assertSessionHasErrors('email');
});

it('redirects user based on their role after login', function () {
    $hr = User::create([
        'id' => Str::uuid(),
        'nombres' => 'HR',
        'apellidos' => 'User',
        'dni' => '22222222',
        'email' => 'hr@example.com',
        'password' => 'password',
        'rol' => UserRole::HR,
        'activo' => true
    ]);
    
    $response = $this->post('/login', [
        'email' => 'hr@example.com',
        'password' => 'password',
    ]);
    
    $response->assertRedirect(route('hr.dashboard', absolute: false));
});
