<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

it('serves the editorial guide to administrators without raw document payloads', function () {
    $admin = User::factory()->create(['rol' => 'admin']);
    $this->actingAs($admin)->get('/admin/documentation')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Admin/Documentation/Index')->missing('documents'));
});

it('requires authentication to read the technical guide', function () {
    $this->get('/admin/documentation')->assertRedirect('/login');
});

it('keeps the guide restricted to administrators', function (string $role) {
    $this->actingAs(User::factory()->create(['rol' => $role]))
        ->get('/admin/documentation')->assertForbidden();
})->with(['practitioner', 'worker', 'area_head', 'hr', 'security']);
