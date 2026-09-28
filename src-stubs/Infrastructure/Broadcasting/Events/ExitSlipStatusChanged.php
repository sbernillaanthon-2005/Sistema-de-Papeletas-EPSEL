<?php

declare(strict_types=1);

namespace App\Infrastructure\Broadcasting\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Evento: Estado de la papeleta cambió.
 * Se emite en canal privado del practicante dueño.
 */
final class ExitSlipStatusChanged implements ShouldBroadcast
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly string $exitSlipId,
        public readonly string $practitionerId,
        public readonly string $newStatus,
        public readonly string $statusLabel,
        public readonly ?string $rejectionReason = null,
    ) {}

    public function broadcastOn(): array
    {
        // Canal privado del practicante: App.Models.User.{id}
        return [
            new PrivateChannel("App.Models.User.{$this->practitionerId}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'exit-slip.status-changed';
    }

    public function broadcastWith(): array
    {
        return [
            'exit_slip_id'     => $this->exitSlipId,
            'new_status'       => $this->newStatus,
            'status_label'     => $this->statusLabel,
            'rejection_reason' => $this->rejectionReason,
            'timestamp'        => now()->toIso8601String(),
        ];
    }
}
