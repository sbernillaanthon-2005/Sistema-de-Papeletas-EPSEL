<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'flash' => ['success' => fn () => $request->session()->get('success')],
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'nombres' => $request->user()->nombres,
                    'apellidos' => $request->user()->apellidos,
                    'email' => $request->user()->email,
                    'dni' => $request->user()->dni,
                    'rol' => $request->user()->rol?->value,
                    'rol_label' => $request->user()->rol?->label(),
                    'area_id' => $request->user()->area_id,
                    'cargo_designado' => $request->user()->cargo_designado,
                    'has_signature' => $request->user()->signature()->exists(),
                    'signature_id' => $request->user()->signature()->value('id'),
                    'profile_photo_path' => $request->user()->profile_photo_path,
                    'profile_photo_url' => $request->user()->profile_photo_url,
                ] : null,
            ],
        ];
    }
}
