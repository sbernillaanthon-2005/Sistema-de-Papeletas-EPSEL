<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ExitSlipFormat;
use App\Models\ExitSlipFormatSetting;
use App\Support\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ExitSlipFormatController extends Controller
{
    public function index()
    {
        $settings = ExitSlipFormatSetting::current();
        $formats = ExitSlipFormat::query()
            ->with('uploadedBy:id,nombres,apellidos')
            ->latest()
            ->get()
            ->map(fn (ExitSlipFormat $format) => [
                'id' => $format->id,
                'name' => $format->name,
                'original_name' => $format->original_name,
                'size_bytes' => $format->size_bytes,
                'is_active' => $format->is_active,
                'created_at' => $format->created_at?->toDateTimeString(),
                'uploaded_by' => trim(($format->uploadedBy?->nombres ?? '').' '.($format->uploadedBy?->apellidos ?? '')),
            ]);

        return inertia('Admin/ExitSlipFormats/Index', [
            'formats' => $formats,
            'baseAvailable' => $settings->base_available,
            'currentPreviewUrl' => route('exit-slip-formats.current'),
        ]);
    }

    public function store(Request $request, AuditLogger $audit): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'format' => ['required', 'file', 'mimes:pdf', 'max:10240'],
            'activate' => ['nullable', 'boolean'],
        ]);

        $file = $data['format'];
        $path = $file->storeAs(
            'exit-slip-formats',
            Str::uuid().'.pdf',
            'private',
        );

        try {
            $format = DB::transaction(function () use ($data, $file, $path, $request) {
                $activate = (bool) ($data['activate'] ?? false);

                if ($activate) {
                    ExitSlipFormat::query()->where('is_active', true)->update(['is_active' => false]);
                }

                return ExitSlipFormat::create([
                    'name' => $data['name'],
                    'file_path' => $path,
                    'original_name' => $file->getClientOriginalName(),
                    'mime_type' => $file->getMimeType() ?: 'application/pdf',
                    'size_bytes' => $file->getSize(),
                    'is_active' => $activate,
                    'uploaded_by' => $request->user()->id,
                ]);
            });
        } catch (\Throwable $exception) {
            Storage::disk('private')->delete($path);
            throw $exception;
        }

        $audit->record(
            $request,
            'exit_slip_format.uploaded',
            'Subió un formato de papeleta para revisión.',
            'exit_slip_format',
            (string) $format->id,
            ['name' => $format->name, 'size_bytes' => $format->size_bytes, 'active' => $format->is_active],
        );

        return back()->with('success', $format->is_active
            ? 'Formato cargado y publicado para los usuarios.'
            : 'Formato cargado. Revísalo y actívalo cuando esté listo.');
    }

    public function activate(Request $request, ExitSlipFormat $exitSlipFormat, AuditLogger $audit): RedirectResponse
    {
        DB::transaction(function () use ($exitSlipFormat) {
            ExitSlipFormat::query()->where('is_active', true)->update(['is_active' => false]);
            $exitSlipFormat->update(['is_active' => true]);
        });

        $audit->record(
            $request,
            'exit_slip_format.activated',
            'Publicó un formato de papeleta para todos los usuarios.',
            'exit_slip_format',
            (string) $exitSlipFormat->id,
            ['name' => $exitSlipFormat->name],
        );

        return back()->with('success', 'El formato está activo y disponible para el personal.');
    }

    public function update(Request $request, ExitSlipFormat $exitSlipFormat, AuditLogger $audit): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'format' => ['nullable', 'file', 'mimes:pdf', 'max:10240'],
        ]);

        $oldPath = $exitSlipFormat->file_path;
        $newPath = $oldPath;
        $replacement = $request->file('format');

        if ($replacement) {
            $newPath = $replacement->storeAs('exit-slip-formats', Str::uuid().'.pdf', 'private');
        }

        try {
            $exitSlipFormat->update([
                'name' => $data['name'],
                'file_path' => $newPath,
                'original_name' => $replacement ? $replacement->getClientOriginalName() : $exitSlipFormat->original_name,
                'mime_type' => $replacement ? ($replacement->getMimeType() ?: 'application/pdf') : $exitSlipFormat->mime_type,
                'size_bytes' => $replacement ? $replacement->getSize() : $exitSlipFormat->size_bytes,
            ]);
        } catch (\Throwable $exception) {
            if ($newPath !== $oldPath) {
                Storage::disk('private')->delete($newPath);
            }
            throw $exception;
        }

        if ($newPath !== $oldPath) {
            Storage::disk('private')->delete($oldPath);
        }

        $audit->record($request, 'exit_slip_format.updated', 'Actualizó un formato de papeleta.', 'exit_slip_format', (string) $exitSlipFormat->id, ['name' => $exitSlipFormat->name, 'file_replaced' => $newPath !== $oldPath]);

        return back()->with('success', 'Formato actualizado correctamente.');
    }

    public function destroy(Request $request, ExitSlipFormat $exitSlipFormat, AuditLogger $audit): RedirectResponse
    {
        $wasActive = $exitSlipFormat->is_active;

        Storage::disk('private')->delete($exitSlipFormat->file_path);
        $exitSlipFormat->delete();

        $audit->record(
            $request,
            'exit_slip_format.deleted',
            'Eliminó un formato de papeleta no publicado.',
            'exit_slip_format',
            (string) $exitSlipFormat->id,
            ['name' => $exitSlipFormat->name],
        );

        return back()->with('success', $wasActive
            ? (ExitSlipFormatSetting::current()->base_available
                ? 'Formato eliminado. Se restauró el formato base del sistema.'
                : 'Formato eliminado. No hay un formato vigente publicado.')
            : 'Formato eliminado.');
    }

    public function destroyBase(Request $request, AuditLogger $audit): RedirectResponse
    {
        ExitSlipFormatSetting::current()->update(['base_available' => false]);

        $audit->record($request, 'exit_slip_format.base_removed', 'Retiró el formato base de papeleta.', 'exit_slip_format', 'base', []);

        return back()->with('success', 'Formato base eliminado. El personal verá el aviso de actualización hasta que publiques una nueva versión.');
    }
}
