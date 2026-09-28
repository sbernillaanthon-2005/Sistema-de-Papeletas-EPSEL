<?php

use App\Infrastructure\Broadcasting\Events\NotificationCreated;
use App\Models\ExitSlip;
use App\Models\Notification;
use App\Models\Signature;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('private');
    Event::fake([NotificationCreated::class]);
    $this->head = User::factory()->create(['rol' => 'area_head']);
    $this->hr = User::factory()->create(['rol' => 'hr']);
    $this->owner = User::factory()->create(['jefe_id' => $this->head->id]);
    foreach ([$this->owner, $this->head, $this->hr] as $user) {
        $path = 'signatures/'.$user->id.'.png';
        $image = UploadedFile::fake()->image('sig.png', 200, 100);
        Storage::disk('private')->put($path, file_get_contents($image->getRealPath()));
        Signature::create(['user_id' => $user->id, 'ruta_archivo' => $path, 'mime' => 'image/png', 'hash_sha256' => hash('sha256', Storage::disk('private')->get($path))]);
    }
    $this->payload = ['motivo_salida' => 'personal', 'motivo_detalle' => 'Trámite personal', 'fecha_autorizada' => now('America/Lima')->toDateString(), 'hora_desde' => '08:00', 'hora_hasta' => '12:00'];
    $response = $this->actingAs($this->owner)->postJson('/exit-slips', $this->payload)->assertCreated();
    $this->slip = ExitSlip::findOrFail($response->json('id'));
});

function workflowUrl(ExitSlip $slip, string $action): string
{
    return '/exit-slips/'.$slip->id.'/actions/'.$action;
}

it('completes the ordered approval flow with immutable signatures, actor audit and PDF', function () {
    $this->actingAs($this->owner)->post(workflowUrl($this->slip, 'submit'))->assertRedirect();
    $this->actingAs($this->hr)->post(workflowUrl($this->slip, 'approve'))->assertForbidden();
    $this->actingAs($this->head)->post(workflowUrl($this->slip, 'approve'))->assertRedirect();
    $this->actingAs($this->head)->post(workflowUrl($this->slip, 'approve'))->assertForbidden();
    $this->actingAs($this->hr)->post(workflowUrl($this->slip, 'approve'))->assertRedirect();
    $slip = $this->slip->fresh();
    expect($slip->estado->value)->toBe('approved_by_hr');
    expect($slip->transitions()->orderBy('id')->pluck('actor_id')->all())->toBe([$this->owner->id, $this->owner->id, $this->head->id, $this->hr->id]);
    $this->actingAs($this->head)->post('/signatures', ['signature' => UploadedFile::fake()->image('new.png', 300, 100)])->assertRedirect();
    Storage::disk('private')->assertExists($slip->firma_jefe_path);
    expect($this->head->signature()->first()->ruta_archivo)->not->toBe($slip->firma_jefe_path);
    $pdf = $this->actingAs($this->owner)->get('/exit-slips/'.$slip->id.'/pdf')->assertOk()->assertHeader('content-type', 'application/pdf');
    expect($pdf->getContent())->toStartWith('%PDF');
    expect(Notification::where('user_id', $this->hr->id)->exists())->toBeTrue();
    Event::assertDispatched(NotificationCreated::class);
    $this->actingAs($this->owner)->put('/exit-slips/'.$slip->id, $this->payload)->assertForbidden();
});

it('isolates slips, PDFs, notifications and private UUID channels', function () {
    $other = User::factory()->create();
    $this->actingAs($this->owner)->post(workflowUrl($this->slip, 'submit'))->assertRedirect();
    $notification = Notification::where('user_id', $this->owner->id)->firstOrFail();
    $this->actingAs($other)->get('/exit-slips/'.$this->slip->id)->assertForbidden();
    $this->get('/exit-slips/'.$this->slip->id.'/pdf')->assertForbidden();
    $this->patch('/notifications/'.$notification->id.'/read')->assertNotFound();
    $this->getJson('/notifications')->assertJson(['items' => [], 'unread' => 0]);
    // Both UUIDs start with a letter and would previously compare as integer zero.
    $a = User::factory()->create(['id' => 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa']);
    $b = User::factory()->create(['id' => 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb']);
    config(['broadcasting.default' => 'reverb']);
    require base_path('routes/channels.php');
    $this->actingAs($a)->postJson('/broadcasting/auth', ['socket_id' => '1.1', 'channel_name' => 'private-App.Models.User.'.$b->id])->assertForbidden();
    $this->postJson('/broadcasting/auth', ['socket_id' => '1.1', 'channel_name' => 'private-App.Models.User.'.$a->id])->assertOk();
});

it('rejects with a reason and restarts approvals after correction', function () {
    $this->actingAs($this->owner)->post(workflowUrl($this->slip, 'submit'))->assertRedirect();
    $this->actingAs($this->head)->post(workflowUrl($this->slip, 'approve'))->assertRedirect();
    $this->actingAs($this->hr)->postJson(workflowUrl($this->slip, 'reject'), ['comentario' => ' '])->assertUnprocessable();
    $this->post(workflowUrl($this->slip, 'reject'), ['comentario' => 'Corregir horario'])->assertRedirect();
    $this->actingAs($this->owner)->post(workflowUrl($this->slip, 'revert'))->assertRedirect();
    expect($this->slip->fresh()->firma_jefe_path)->toBeNull();
    $this->put('/exit-slips/'.$this->slip->id, [...$this->payload, 'motivo_detalle' => 'Corregido'])->assertRedirect();
    $this->post(workflowUrl($this->slip, 'submit'))->assertRedirect();
    expect($this->slip->fresh()->estado->value)->toBe('submitted');
    expect($this->slip->transitions()->where('comentario', 'Corregir horario')->exists())->toBeTrue();
});

it('requires a signature and active assigned head without changing state on failure', function () {
    $this->owner->signature()->delete();
    $this->actingAs($this->owner)->postJson(workflowUrl($this->slip, 'submit'))->assertUnprocessable();
    expect($this->slip->fresh()->estado->value)->toBe('draft');
    expect(Notification::count())->toBe(0);
    $this->head->update(['activo' => false]);
    $this->postJson(workflowUrl($this->slip, 'submit'))->assertUnprocessable();
    $this->owner->update(['activo' => false]);
    $this->actingAs($this->owner->fresh())->get('/dashboard')->assertForbidden();
});

it('validates dates and time ranges and ignores forged identity or approval fields', function () {
    $this->actingAs($this->owner)->postJson('/exit-slips', [...$this->payload, 'hora_hasta' => '07:00'])->assertUnprocessable();
    $this->postJson('/exit-slips', [...$this->payload, 'fecha_autorizada' => now('America/Lima')->subDay()->toDateString()])->assertUnprocessable();
    $id = $this->postJson('/exit-slips', [...$this->payload, 'user_id' => $this->hr->id, 'estado' => 'approved_by_hr', 'tipo_plantilla' => 'worker'])->assertCreated()->json('id');
    $slip = ExitSlip::findOrFail($id);
    expect($slip->user_id)->toBe($this->owner->id)->and($slip->estado->value)->toBe('draft')->and($slip->tipo_plantilla->value)->toBe('practitioner');
});

it('records security exit and return once and only after full approval', function () {
    $security = User::factory()->create(['rol' => 'security']);
    $this->actingAs($security)->post(workflowUrl($this->slip, 'security'), ['movimiento' => 'salida'])->assertForbidden();
    $this->actingAs($this->owner)->post(workflowUrl($this->slip, 'submit'));
    $this->actingAs($this->head)->post(workflowUrl($this->slip, 'approve'));
    $this->actingAs($this->hr)->post(workflowUrl($this->slip, 'approve'));
    $this->actingAs($security)->postJson(workflowUrl($this->slip, 'security'), ['movimiento' => 'retorno'])->assertUnprocessable();
    $this->post(workflowUrl($this->slip, 'security'), ['movimiento' => 'salida'])->assertRedirect();
    $this->postJson(workflowUrl($this->slip, 'security'), ['movimiento' => 'salida'])->assertUnprocessable();
    $this->post(workflowUrl($this->slip, 'security'), ['movimiento' => 'retorno'])->assertRedirect();
    expect($this->slip->fresh()->estado->value)->toBe('completed');
    $this->post(workflowUrl($this->slip, 'security'), ['movimiento' => 'retorno'])->assertForbidden();
});

it('renders every role dashboard and paginates the inbox', function () {
    foreach (['practitioner', 'worker', 'area_head', 'hr', 'security', 'admin'] as $role) {
        $user = User::factory()->create(['rol' => $role]);
        $this->actingAs($user)->get('/dashboard')->assertOk()->assertInertia(fn ($page) => $page->component('ExitSlips/Index')->has('slips.data'));
    }
    $this->get('/admin/dashboard')->assertOk()->assertInertia(fn ($page) => $page->component('Admin/Users/Index'));
});

it('denies a different head and malformed identifiers', function () {
    $this->actingAs($this->owner)->post(workflowUrl($this->slip, 'submit'))->assertRedirect();
    $otherHead = User::factory()->create(['rol' => 'area_head']);
    $this->actingAs($otherHead)->post(workflowUrl($this->slip, 'approve'))->assertForbidden();
    $this->get('/exit-slips/not-a-uuid')->assertNotFound();
    $this->get('/exit-slips/not-a-uuid/pdf')->assertNotFound();
    expect($this->slip->fresh()->estado->value)->toBe('submitted');
});

it('marks only the current recipients notifications as read', function () {
    $this->actingAs($this->owner)->post(workflowUrl($this->slip, 'submit'))->assertRedirect();
    $this->patch('/notifications/all/read')->assertNoContent();
    $this->getJson('/notifications')->assertJsonPath('unread', 0);
    expect(Notification::where('user_id', $this->head->id)->whereNull('leida_at')->count())->toBe(1);
});

it('updates profile email without a nonexistent verification column', function () {
    $this->actingAs($this->owner)->patch('/profile', [
        'nombres' => 'Nuevo', 'apellidos' => 'Nombre', 'email' => 'updated@example.test',
    ])->assertRedirect();
    expect($this->owner->fresh()->email)->toBe('updated@example.test');
});
