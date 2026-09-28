<?php

namespace App\Http\Controllers\Profile;

use App\Application\User\Actions\UploadSignature;
use App\Http\Controllers\Controller;
use App\Models\Signature;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SignatureController extends Controller
{
    public function store(Request $request, UploadSignature $uploadSignature)
    {
        $request->validate([
            'signature' => 'required|image|mimes:png,jpg,jpeg|max:10240|dimensions:min_width=100,min_height=50,max_width=6000,max_height=6000',
        ], [
            'signature.required' => 'Debes seleccionar un archivo de imagen.',
            'signature.image' => 'El archivo debe ser una imagen válida.',
            'signature.mimes' => 'El formato debe ser PNG, JPG o JPEG.',
            'signature.max' => 'La imagen es demasiado pesada. El tamaño máximo permitido es 10 MB.',
            'signature.dimensions' => 'La imagen tiene dimensiones no válidas (demasiado pequeña o excesivamente grande).',
        ]);

        $uploadSignature->execute(Auth::id(), $request->file('signature'));

        return back()->with('status', 'signature-updated');
    }

    public function show($id)
    {
        $signature = Signature::findOrFail($id);

        // Security: Only the owner can view their signature directly.
        // Approvers view signatures through exit slips snapshot paths.
        if ($signature->user_id !== Auth::id()) {
            abort(403, 'No tienes permiso para ver esta firma.');
        }

        $path = $signature->ruta_archivo;
        if (!Storage::disk('private')->exists($path)) {
            abort(404);
        }

        return Storage::disk('private')->response($path);
    }
}
