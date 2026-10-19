<?php

namespace App\Http\Controllers;

use App\Models\ExitSlipFormat;
use App\Models\ExitSlipFormatSetting;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExitSlipFormatPreviewController extends Controller
{
    public function show(): Response|StreamedResponse|BinaryFileResponse
    {
        $format = ExitSlipFormat::query()->where('is_active', true)->latest()->first();

        if ($format && Storage::disk('private')->exists($format->file_path)) {
            return Storage::disk('private')->response(
                $format->file_path,
                $format->original_name,
                ['Content-Type' => 'application/pdf', 'Content-Disposition' => 'inline; filename="'.$format->original_name.'"'],
            );
        }

        abort_unless(ExitSlipFormatSetting::current()->base_available, 404, 'No hay un formato de papeleta vigente.');

        return response()->file(
            resource_path('pdf/Autorizacion_salida_practicante_EPSEL.pdf'),
            [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="Autorizacion_salida_practicante_EPSEL.pdf"',
            ],
        );
    }
}
