<?php

use App\Models\Signature;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

it('shares the current signature on full page requests', function (bool $hasSignature) {
    $user = User::factory()->create(['rol' => 'worker']);
    $signature = $hasSignature ? Signature::create([
        'user_id' => $user->id,
        'ruta_archivo' => 'signatures/test.png',
        'mime' => 'image/png',
        'hash_sha256' => hash('sha256', 'test'),
    ]) : null;

    $this->actingAs($user)->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('auth.user.id', $user->id)
            ->where('auth.user.has_signature', $hasSignature)
            ->where('auth.user.signature_id', $signature?->id));
})->with([true, false]);

it('does not share a signature for an administrator', function () {
    $admin = User::factory()->create(['rol' => 'admin']);
    Signature::create([
        'user_id' => $admin->id,
        'ruta_archivo' => 'signatures/legacy-admin.png',
        'mime' => 'image/png',
        'hash_sha256' => hash('sha256', 'legacy-admin'),
    ]);

    $this->actingAs($admin)->get('/admin/documentation')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('auth.user.has_signature', false)
            ->where('auth.user.signature_id', null));
});

it('does not load signatures for notification JSON requests', function () {
    $user = User::factory()->create();
    DB::enableQueryLog();

    try {
        $this->actingAs($user)->getJson('/notifications')->assertOk();
        $queries = collect(DB::getQueryLog())->pluck('query');
        expect($queries->filter(fn (string $query) => str_contains($query, 'signatures')))->toBeEmpty();
    } finally {
        DB::disableQueryLog();
    }
});
