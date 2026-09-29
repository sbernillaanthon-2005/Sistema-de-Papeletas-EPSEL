<?php

namespace App\Events;

use App\Domain\ExitSlip\ExitSlip;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ExitSlipApprovedByHead implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $exitSlip;

    public function __construct(ExitSlip $exitSlip)
    {
        $this->exitSlip = $exitSlip;
    }

    public function broadcastOn(): array
    {
        // Broadcast to the practitioner
        return [
            new PrivateChannel('practitioner.' . $this->exitSlip->practitionerId),
        ];
    }
    
    public function broadcastWith(): array
    {
        return [
            'id' => $this->exitSlip->id,
            'codigo' => $this->exitSlip->codigo,
            'message' => 'Tu papeleta ' . $this->exitSlip->codigo . ' ha sido firmada por tu jefe de área.',
        ];
    }
}
