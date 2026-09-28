<?php

namespace App\Infrastructure\ExitSlip;

use App\Application\ExitSlip\Actions\ApproveByAreaHead;
use App\Application\ExitSlip\Actions\ApproveByHR;
use App\Application\ExitSlip\Actions\RejectExitSlip;
use App\Application\ExitSlip\Actions\RevertToDraft;
use App\Application\ExitSlip\Actions\SubmitExitSlip;
use App\Infrastructure\Notifications\ExitSlipNotifier;
use App\Models\ExitSlip;
use App\Models\ExitSlipTransition;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ExitSlipWorkflow
{
    public function __construct(private readonly ExitSlipNotifier $notifier) {}

    public function execute(string $id, User $actor, string $action, array $data = []): ExitSlip
    {
        return DB::transaction(function () use ($id, $actor, $action, $data) {
            $slip = ExitSlip::whereKey($id)->lockForUpdate()->firstOrFail();
            Gate::forUser($actor)->authorize($action, $slip);
            try {
                if ($action === 'submit') {
                    if (! $actor->jefe || ! $actor->jefe->activo || $actor->jefe->rol->value !== 'area_head' || $actor->jefe_id === $actor->id) {
                        throw new \DomainException('Necesitas un jefe de Área activo asignado para enviar la papeleta.');
                    }
                    if ($slip->fecha_autorizada->toDateString() < now('America/Lima')->toDateString()) {
                        throw new \DomainException('Actualiza la fecha autorizada antes de enviar.');
                    }
                    app(SubmitExitSlip::class)->execute($id, $actor->id, $this->signature($actor));
                } elseif ($action === 'approve') {
                    $class = $actor->rol->value === 'area_head' ? ApproveByAreaHead::class : ApproveByHR::class;
                    app($class)->execute($id, $actor->id, $this->signature($actor));
                } elseif ($action === 'reject') {
                    app(RejectExitSlip::class)->execute($id, $actor->id, $data['comentario']);
                } elseif ($action === 'revert') {
                    app(RevertToDraft::class)->execute($id, $actor->id);
                } elseif ($action === 'security') {
                    if ($slip->fecha_autorizada->toDateString() !== now('America/Lima')->toDateString()) {
                        throw new \DomainException('El control corresponde únicamente a la fecha autorizada.');
                    }
                    $old = $slip->estado->value;
                    if ($data['movimiento'] === 'salida') {
                        if ($slip->hora_salida) {
                            throw new \DomainException('La salida ya fue registrada.');
                        }
                        $slip->hora_salida = now('America/Lima')->format('H:i:s');
                    } else {
                        if (! $slip->hora_salida || $slip->hora_retorno) {
                            throw new \DomainException('Registra primero la salida; el retorno no puede duplicarse.');
                        }
                        $slip->hora_retorno = now('America/Lima')->format('H:i:s');
                        $slip->estado = 'completed';
                    }
                    $slip->observaciones = $data['observaciones'] ?? $slip->observaciones;
                    $slip->supervisor = $actor->apellidos.' '.$actor->nombres;
                    $slip->save();
                    ExitSlipTransition::create(['exit_slip_id' => $id, 'actor_id' => $actor->id, 'estado_origen' => $old, 'estado_destino' => $slip->estado->value, 'comentario' => 'Registro de '.$data['movimiento']]);
                }
            } catch (\DomainException $e) {
                throw ValidationException::withMessages(['workflow' => $e->getMessage()]);
            }
            $slip->refresh();
            $this->notifier->send($slip);

            return $slip;
        });
    }

    private function signature(User $user): string
    {
        $path = $user->signature?->ruta_archivo;
        if (! $path || ! Storage::disk('private')->exists($path)) {
            throw new \DomainException('Carga tu firma en el perfil antes de continuar.');
        }

        return $path;
    }
}
