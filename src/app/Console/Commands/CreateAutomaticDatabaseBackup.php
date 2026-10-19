<?php

namespace App\Console\Commands;

use App\Models\ScheduledDatabaseBackup;
use App\Support\DatabaseBackup;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Throwable;

class CreateAutomaticDatabaseBackup extends Command
{
    protected $signature = 'backups:run-automatic';

    protected $description = 'Genera y conserva el respaldo automático de PostgreSQL';

    public function handle(DatabaseBackup $backup): int
    {
        try {
            $export = $backup->exportAutomatic();
            ScheduledDatabaseBackup::create([
                'file_path' => $export['relative_path'],
                'filename' => $export['filename'],
                'size_bytes' => $export['size_bytes'],
            ]);

            ScheduledDatabaseBackup::query()->latest('id')->skip(30)->get()->each(function (ScheduledDatabaseBackup $oldBackup) {
                File::delete(storage_path('app/private/'.$oldBackup->file_path));
                $oldBackup->delete();
            });

            $this->info("Respaldo automático almacenado: {$export['filename']}");
            return self::SUCCESS;
        } catch (Throwable $exception) {
            report($exception);
            $this->error('No se pudo generar el respaldo automático.');
            return self::FAILURE;
        }
    }
}
