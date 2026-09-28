<?php

namespace App\Models;

use App\Domain\ExitSlip\Enums\ExitReason;
use App\Domain\ExitSlip\Enums\ExitSlipStatus;
use App\Domain\ExitSlip\Enums\ExitSlipTemplate;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExitSlip extends Model
{
    use HasFactory, HasUuids;

    protected $hidden = ['firma_practicante_path', 'firma_jefe_path', 'firma_rrhh_path', 'firma_gerente_path', 'pdf_final_ruta'];

    protected $fillable = [
        'id',
        'codigo',
        'user_id',
        'tipo_plantilla',
        'fecha_emision',
        'apellidos_nombres',
        'designado',
        'motivo_salida',
        'motivo_detalle',
        'fecha_autorizada',
        'hora_desde',
        'hora_hasta',
        'estado',
        'jefe_asignado_id',
        'aprobado_jefe_por',
        'aprobado_jefe_at',
        'aprobado_rrhh_por',
        'aprobado_rrhh_at',
        'hora_salida',
        'hora_retorno',
        'observaciones',
        'supervisor',
        'firma_practicante_path',
        'firma_jefe_path',
        'firma_rrhh_path',
        'firma_gerente_path',
        'pdf_final_ruta',
    ];

    protected $casts = [
        'fecha_emision' => 'date',
        'fecha_autorizada' => 'date',
        'aprobado_jefe_at' => 'datetime',
        'aprobado_rrhh_at' => 'datetime',
        'motivo_salida' => ExitReason::class,
        'estado' => ExitSlipStatus::class,
        'tipo_plantilla' => ExitSlipTemplate::class,
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function assignedHead(): BelongsTo
    {
        return $this->belongsTo(User::class, 'jefe_asignado_id');
    }

    public function transitions(): HasMany
    {
        return $this->hasMany(ExitSlipTransition::class);
    }
}
