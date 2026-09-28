<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Signature extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'ruta_archivo',
        'mime',
        'hash_sha256',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
