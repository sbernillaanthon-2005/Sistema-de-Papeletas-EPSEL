<?php

namespace App\Models;

use App\Domain\User\Enums\UserRole;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class CustomRole extends Model
{
    use HasUuids;

    protected $fillable = ['nombre', 'nombre_normalizado', 'rol_base'];

    protected $casts = ['rol_base' => UserRole::class];
}
