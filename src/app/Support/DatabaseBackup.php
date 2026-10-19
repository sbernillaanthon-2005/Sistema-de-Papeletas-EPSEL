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
        return $this->createExport(storage_path('app/backups'), 'epsel-papeletas');
    }

    /** @return array{path: string, relative_path: string, filename: string, size_bytes: int} */
    public function exportAutomatic(): array
    {
        return $this->createExport(storage_path('app/private/backups/automatic'), 'epsel-papeletas-auto');
    }

    /** @return array{path: string, relative_path: string, filename: string, size_bytes: int} */
    private function createExport(string $directory, string $prefix): array
    {
        $connection = config('database.connections.'.config('database.default'));

        if (($connection['driver'] ?? null) !== 'pgsql') {
            throw new RuntimeException('El respaldo automático está disponible únicamente para PostgreSQL.');
        }

        File::ensureDirectoryExists($directory);
        $timestamp = now('America/Lima')->format('Ymd-His');
        $filename = $prefix.'-'.$timestamp.'-'.bin2hex(random_bytes(4)).'.dump';
        $path = $directory.'/'.$filename;

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

        return [
            'path' => $path,
            'relative_path' => 'backups/automatic/'.$filename,
            'filename' => $filename,
            'size_bytes' => File::size($path),
        ];
    }
}
