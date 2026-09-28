<?php

namespace App\Infrastructure\Notifications;

use App\Infrastructure\Broadcasting\Events\NotificationCreated;
use App\Models\ExitSlip;
use App\Models\Notification;
use App\Models\User;

class ExitSlipNotifier
{
    public function send(ExitSlip $slip): void
    {
        $recipients = [$slip->user_id];
        if ($slip->estado->value === 'submitted') {
            $recipients[] = $slip->jefe_asignado_id;
        }
        if ($slip->estado->value === 'approved_by_area') {
            $recipients = array_merge($recipients, User::where('rol', 'hr')->where('activo', true)->pluck('id')->all());
        }
        foreach (array_unique(array_filter($recipients)) as $id) {
            $notification = Notification::create([
                'user_id' => $id, 'tipo' => 'STATUS_CHANGED', 'exit_slip_id' => $slip->id,
                'titulo' => $slip->codigo.' · '.$slip->estado->label(),
                'mensaje' => 'La papeleta de '.$slip->apellidos_nombres.' cambió a '.$slip->estado->label().'.',
            ]);
            NotificationCreated::dispatch($id, $notification->id);
        }
    }
}
