<?php

use App\Models\AuditLog;
use App\Models\CustomRole;
use App\Models\User;
use App\Support\DatabaseBackup;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

it('keeps backup and audit screens restricted to administrators', function () {
    $worker = User::factory()->create(['rol' => 'worker']);

    $this->actingAs($worker)->get('/admin/backups')->assertForbidden();
    $this->actingAs($worker)->get('/admin/audit')->assertForbidden();
    $this->actingAs($worker)->post('/admin/backups/download')->assertForbidden();
});

it('shows the audit log to an administrator with filters and summary', function () {
    $admin = User::factory()->create(['rol' => 'admin']);
    AuditLog::create([
        'actor_id' => $admin->id,
        'action' => 'user.updated',
        'description' => 'Actualizó acceso o asignación de un usuario.',
        'ip_address' => '127.0.0.1',
    ]);

    $this->actingAs($admin)->get('/admin/audit?action=user.updated')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Audit/Index')
            ->has('logs.data', 1)
            ->where('logs.data.0.action', 'user.updated')
            ->where('summary.total', 1)
            ->has('actions', 1));
});

it('shows resource names instead of internal identifiers in audit entries', function () {
    $admin = User::factory()->create(['rol' => 'admin']);
    $person = User::factory()->create(['nombres' => 'Ana', 'apellidos' => 'Pérez']);
    $role = CustomRole::create(['nombre' => 'Supervisor', 'nombre_normalizado' => 'supervisor', 'rol_base' => 'worker']);
    AuditLog::create(['actor_id' => $admin->id, 'action' => 'user.updated', 'subject_type' => User::class, 'subject_id' => $person->id, 'description' => 'Actualizó un usuario.']);
    AuditLog::create(['actor_id' => $admin->id, 'action' => 'role.deleted', 'subject_type' => CustomRole::class, 'subject_id' => $role->id, 'description' => 'Eliminó un rol.', 'metadata' => ['nombre' => 'Supervisor']]);
    $role->delete();

    $this->actingAs($admin)->get('/admin/audit')->assertOk()->assertInertia(fn (Assert $page) => $page
        ->where('logs.data.0.subject_name', 'Supervisor')
        ->where('logs.data.1.subject_name', 'Ana Pérez'));
});

it('downloads an audited database backup for an administrator', function () {
    $admin = User::factory()->create(['rol' => 'admin']);
    $path = tempnam(sys_get_temp_dir(), 'epsel-backup-test-');
    file_put_contents($path, 'backup-content');

    app()->instance(DatabaseBackup::class, new class($path) extends DatabaseBackup
    {
        public function __construct(private string $path) {}

        public function export(): array
        {
            return ['path' => $this->path, 'filename' => 'epsel-papeletas-test.dump'];
        }
    });

    $this->actingAs($admin)->post('/admin/backups/download')
        ->assertDownload('epsel-papeletas-test.dump');

    expect(AuditLog::where('action', 'backup.downloaded')->where('actor_id', $admin->id)->exists())->toBeTrue();
});
