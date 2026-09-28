<?php

namespace App\Http\Controllers;

use App\Models\ExitSlip;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;

class ExitSlipPdfController extends Controller
{
    public function __invoke(ExitSlip $exitSlip)
    {
        Gate::authorize('generatePdf', $exitSlip);
        $signatures = [];
        foreach (['practicante', 'jefe', 'rrhh'] as $role) {
            $path = $exitSlip->{'firma_'.$role.'_path'};
            $signatures[$role] = $path && Storage::disk('private')->exists($path)
                ? 'data:image/png;base64,'.base64_encode(Storage::disk('private')->get($path)) : null;
        }

        return Pdf::loadView('pdf.exit-slip', ['slip' => $exitSlip, 'signatures' => $signatures])
            ->setPaper('a4')->stream($exitSlip->codigo.'.pdf', ['Attachment' => false]);
    }
}
