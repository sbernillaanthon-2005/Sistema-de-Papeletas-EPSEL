<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Support\AuditLogger;
use App\Support\DatabaseBackup;
use App\Models\ScheduledDatabaseBackup;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Throwable;

class BackupController extends Controller
{
    public function index()
    {
        // Si no existe respaldo automático o el último tiene >= 12 horas, generarlo automáticamente
        $latest = ScheduledDatabaseBackup::query()->latest('created_at')->first();
        if (! $latest || $latest->created_at?->lte(now()->subHours(12))) {
            Artisan::call('backups:run-automatic');
        }

        return inertia('Admin/Backups/Index', [
            'automaticBackups' => ScheduledDatabaseBackup::query()->latest()->limit(20)->get()->map(fn (ScheduledDatabaseBackup $backup) => [
                'id' => $backup->id,
                'filename' => $backup->filename,
                'size_bytes' => $backup->size_bytes,
                'created_at' => $backup->created_at?->toDateTimeString(),
            ]),
        ]);
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
            ['format' => $export['format'] ?? 'postgresql-custom', 'filename' => $export['filename']],
        );

        return response()->download($export['path'], $export['filename'], [
            'Content-Type' => 'application/octet-stream',
        ])->deleteFileAfterSend(true);
    }

    public function downloadAutomatic(ScheduledDatabaseBackup $scheduledDatabaseBackup): BinaryFileResponse|RedirectResponse
    {
        $path = storage_path('app/private/'.$scheduledDatabaseBackup->file_path);

        if (! Storage::disk('private')->exists($scheduledDatabaseBackup->file_path)) {
            $scheduledDatabaseBackup->delete();
            return back()->withErrors(['backup' => 'El archivo de respaldo ya no está disponible.']);
        }

        return response()->download($path, $scheduledDatabaseBackup->filename, [
            'Content-Type' => 'application/octet-stream',
        ]);
    }

    public function destroyAutomatic(Request $request, ScheduledDatabaseBackup $scheduledDatabaseBackup, AuditLogger $audit): \Illuminate\Http\JsonResponse
    {
        // Eliminar el archivo físico si aún existe en disco
        $relativePath = $scheduledDatabaseBackup->file_path;
        $absolutePath = storage_path('app/private/'.$relativePath);

        try {
            if (Storage::disk('private')->exists($relativePath)) {
                Storage::disk('private')->delete($relativePath);
            }
        } catch (Throwable $exception) {
            report($exception);
        }

        for ($attempt = 0; $attempt < 3; $attempt++) {
            clearstatcache(true, $absolutePath);
            if (! is_file($absolutePath)) {
                break;
            }

            try {
                File::delete($absolutePath);
            } catch (Throwable $exception) {
                report($exception);
            }

            usleep(100_000);
        }

        clearstatcache(true, $absolutePath);
        if (is_file($absolutePath)) {
            return response()->json([
                'message' => 'No se pudo eliminar el archivo de respaldo. Puede estar en uso; ciérralo e inténtalo nuevamente.',
            ], 409);
        }

        $filename = $scheduledDatabaseBackup->filename;

        // Eliminar el registro de base de datos
        $scheduledDatabaseBackup->delete();

        $audit->record(
            $request,
            'backup.deleted',
            "Eliminó el respaldo automático: {$filename}",
            'database',
            config('database.connections.'.config('database.default').'.database'),
            ['filename' => $filename],
        );

        return response()->json(['message' => 'Respaldo eliminado correctamente.']);
    }
}
