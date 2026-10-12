<?php

namespace App\Console\Commands;

use App\Infrastructure\Notifications\ExitSlipNotifier;
use App\Models\ExitSlip;
use App\Models\Notification;
use App\Models\SystemSetting;
use App\Support\PendingExitSlipMonitor;
use Illuminate\Console\Command;

class SendExitSlipReminders extends Command
{
    protected $signature = 'exit-slips:send-reminders';
    protected $description = 'Envía recordatorios de firma a los responsables de papeletas detenidas';

    public function handle(PendingExitSlipMonitor $monitor, ExitSlipNotifier $notifier): int
    {
        $minutes = SystemSetting::integer('exit_slip_reminder_minutes', 15);
        $cutoff = now()->subMinutes($minutes);
        $sent = 0;

        foreach ($monitor->pending()->where('requires_signature', true) as $pending) {
            $slip = ExitSlip::find($pending['id']);
            foreach ($pending['recipient_ids'] as $recipientId) {
                $alreadySent = Notification::query()->where('user_id', $recipientId)
                    ->where('exit_slip_id', $slip->id)->where('tipo', 'SIGNATURE_REMINDER')
                    ->where('created_at', '>=', $cutoff)->exists();
                if (! $alreadySent) {
                    $notifier->sendReminder($slip, $recipientId, $pending['stage']);
                    $sent++;
                }
            }
        }

        $this->info("Recordatorios enviados: {$sent}.");
        return self::SUCCESS;
    }
}
