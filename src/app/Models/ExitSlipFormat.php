<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExitSlipFormat extends Model
{
    protected $fillable = [
        'name',
        'file_path',
        'original_name',
        'mime_type',
        'size_bytes',
        'is_active',
        'uploaded_by',
    ];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by')->withTrashed();
    }
}
