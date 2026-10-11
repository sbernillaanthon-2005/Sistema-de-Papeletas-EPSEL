<?php

namespace App\Support;

use Illuminate\Support\Facades\File;
use RuntimeException;
use Symfony\Component\Process\Process;

class DatabaseBackup
{
    /** @return array{path: string, filename: string} */
    public function export(): array
    {
        $connection = config('database.connections.'.config('database.default'));

        if (($connection['driver'] ?? null) !== 'pgsql') {
            throw new RuntimeException('El respaldo automático está disponible únicamente para PostgreSQL.');
        }

        $directory = storage_path('app/backups');
        File::ensureDirectoryExists($directory);
        $timestamp = now('America/Lima')->format('Ymd-His');
        $path = $directory.'/epsel-papeletas-'.$timestamp.'-'.bin2hex(random_bytes(4)).'.dump';

        $process = new Process([
            'pg_dump',
            '--format=custom',
            '--no-owner',
            '--no-privileges',
            '--file='.$path,
            '--host='.$connection['host'],
            '--port='.(string) $connection['port'],
            '--username='.$connection['username'],
            '--dbname='.$connection['database'],
        ], null, ['PGPASSWORD' => (string) $connection['password']]);
        $process->setTimeout(120);
        $process->run();

        if (! $process->isSuccessful() || ! File::exists($path) || File::size($path) === 0) {
            File::delete($path);
            throw new RuntimeException('No se pudo generar el respaldo de la base de datos.');
        }

        return ['path' => $path, 'filename' => 'epsel-papeletas-'.$timestamp.'.dump'];
    }
}
