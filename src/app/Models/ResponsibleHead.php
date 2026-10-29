<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ResponsibleHead extends Model
{
    use HasUuids;

    protected $fillable = ['nombre', 'nombre_normalizado'];
}
