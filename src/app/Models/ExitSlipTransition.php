<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExitSlipTransition extends Model
{
    use HasFactory;

    public $timestamps = false; // Only created_at is handled manually/by DB

    protected $fillable = [
        'exit_slip_id',
        'actor_id',
        'estado_origen',
        'estado_destino',
        'comentario',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $transition) {
            // Match Laravel's application timezone instead of the database default.
            $transition->created_at ??= now();
        });
    }

    public function exitSlip(): BelongsTo
    {
        return $this->belongsTo(ExitSlip::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
