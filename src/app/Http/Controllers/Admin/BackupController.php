<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Support\AuditLogger;
use App\Support\DatabaseBackup;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Throwable;

class BackupController extends Controller
{
    public function index()
    {
        return inertia('Admin/Backups/Index');
    }

    public function download(Request $request, DatabaseBackup $backup, AuditLogger $audit): BinaryFileResponse|RedirectResponse
    {
        try {
            $export = $backup->export();
        } catch (Throwable $exception) {
            report($exception);

            return back()->withErrors(['backup' => 'No se pudo generar el respaldo. Verifica la conexión de PostgreSQL e inténtalo nuevamente.']);
        }

        $audit->record(
            $request,
            'backup.downloaded',
            'Descargó un respaldo completo de la base de datos.',
            'database',
            config('database.connections.'.config('database.default').'.database'),
            ['format' => 'postgresql-custom', 'filename' => $export['filename']],
        );

        return response()->download($export['path'], $export['filename'], [
            'Content-Type' => 'application/octet-stream',
        ])->deleteFileAfterSend(true);
    }
}
