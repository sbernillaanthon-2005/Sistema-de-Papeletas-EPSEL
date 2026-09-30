<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent;

use App\Domain\ExitSlip\Enums\ExitReason;
use App\Domain\ExitSlip\Enums\ExitSlipStatus;
use App\Domain\ExitSlip\Enums\ExitSlipTemplate;
use App\Domain\ExitSlip\ExitSlip;
use App\Domain\ExitSlip\Repositories\ExitSlipRepositoryInterface;
use App\Domain\ExitSlip\ValueObjects\TimeRange;
use App\Models\ExitSlip as EloquentExitSlip;
use App\Models\ExitSlipTransition;
use DateTimeImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

final class EloquentExitSlipRepository implements ExitSlipRepositoryInterface
{
    public function findById(string $id): ?ExitSlip
    {
        $model = EloquentExitSlip::find($id);
        
        if (!$model) {
            return null;
        }

        return $this->toDomain($model);
    }

    public function save(ExitSlip $exitSlip, ?string $actorId = null): ExitSlip
    {
        DB::transaction(function () use ($exitSlip, $actorId) {
            $model = EloquentExitSlip::find($exitSlip->id);
            $oldStatus = null;

            if ($model) {
                $oldStatus = $model->estado->value;
                $model->update($this->toArray($exitSlip));
            } else {
                $model = EloquentExitSlip::create($this->toArray($exitSlip));
            }

            // Log transition if status changed or it's new
            if ($oldStatus !== $exitSlip->status->value) {
                ExitSlipTransition::create([
                    'created_at'      => now(),
                    'exit_slip_id'   => $exitSlip->id,
                    'actor_id'       => $actorId ?? $exitSlip->practitionerId,
                    'estado_origen'  => $oldStatus,
                    'estado_destino' => $exitSlip->status->value,
                    'comentario'     => $exitSlip->rejectionReason,
                ]);
            }
        });

        return $exitSlip;
    }

    private function toArray(ExitSlip $exitSlip): array
    {
        return [
            'id'                        => $exitSlip->id,
            'codigo'                    => $exitSlip->codigo,
            'user_id'                   => $exitSlip->practitionerId,
            'tipo_plantilla'            => $exitSlip->templateType->value,
            'fecha_emision'             => $exitSlip->issueDate->format('Y-m-d'),
            'apellidos_nombres'         => $exitSlip->fullNameSnapshot,
            'designado'                 => $exitSlip->designationSnapshot,
            'motivo_salida'             => $exitSlip->reason->value,
            'motivo_detalle'            => $exitSlip->reasonDetail,
            'fecha_autorizada'          => $exitSlip->authorizedDate->format('Y-m-d'),
            'hora_desde'                => $exitSlip->authorizedTime?->from,
            'hora_hasta'                => $exitSlip->authorizedTime?->until,
            'estado'                    => $exitSlip->status->value,
            'jefe_asignado_id'          => $exitSlip->assignedHeadId,
            'aprobado_jefe_por'         => $exitSlip->approvedByHeadId,
            'aprobado_jefe_at'          => $exitSlip->approvedByHeadAt?->format('Y-m-d H:i:s'),
            'aprobado_rrhh_por'         => $exitSlip->approvedByHrId,
            'aprobado_rrhh_at'          => $exitSlip->approvedByHrAt?->format('Y-m-d H:i:s'),
            'firma_practicante_path'    => $exitSlip->practitionerSignaturePath,
            'firma_jefe_path'           => $exitSlip->areaHeadSignaturePath,
            'firma_rrhh_path'           => $exitSlip->hrSignaturePath,
            'firma_gerente_path'        => $exitSlip->lineManagerSignaturePath,
            'firma_vigilancia_path'     => $exitSlip->firmaVigilanciaPath,
            'hora_salida'               => $exitSlip->exitTime,
            'hora_retorno'              => $exitSlip->returnTime,
            'observaciones'             => $exitSlip->securityObservations,
            'supervisor'                => $exitSlip->supervisor,
            'pdf_final_ruta'            => $exitSlip->finalPdfPath,
            'created_at'                => $exitSlip->createdAt->format('Y-m-d H:i:s'),
        ];
    }

    private function toDomain(EloquentExitSlip $model): ExitSlip
    {
        return new ExitSlip(
            $model->id,
            $model->codigo,
            $model->user_id,
            $model->tipo_plantilla,
            new DateTimeImmutable($model->fecha_emision->format('Y-m-d')),
            $model->apellidos_nombres,
            $model->designado,
            $model->motivo_salida,
            $model->motivo_detalle,
            new DateTimeImmutable($model->fecha_autorizada->format('Y-m-d')),
            $model->hora_desde && $model->hora_hasta ? new TimeRange($model->hora_desde, $model->hora_hasta) : null,
            $model->estado,
            $model->jefe_asignado_id,
            $model->aprobado_jefe_por,
            $model->aprobado_jefe_at ? new DateTimeImmutable($model->aprobado_jefe_at->format('Y-m-d H:i:s')) : null,
            $model->aprobado_rrhh_por,
            $model->aprobado_rrhh_at ? new DateTimeImmutable($model->aprobado_rrhh_at->format('Y-m-d H:i:s')) : null,
            $model->firma_practicante_path,
            $model->firma_jefe_path,
            $model->firma_rrhh_path,
            $model->firma_gerente_path,
            
            $model->hora_salida,
            $model->hora_retorno,
            $model->observaciones,
            $model->supervisor,
            $model->firma_vigilancia_path,
            
            $model->estado === ExitSlipStatus::REJECTED ? optional($model->transitions()->latest('id')->first())->comentario : null,
            $model->pdf_final_ruta,
            new DateTimeImmutable($model->created_at->format('Y-m-d H:i:s'))
        );
    }



    public function findByPractitioner(string $practitionerId): array
    {
        return EloquentExitSlip::where('user_id', $practitionerId)
            ->get()
            ->map(fn($m) => $this->toDomain($m))
            ->all();
    }

    public function findByStatus(ExitSlipStatus $status): array
    {
        return EloquentExitSlip::where('estado', $status->value)
            ->get()
            ->map(fn($m) => $this->toDomain($m))
            ->all();
    }

    public function findPendingForArea(string $areaId): array
    {
        // Find exit slips that are SUBMITTED for users belonging to the given area
        return EloquentExitSlip::where('estado', ExitSlipStatus::SUBMITTED->value)
            ->whereHas('user', fn($q) => $q->where('area_id', $areaId))
            ->get()
            ->map(fn($m) => $this->toDomain($m))
            ->all();
    }

    public function delete(string $id): void
    {
        EloquentExitSlip::destroy($id);
    }
}
