<?php

use App\Domain\User\Enums\UserRole;
use App\Models\Area;
use App\Models\AuditLog;
use App\Models\CustomRole;
use App\Models\ResponsibleHead;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withoutMiddleware(ValidateCsrfToken::class);
});

it('lets an admin change a user role and reset the password without logging the secret', function () {
    $admin = User::factory()->create(['rol' => 'admin']);
    $person = User::factory()->create(['rol' => 'worker', 'password' => 'old-password']);

    $this->actingAs($admin)->put("/admin/users/{$person->id}", [
        'nombres' => $person->nombres,
        'apellidos' => $person->apellidos,
        'activo' => true,
        'area_id' => null,
        'rol' => 'practitioner',
        'password' => 'new-password-123',
        'password_confirmation' => 'new-password-123',
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect($person->fresh()->rol)->toBe(UserRole::PRACTITIONER);
    expect(\Illuminate\Support\Facades\Hash::check('new-password-123', $person->fresh()->password))->toBeTrue();
    $log = AuditLog::where('action', 'user.updated')->latest('id')->firstOrFail();
    expect(json_encode($log->toArray()))->not->toContain('new-password-123');

    $this->put("/admin/users/{$person->id}", [
        'nombres' => $person->nombres,
        'apellidos' => $person->apellidos,
        'rol' => 'worker',
        'password' => 'different-password',
        'password_confirmation' => 'wrong-password',
    ])->assertSessionHasErrors('password');
});

it('updates and deletes catalog entries without removing assignments in use', function () {
    $admin = User::factory()->create(['rol' => 'admin']);
    $this->actingAs($admin);

    $this->post('/admin/responsible-heads', ['nombre' => 'Jefe Inicial'])->assertSessionHasNoErrors();
    $head = ResponsibleHead::where('nombre', 'Jefe Inicial')->firstOrFail();
    $person = User::factory()->create(['jefe_responsable_nombre' => 'Jefe Inicial']);
    $this->put("/admin/responsible-heads/{$head->id}", ['nombre' => 'Jefe Nuevo'])->assertSessionHasNoErrors();
    expect($person->fresh()->jefe_responsable_nombre)->toBe('Jefe Nuevo');
    $this->delete("/admin/responsible-heads/{$head->id}")->assertSessionHasErrors('registro');
    $person->update(['jefe_responsable_nombre' => null]);
    $this->delete("/admin/responsible-heads/{$head->id}")->assertSessionHasNoErrors();
    expect(ResponsibleHead::whereKey($head->id)->exists())->toBeFalse();

    $this->post('/admin/roles', ['nombre' => 'Supervisor'])->assertSessionHasNoErrors();
    $role = CustomRole::where('nombre', 'Supervisor')->firstOrFail();
    $this->put("/admin/roles/{$role->id}", ['nombre' => 'Coordinador'])->assertSessionHasNoErrors();
    expect($role->fresh()->nombre)->toBe('Coordinador');
    $person->update(['custom_role_id' => $role->id]);
    $this->delete("/admin/roles/{$role->id}")->assertSessionHasErrors('registro');
    $person->update(['custom_role_id' => null]);
    $this->delete("/admin/roles/{$role->id}")->assertSessionHasNoErrors();

    $this->post('/admin/areas', ['nombre' => 'Área Inicial'])->assertSessionHasNoErrors();
    $area = Area::where('nombre', 'Área Inicial')->firstOrFail();
    $this->put("/admin/areas/{$area->id}", ['nombre' => 'Área Nueva'])->assertSessionHasNoErrors();
    expect($area->fresh()->nombre)->toBe('Área Nueva');
    $person->update(['area_id' => $area->id]);
    $this->delete("/admin/areas/{$area->id}")->assertSessionHasErrors('registro');
    $person->update(['area_id' => null]);
    $this->delete("/admin/areas/{$area->id}")->assertSessionHasNoErrors();
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
        'activo' => true,
    ]);

    $this->actingAs($practitioner);

    $response = $this->post('/admin/users', []);
    $response->assertStatus(403);
    $this->post('/admin/areas', ['nombre' => 'Operaciones'])->assertStatus(403);
    $this->post('/admin/roles', ['nombre' => 'Supervisor'])->assertStatus(403);
    $this->post('/admin/responsible-heads', ['nombre' => 'Jefe de Operaciones'])->assertStatus(403);
});

it('lists existing responsible heads and registers a new one without an area', function () {
    $admin = User::factory()->create(['rol' => 'admin']);
    User::factory()->create(['jefe_responsable_nombre' => 'Jefe Sistemas']);

    $this->actingAs($admin)->get('/admin/dashboard')->assertOk()
        ->assertInertia(fn ($page) => $page->where('responsibleHeads.0', 'Jefe Sistemas'));

    $this->post('/admin/responsible-heads', ['nombre' => 'Jefe de Operaciones'])
        ->assertRedirect()->assertSessionHasNoErrors();
    expect(ResponsibleHead::where('nombre', 'Jefe de Operaciones')->exists())->toBeTrue();
    $this->get('/admin/dashboard')->assertOk()
        ->assertInertia(fn ($page) => $page->where('responsibleHeads.0', 'Jefe de Operaciones')
            ->where('responsibleHeads.1', 'Jefe Sistemas'));
    $this->post('/admin/responsible-heads', ['nombre' => 'jefe de operaciones'])
        ->assertSessionHasErrors('nombre');
});

it('allows an administrator to create a new area and rejects duplicate names', function () {
    $admin = User::factory()->create(['rol' => 'admin']);

    $this->actingAs($admin)->post('/admin/areas', ['nombre' => '  Operaciones  '])
        ->assertRedirect()->assertSessionHasNoErrors();

    expect(Area::where('nombre', 'Operaciones')->count())->toBe(1);
    expect(AuditLog::where('action', 'area.created')->count())->toBe(1);

    $this->post('/admin/areas', ['nombre' => 'operaciones'])
        ->assertSessionHasErrors('nombre');
    expect(Area::count())->toBe(1);
});

it('registers a custom role and assigns its base permissions to a new user', function () {
    $admin = User::factory()->create(['rol' => 'admin']);
    $this->actingAs($admin)->post('/admin/roles', [
        'nombre' => 'Supervisor de Operaciones',
    ])->assertRedirect()->assertSessionHasNoErrors();

    $role = CustomRole::where('nombre', 'Supervisor de Operaciones')->firstOrFail();
    expect($role->rol_base)->toBe(UserRole::WORKER);
    expect(AuditLog::where('action', 'role.created')->exists())->toBeTrue();

    $this->post('/admin/users', [
        'nombres' => 'Ana',
        'apellidos' => 'García',
        'dni' => '82945610',
        'password' => 'password123',
        'rol' => 'custom:'.$role->id,
        'area_id' => null,
    ])->assertRedirect()->assertSessionHasNoErrors();

    $person = User::where('dni', '82945610')->firstOrFail();
    expect($person->rol)->toBe(UserRole::WORKER);
    expect($person->custom_role_id)->toBe($role->id);
    expect($person->rol_label)->toBe('Supervisor de Operaciones');
    $this->get('/admin/dashboard?rol=custom:'.$role->id)->assertOk()
        ->assertInertia(fn ($page) => $page->where('users.total', 1)
            ->has('roles', 6));

    $this->post('/admin/roles', ['nombre' => 'supervisor de operaciones'])
        ->assertSessionHasErrors('nombre');
});

it('keeps an unassigned responsible head blank when an Area Head is created', function () {
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
        'activo' => true,
    ]);

    $admin = User::create([
        'id' => Str::uuid(),
        'nombres' => 'Admin',
        'apellidos' => 'Root',
        'dni' => '00000000',
        'email' => 'admin@example.com',
        'password' => 'password',
        'rol' => UserRole::ADMIN,
        'activo' => true,
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

    $head = User::where('dni', '11111111')->first();
    expect($head)->not->toBeNull();

    $practitioner->refresh();
    expect($practitioner->jefe_id)->toBeNull();
    expect($practitioner->jefe_responsable_nombre)->toBeNull();
});

it('stores a responsible head name independently of the area and allows adding it later', function () {
    $admin = User::factory()->create(['rol' => 'admin']);
    $area = Area::create(['nombre' => 'Operaciones']);
    $head = User::factory()->create(['rol' => 'area_head', 'area_id' => $area->id, 'activo' => true]);
    $payload = [
        'nombres' => 'Ana',
        'apellidos' => 'Pérez',
        'dni' => '87654321',
        'password' => 'password123',
        'rol' => 'worker',
        'area_id' => null,
        'jefe_responsable_nombre' => $head->nombres.' '.$head->apellidos,
    ];

    $this->actingAs($admin)->post('/admin/users', $payload)
        ->assertRedirect()->assertSessionHasNoErrors();
    $person = User::where('dni', '87654321')->firstOrFail();
    expect($person->jefe_responsable_nombre)->toBe($head->nombres.' '.$head->apellidos);
    expect($person->jefe_id)->toBe($head->id);

    $this->post('/admin/users', array_merge($payload, ['dni' => '87654322', 'jefe_responsable_nombre' => '']))
        ->assertRedirect()->assertSessionHasNoErrors();
    $withoutHead = User::where('dni', '87654322')->firstOrFail();
    expect($withoutHead->jefe_responsable_nombre)->toBeNull();
    $this->put("/admin/users/{$withoutHead->id}", [
        'nombres' => $withoutHead->nombres,
        'apellidos' => $withoutHead->apellidos,
        'activo' => true,
        'area_id' => null,
        'jefe_responsable_nombre' => 'Jefe sin cuenta',
    ])->assertRedirect()->assertSessionHasNoErrors();
    expect($withoutHead->fresh()->jefe_responsable_nombre)->toBe('Jefe sin cuenta');
    expect($withoutHead->jefe_id)->toBeNull();
});

it('filters the directory without changing global summary totals', function () {
    $admin = User::factory()->create(['rol' => 'admin']);
    $person = User::factory()->create(['rol' => 'worker', 'nombres' => 'FiltroUnico', 'activo' => false]);
    User::factory()->create(['rol' => 'worker', 'activo' => true]);
    $this->actingAs($admin)->get('/admin/dashboard?q=FiltroUnico&rol=worker&activo=0')->assertInertia(fn ($page) => $page
        ->has('users.data', 1)
        ->where('users.data.0.id', $person->id)
        ->where('summary.total', 3)
        ->where('summary.active', 2)
        ->has('workflow', 5)
        ->has('monthly', 6)
        ->has('accessByRole', 6)
        ->where('accessByRole.1.key', 'worker')
        ->where('accessByRole.1.active', 1)
        ->where('accessByRole.1.inactive', 1));
    $this->getJson('/admin/dashboard?rol=invalid')->assertUnprocessable();
});

it('builds six distinct calendar months at the end of a month', function () {
    \Illuminate\Support\Carbon::setTestNow('2026-10-31 12:00:00');

    try {
        $admin = User::factory()->create(['rol' => 'admin']);

        $this->actingAs($admin)->get('/admin/dashboard')->assertInertia(fn ($page) => $page
            ->where('monthly.0.key', '2026-05')
            ->where('monthly.1.key', '2026-06')
            ->where('monthly.2.key', '2026-07')
            ->where('monthly.3.key', '2026-08')
            ->where('monthly.4.key', '2026-09')
            ->where('monthly.5.key', '2026-10'));
    } finally {
        \Illuminate\Support\Carbon::setTestNow();
    }
});

it('lets an administrator update a user name and surname', function () {
    $admin = User::factory()->create(['rol' => 'admin']);
    $person = User::factory()->create(['rol' => 'worker', 'nombres' => 'Nombre anterior', 'apellidos' => 'Apellido anterior']);

    $this->actingAs($admin)->put("/admin/users/{$person->id}", [
        'nombres' => 'María Elena',
        'apellidos' => 'García Torres',
        'activo' => true,
        'area_id' => null,
        'jefe_id' => null,
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect($person->fresh()->nombres)->toBe('María Elena');
    expect($person->fresh()->apellidos)->toBe('García Torres');
    expect(AuditLog::where('action', 'user.updated')->where('subject_id', $person->id)->exists())->toBeTrue();

    $this->put("/admin/users/{$person->id}", [
        'nombres' => '',
        'apellidos' => 'García Torres',
    ])->assertSessionHasErrors('nombres');
});
