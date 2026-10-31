<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'tipo',
        'exit_slip_id',
        'titulo',
        'mensaje',
        'leida_at',
    ];

    protected $casts = [
        'leida_at' => 'datetime',
    ];

    public function exitSlip(): BelongsTo
    {
        return $this->belongsTo(ExitSlip::class, 'exit_slip_id');
    }
}
