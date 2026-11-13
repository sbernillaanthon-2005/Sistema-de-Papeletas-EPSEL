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
                        $resolvedHeadId = $this->resolveActorHead($actor);
                        if ($resolvedHeadId) {
                            $actor->update(['jefe_id' => $resolvedHeadId]);
                            $actor->load('jefe');
                        }
                    }

                    if (! $actor->jefe || ! $actor->jefe->activo || $actor->jefe->rol->value !== 'area_head' || $actor->jefe_id === $actor->id) {
                        throw new \DomainException('Necesitas un jefe de Área activo asignado para enviar la papeleta.');
                    }
                    if ($slip->fecha_autorizada->toDateString() < now('America/Lima')->toDateString()) {
                        throw new \DomainException('Actualiza la fecha autorizada antes de enviar.');
                    }
                    $slip->update(['apellidos_nombres' => trim($actor->nombres.' '.$actor->apellidos)]);
                    app(SubmitExitSlip::class)->execute($id, $actor->id, $this->signature($actor));
                } elseif ($action === 'submit_to_hr') {
                    $slip->update(['estado' => 'submitted_to_hr']);
                    ExitSlipTransition::create(['exit_slip_id' => $id, 'actor_id' => $actor->id, 'estado_origen' => 'approved_by_area', 'estado_destino' => 'submitted_to_hr']);
                } elseif ($action === 'submit_to_security') {
                    $slip->update(['estado' => 'submitted_to_security']);
                    ExitSlipTransition::create(['exit_slip_id' => $id, 'actor_id' => $actor->id, 'estado_origen' => 'approved_by_hr', 'estado_destino' => 'submitted_to_security']);
                } elseif ($action === 'approve') {
                    $class = $actor->rol->value === 'area_head' ? ApproveByAreaHead::class : ApproveByHR::class;
                    app($class)->execute($id, $actor->id, $this->signature($actor));
                } elseif ($action === 'reject') {
                    app(RejectExitSlip::class)->execute($id, $actor->id, $data['comentario']);
                } elseif ($action === 'revert') {
                    app(RevertToDraft::class)->execute($id, $actor->id);
                } elseif ($action === 'security') {
                    if ($slip->fecha_autorizada->toDateString() > now('America/Lima')->toDateString()) {
                        throw new \DomainException('El control se habilitará a partir de la fecha autorizada: '.$slip->fecha_autorizada->format('d/m/Y'));
                    }
                    $old = $slip->estado->value;
                    if (isset($data['movimiento'])) {
                        if ($data['movimiento'] === 'salida') {
                            $slip->hora_salida = now('America/Lima')->format('H:i');
                        } elseif ($data['movimiento'] === 'retorno') {
                            $slip->hora_retorno = now('America/Lima')->format('H:i');
                        }
                    } else {
                        $slip->hora_salida = $data['hora_salida'] ?? $slip->hora_salida;
                        $slip->hora_retorno = !empty($data['hora_retorno']) ? $data['hora_retorno'] : null;
                    }
                    $slip->observaciones = $data['observaciones'] ?? $slip->observaciones;
                    $slip->supervisor = trim($actor->nombres.' '.$actor->apellidos);
                    $slip->firma_vigilancia_path = $this->signature($actor);
                    $slip->estado = 'completed';
                    $slip->save();
                    ExitSlipTransition::create(['exit_slip_id' => $id, 'actor_id' => $actor->id, 'estado_origen' => $old, 'estado_destino' => $slip->estado->value, 'comentario' => 'Registro de control de vigilancia']);
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

    private function resolveActorHead(User $actor): ?string
    {
        if ($actor->area_id) {
            $head = User::query()
                ->where('rol', 'area_head')
                ->where('activo', true)
                ->where('area_id', $actor->area_id)
                ->where('id', '!=', $actor->id)
                ->first(['id']);
            if ($head) {
                return $head->id;
            }
        }

        if ($actor->jefe_responsable_nombre) {
            $normalize = fn (string $v) => mb_strtolower(trim(preg_replace('/\s+/u', ' ', $v)));
            $norm = $normalize($actor->jefe_responsable_nombre);

            $head = User::query()
                ->where('rol', 'area_head')
                ->where('activo', true)
                ->where('id', '!=', $actor->id)
                ->with('area')
                ->get()
                ->first(function (User $h) use ($norm, $normalize) {
                    $fullName = $normalize($h->nombres.' '.$h->apellidos);
                    if ($fullName === $norm) {
                        return true;
                    }
                    $area = $h->area ? $normalize($h->area->nombre) : '';
                    return (str_contains($norm, 'osi') && (str_contains($area, 'sistemas') || str_contains($area, 'informática')))
                        || (str_contains($norm, 'rrhh') && str_contains($area, 'recursos humanos'))
                        || (str_contains($norm, 'oper') && str_contains($area, 'operacion'));
                });

            if ($head) {
                return $head->id;
            }
        }

        $heads = User::query()
            ->where('rol', 'area_head')
            ->where('activo', true)
            ->where('id', '!=', $actor->id)
            ->get(['id']);

        return $heads->count() === 1 ? $heads->first()->id : null;
    }
}
