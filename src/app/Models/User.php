<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Domain\User\Enums\UserRole;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasUuids, SoftDeletes;

    protected $fillable = [
        'nombres',
        'apellidos',
        'dni',
        'email',
        'password',
        'rol',
        'area_id',
        'cargo_designado',
        'jefe_id',
        'activo',
        'profile_photo_path',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'password' => 'hashed',
        'rol' => UserRole::class,
        'activo' => 'boolean',
    ];

    protected $appends = [
        'profile_photo_url',
        'rol_label',
    ];

    public function getProfilePhotoUrlAttribute(): string
    {
        if ($this->profile_photo_path) {
            return asset('storage/' . $this->profile_photo_path);
        }

        $name = trim(collect(explode(' ', $this->nombres . ' ' . $this->apellidos))->map(function ($segment) {
            return mb_substr($segment, 0, 1);
        })->take(2)->join(''));

        return 'https://ui-avatars.com/api/?name=' . urlencode($name) . '&color=7F9CF5&background=EBF4FF';
    }

    public function getRolLabelAttribute(): ?string
    {
        return $this->rol?->label();
    }

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    public function jefe(): BelongsTo
    {
        return $this->belongsTo(User::class, 'jefe_id');
    }

    public function signature(): HasOne
    {
        return $this->hasOne(Signature::class);
    }
}
