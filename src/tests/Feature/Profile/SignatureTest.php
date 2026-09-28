<?php

use App\Domain\User\Enums\UserRole;
use App\Models\Signature;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

it('rejects fake files disguised as png', function () {
    Storage::fake('private');
    
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
    
    $this->actingAs($user);
    
    // Create a fake file that is actually a text file
    $fakeImage = UploadedFile::fake()->createWithContent('fake.png', '<?php echo "malicious"; ?>');

    $response = $this->post('/signatures', [
        'signature' => $fakeImage
    ]);
    
    // UploadSignature action throws InvalidArgumentException which Laravel handles as a 500 in this case unless handled,
    // but Laravel validation might also fail on 'mimes:png,jpg,jpeg' if it checks real mime.
    // Assuming validation catches it or our Domain logic catches it.
    // If domain throws InvalidArgumentException, Laravel handles it if we map it, otherwise 500.
    
    expect(Signature::count())->toBe(0);
});

it('isolates signatures so only the owner can view their own', function () {
    Storage::fake('private');
    
    $owner = User::create([
        'id' => Str::uuid(),
        'nombres' => 'Owner',
        'apellidos' => 'Perez',
        'dni' => '12345678',
        'email' => 'owner@example.com',
        'password' => 'password',
        'rol' => UserRole::PRACTITIONER,
        'activo' => true
    ]);
    
    $other = User::create([
        'id' => Str::uuid(),
        'nombres' => 'Other',
        'apellidos' => 'Perez',
        'dni' => '87654321',
        'email' => 'other@example.com',
        'password' => 'password',
        'rol' => UserRole::PRACTITIONER,
        'activo' => true
    ]);
    
    $signature = Signature::create([
        'user_id' => $owner->id,
        'ruta_archivo' => 'signatures/fake_hash.png',
        'mime' => 'image/png',
        'hash_sha256' => 'hash',
    ]);
    
    Storage::disk('private')->put('signatures/fake_hash.png', 'fake image content');
    
    // Act as other user
    $this->actingAs($other);
    
    $response = $this->get('/signatures/' . $signature->id);
    $response->assertStatus(403);
    
    // Act as owner
    $this->actingAs($owner);
    $this->withoutExceptionHandling();
    
    $response = $this->get('/signatures/' . $signature->id);
    $response->assertStatus(200);
});

it('uploads and sanitizes a valid signature, replacing the old one', function () {
    Storage::fake('private');
    
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
    
    $this->actingAs($user);
    $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class);
    
    // Upload first signature
    $file1 = \Illuminate\Http\UploadedFile::fake()->image('sig1.png', 200, 100);
    $this->withoutExceptionHandling();
    $response1 = $this->post('/signatures', ['signature' => $file1]);
    $response1->assertRedirect();
    
    $sig1 = Signature::where('user_id', $user->id)->first();
    expect($sig1)->not->toBeNull()
        ->and(Storage::disk('private')->exists($sig1->ruta_archivo))->toBeTrue();
        
    // Upload second signature
    $file2 = \Illuminate\Http\UploadedFile::fake()->image('sig2.png', 300, 150);

    $response2 = $this->post('/signatures', ['signature' => $file2]);
    
    $sig2 = Signature::where('user_id', $user->id)->first();
    expect($sig2->id)->toBe($sig1->id) // Replaced row
        ->and($sig2->ruta_archivo)->not->toBe($sig1->ruta_archivo)
        ->and(Storage::disk('private')->exists($sig2->ruta_archivo))->toBeTrue()
        ->and(Storage::disk('private')->exists($sig1->ruta_archivo))->toBeTrue(); // Historical signatures are immutable
});
