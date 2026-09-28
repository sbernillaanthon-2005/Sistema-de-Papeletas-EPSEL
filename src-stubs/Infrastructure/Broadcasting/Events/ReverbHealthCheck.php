<?php

declare(strict_types=1);

namespace App\Infrastructure\Broadcasting\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Evento de healthcheck para verificar que Reverb está funcionando.
 * Se usa en Fase 0 como prueba de conectividad WebSocket.
 *
 * Canal: public (para el healthcheck)
 */
final class ReverbHealthCheck implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly string $message = 'Reverb WebSocket OK',
        public readonly string $timestamp = '',
    ) {
        // Se asigna en construcción para serialización correcta
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('health-check'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'reverb.health';
    }

    public function broadcastWith(): array
    {
        return [
            'message'   => $this->message,
            'timestamp' => $this->timestamp ?: now()->toIso8601String(),
            'status'    => 'ok',
        ];
    }
}
