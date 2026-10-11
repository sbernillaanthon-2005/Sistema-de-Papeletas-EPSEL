<?php

namespace App\Http\Controllers\Auth;

use App\Domain\User\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Support\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request, AuditLogger $audit): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        $audit->record($request, 'session.started', 'Inició sesión en el portal.');

        $role = $request->user()->rol->value ?? $request->user()->rol;

        return match ($role) {
            UserRole::ADMIN->value => redirect()->intended(route('admin.dashboard', absolute: false)),
            default => redirect()->intended(route('dashboard', absolute: false)),
        };
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request, AuditLogger $audit): RedirectResponse
    {
        $audit->record($request, 'session.ended', 'Cerró sesión en el portal.');
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
