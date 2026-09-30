<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ReniecController extends Controller
{
    /**
     * Consulta el DNI en la API de Decolecta.
     */
    public function consult($dni)
    {
        if (!preg_match('/^\d{8}$/', $dni)) {
            return response()->json(['error' => 'DNI inválido'], 400);
        }

        $token = env('RENIEC_API_TOKEN', 'sk_19949.rqIGDvQf3OZA8Mhvte5kNYkK6mJZw4B1'); // Usando el provisto temporalmente como default por si acaso

        try {
            // El API de decolecta se documenta típicamente como GET /dni/{dni} (asumiendo esto basado en APIs similares en Perú)
            // Vamos a hacer la petición con el Bearer Token.
            // Decolecta API DNI url format: https://api.decolecta.com/api/dni/{dni}
            $response = Http::withToken($token)
                ->timeout(5)
                ->get('https://api.decolecta.com/api/dni/' . $dni);

            if ($response->successful()) {
                $data = $response->json();
                
                // Las respuestas típicas devuelven nombres y apellidos.
                // Decolecta devuelve: {"success":true, "data": {...}}
                $personData = $data['data'] ?? $data;

                return response()->json([
                    'success' => true,
                    'data' => $personData
                ]);
            }

            return response()->json([
                'success' => false,
                'error' => 'No se encontró el DNI o el servicio falló.'
            ], $response->status() === 404 ? 404 : 500);

        } catch (\Exception $e) {
            Log::error('Error consultando RENIEC API: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Error de conexión con el servicio RENIEC.'
            ], 500);
        }
    }
}
