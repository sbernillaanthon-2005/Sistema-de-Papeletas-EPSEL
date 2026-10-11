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
            'auth' => function () use ($request) {
                $user = $request->user();
                $signatureId = $user && $user->rol?->value !== 'admin'
                    ? $user->signature()->value('id')
                    : null;

                return ['user' => $user ? [
                    'id' => $user->id,
                    'nombres' => $user->nombres,
                    'apellidos' => $user->apellidos,
                    'email' => $user->email,
                    'dni' => $user->dni,
                    'rol' => $user->rol?->value,
                    'rol_label' => $user->rol?->label(),
                    'area_id' => $user->area_id,
                    'cargo_designado' => $user->cargo_designado,
                    'has_signature' => $signatureId !== null,
                    'signature_id' => $signatureId,
                    'profile_photo_path' => $user->profile_photo_path,
                    'profile_photo_url' => $user->profile_photo_url,
                ] : null];
            },
        ];
    }
}
