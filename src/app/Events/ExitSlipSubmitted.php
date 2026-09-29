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

class ExitSlipSubmitted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $exitSlip;

    public function __construct(ExitSlip $exitSlip)
    {
        $this->exitSlip = $exitSlip;
    }

    public function broadcastOn(): array
    {
        // Broadcast to the assigned area head
        return [
            new PrivateChannel('head.' . $this->exitSlip->assignedHeadId),
        ];
    }
    
    public function broadcastWith(): array
    {
        return [
            'id' => $this->exitSlip->id,
            'codigo' => $this->exitSlip->codigo,
            'practitioner_name' => $this->exitSlip->fullNameSnapshot,
            'message' => 'El practicante ' . $this->exitSlip->fullNameSnapshot . ' ha enviado una papeleta para aprobación.',
        ];
    }
}
