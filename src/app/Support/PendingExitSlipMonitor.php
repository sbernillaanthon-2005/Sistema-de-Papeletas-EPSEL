<?php

namespace App\Support;

use App\Models\ExitSlip;
use App\Models\User;
use Illuminate\Support\Collection;

/** Fuente única de verdad para etapas detenidas y sus responsables. */
class PendingExitSlipMonitor
{
    public function pending(): Collection
    {
        return ExitSlip::query()
            ->with(['user:id,nombres,apellidos', 'assignedHead:id,nombres,apellidos'])
            ->whereIn('estado', ['submitted', 'approved_by_area', 'submitted_to_hr', 'approved_by_hr', 'submitted_to_security'])
            ->oldest('updated_at')
            ->get()
            ->map(fn (ExitSlip $slip) => $this->describe($slip));
    }

    public function describe(ExitSlip $slip): array
    {
        $owner = trim($slip->user?->nombres.' '.$slip->user?->apellidos);
        $head = trim($slip->assignedHead?->nombres.' '.$slip->assignedHead?->apellidos);
        $definition = match ($slip->estado->value) {
            'submitted' => ['Firma del jefe de área', $head ?: 'Jefe de área sin asignar', $slip->jefe_asignado_id ? collect([$slip->jefe_asignado_id]) : collect(), true],
            'approved_by_area' => ['Derivación a RRHH', $owner, collect([$slip->user_id]), false],
            'submitted_to_hr' => ['Firma de Recursos Humanos', 'Oficina de Recursos Humanos', $this->recipientsByRole('hr'), true],
            'approved_by_hr' => ['Derivación a Vigilancia', $owner, collect([$slip->user_id]), false],
            'submitted_to_security' => ['Registro y firma de Vigilancia', 'Control de Vigilancia', $this->recipientsByRole('security'), true],
        };

        return [
            'id' => $slip->id,
            'code' => $slip->codigo,
            'requester' => $owner,
            'status' => $slip->estado->value,
            'stage' => $definition[0],
            'responsible' => $definition[1],
            'recipient_ids' => $definition[2]->values()->all(),
            'requires_signature' => $definition[3],
            'waiting_since' => $slip->updated_at?->toIso8601String(),
        ];
    }

    private function recipientsByRole(string $role): Collection
    {
        return User::query()->where('rol', $role)->where('activo', true)->pluck('id');
    }
}
