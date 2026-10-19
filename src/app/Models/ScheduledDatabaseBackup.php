<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScheduledDatabaseBackup extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = ['file_path', 'filename', 'size_bytes'];

    protected function casts(): array
    {
        return ['created_at' => 'datetime'];
    }
}
