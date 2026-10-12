<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    protected $fillable = ['key', 'value'];

    public static function integer(string $key, int $default): int
    {
        return max(1, (int) (static::query()->where('key', $key)->value('value') ?? $default));
    }
}
