<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Se evalúa cada minuto; el comando respeta el intervalo configurado por Administración.
Schedule::command('exit-slips:send-reminders')->everyMinute()->withoutOverlapping();

// Respaldo persistente a las 00:00 y 12:00, hora oficial de Lima.
Schedule::command('backups:run-automatic')
    ->twiceDaily(0, 12)
    ->timezone('America/Lima')
    ->withoutOverlapping();
