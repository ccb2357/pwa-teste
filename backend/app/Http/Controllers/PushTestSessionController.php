<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PushTestSessionController
{
    private function allowed(): void
    {
        abort_unless(app()->environment('local') && config('webpush.test_auth'), 404);
    }

    public function show()
    {
        $this->allowed();
        $user = Auth::guard('web')->user();

        return response()->json(['test_auth' => true, 'user' => $user ? ['id' => $user->id, 'name' => $user->name] : null]);
    }

    public function store(Request $request)
    {
        $this->allowed();
        $request->validate(['code' => 'required|string|size:64']);
        abort_if(Auth::guard('web')->check(), 409);
        $user = DB::transaction(function () use ($request) {
            $token = DB::table('push_test_tokens')->where('token_hash', hash('sha256', $request->input('code')))->lockForUpdate()->first();
            abort_unless($token && now()->lt($token->expires_at), 401);
            $user = User::whereKey($token->user_id)->where('is_push_test', true)->firstOrFail();
            DB::table('push_test_tokens')->where('id', $token->id)->delete();

            return $user;
        });
        Auth::guard('web')->login($user);
        $request->session()->regenerate();
        $request->session()->regenerateToken();

        return response()->json(['user' => ['id' => $user->id, 'name' => $user->name]]);
    }

    public function destroy(Request $request)
    {
        $this->allowed();
        abort_unless(Auth::guard('web')->check() && Auth::guard('web')->user()->is_push_test, 401);
        $id = $request->input('subscription_id', $request->session()->get('push_subscription_id'));
        if (is_numeric($id)) {
            Auth::guard('web')->user()->pushSubscriptions()->whereKey((int) $id)->delete();
        }
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent();
    }
}
