<?php

namespace App\Infrastructure\Notifications;

use App\Infrastructure\Broadcasting\Events\NotificationCreated;
use App\Models\ExitSlip;
use App\Models\Notification;
use App\Models\User;

class ExitSlipNotifier
{
    public function sendReminder(ExitSlip $slip, string $recipientId, string $stage): void
    {
        $notification = Notification::create([
            'user_id' => $recipientId,
            'tipo' => 'SIGNATURE_REMINDER',
            'exit_slip_id' => $slip->id,
            'titulo' => 'Firma pendiente',
            'mensaje' => "La papeleta de {$slip->apellidos_nombres} espera tu acción: {$stage}.",
        ]);
        NotificationCreated::dispatch($recipientId, $notification->id);
    }

    public function send(ExitSlip $slip): void
    {
        $recipients = [$slip->user_id];
        if ($slip->estado->value === 'submitted') {
            $recipients[] = $slip->jefe_asignado_id;
        }
        if ($slip->estado->value === 'submitted_to_hr') {
            $recipients = array_merge($recipients, User::where('rol', 'hr')->where('activo', true)->pluck('id')->all());
        }
        if ($slip->estado->value === 'submitted_to_security') {
            $recipients = array_merge($recipients, User::where('rol', 'security')->where('activo', true)->pluck('id')->all());
        }
        foreach (array_unique(array_filter($recipients)) as $id) {
            $notification = Notification::create([
                'user_id' => $id, 'tipo' => 'STATUS_CHANGED', 'exit_slip_id' => $slip->id,
                'titulo' => 'Papeleta: '.$slip->estado->label(),
                'mensaje' => 'La papeleta de '.$slip->apellidos_nombres.' cambió a '.$slip->estado->label().'.',
            ]);
            NotificationCreated::dispatch($id, $notification->id);
        }
    }
}
