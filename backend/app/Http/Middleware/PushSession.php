<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PushSession
{
    public function handle(Request $request, Closure $next)
    {
        abort_unless(Auth::guard('web')->check(), 401);

        return $next($request);
    }
}
