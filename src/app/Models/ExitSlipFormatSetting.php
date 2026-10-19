<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExitSlipFormatSetting extends Model
{
    protected $guarded = [];

    protected $fillable = ['id', 'base_available'];

    protected function casts(): array
    {
        return ['base_available' => 'boolean'];
    }

    public static function current(): self
    {
        return self::query()->firstOrCreate(['id' => 1], ['base_available' => true]);
    }
}
