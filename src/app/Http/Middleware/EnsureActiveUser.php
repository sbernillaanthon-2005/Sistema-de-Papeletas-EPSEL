<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureActiveUser
{
    public function handle(Request $request, Closure $next)
    {
        abort_if($request->user() && ! $request->user()->activo, 403, 'Tu cuenta está desactivada.');

        return $next($request);
    }
}
