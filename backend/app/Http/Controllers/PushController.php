<?php

namespace App\Http\Controllers;

use App\Models\PushDelivery;
use App\Models\PushSubscription;
use App\Services\Push\EndpointPolicy;
use App\Services\Push\VapidKeys;
use App\Services\PushNotificationService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class PushController
{
    public function config(Request $request)
    {
        return response()->json(['enabled' => (bool) config('webpush.enabled'), 'public_key' => config('webpush.enabled') ? config('webpush.vapid.public_key') : null, 'user' => ['id' => Auth::guard('web')->id(), 'name' => Auth::guard('web')->user()->name], 'test_auth' => app()->environment('local') && config('webpush.test_auth') && Auth::guard('web')->user()->is_push_test]);
    }

    public function index(Request $request)
    {
        return response()->json(['devices' => Auth::guard('web')->user()->pushSubscriptions()->orderBy('id')->get()->map(fn ($sub) => $this->resource($sub))]);
    }

    private function resource(PushSubscription $sub): array
    {
        return ['id' => $sub->id, 'fingerprint' => $sub->endpoint_hash, 'label' => $sub->label, 'last_result' => $sub->last_result, 'last_success_at' => $sub->last_success_at];
    }

    public function store(Request $request, EndpointPolicy $policy)
    {
        abort_unless(config('webpush.enabled'), 503);
        $data = $request->validate(['endpoint' => 'required|string|max:2048', 'keys.p256dh' => 'required|string|max:100', 'keys.auth' => 'required|string|max:30', 'label' => 'sometimes|string|max:80', 'contentEncoding' => 'sometimes|in:aes128gcm']);
        try {
            $policy->host($data['endpoint']);
            $public = VapidKeys::decode($data['keys']['p256dh'], 65);
            VapidKeys::decode($data['keys']['auth'], 16);
            $pem = "-----BEGIN PUBLIC KEY-----\n".chunk_split(base64_encode(hex2bin('3059301306072a8648ce3d020106082a8648ce3d030107034200').$public), 64, "\n")."-----END PUBLIC KEY-----\n";
            if (! @openssl_pkey_get_public($pem)) {
                throw new RuntimeException('key');
            }
        } catch (RuntimeException $error) {
            throw ValidationException::withMessages(['endpoint' => 'Inscrição inválida.']);
        }
        $user = Auth::guard('web')->user();
        $hash = hash('sha256', $data['endpoint']);
        $created = false;
        $write = function () use ($hash, $data, $user, &$created) {
            $sub = PushSubscription::where('endpoint_hash', $hash)->lockForUpdate()->first();
            if ($sub) {
                abort_unless((int) $sub->subscribable_id === $user->id && $sub->subscribable_type === $user->getMorphClass(), 409);
            } else {
                $sub = new PushSubscription(['endpoint_hash' => $hash, 'subscribable_id' => $user->id, 'subscribable_type' => $user->getMorphClass()]);
                $created = true;
            }
            $sub->fill(['endpoint' => $data['endpoint'], 'public_key' => $data['keys']['p256dh'], 'auth_token' => $data['keys']['auth'], 'content_encoding' => 'aes128gcm', 'label' => $data['label'] ?? 'Dispositivo'])->save();

            return $sub;
        };
        try {
            $sub = DB::transaction($write);
        } catch (QueryException $error) {
            if (($error->errorInfo[1] ?? null) !== 1062) {
                throw $error;
            }
            $created = false;
            $sub = DB::transaction($write);
        }

        $request->session()->put('push_subscription_id', $sub->id);

        return response()->json($this->resource($sub), $created ? 201 : 200);
    }

    public function destroy(Request $request, int $id)
    {
        $sub = Auth::guard('web')->user()->pushSubscriptions()->findOrFail($id);
        $sub->delete();

        return response()->noContent();
    }

    public function preferences(Request $request)
    {
        return response()->json(['enabled' => Auth::guard('web')->user()->push_enabled]);
    }

    public function updatePreferences(Request $request)
    {
        $data = $request->validate(['enabled' => 'required|boolean']);
        abort_if($data['enabled'] && ! config('webpush.enabled'), 503);
        Auth::guard('web')->user()->forceFill(['push_enabled' => $data['enabled']])->save();

        return response()->json(['enabled' => (bool) $data['enabled']]);
    }

    public function test(Request $request, PushNotificationService $service)
    {
        abort_unless(app()->environment('local') && config('webpush.test_auth') && Auth::guard('web')->user()->is_push_test, 404);
        $data = $request->validate(['subscription_id' => 'required|integer']);
        Auth::guard('web')->user()->pushSubscriptions()->findOrFail($data['subscription_id']);

        return response()->json($service->sendToUser(Auth::guard('web')->user(), ['title' => 'Teste da PWA', 'body' => 'Notificação enviada pelo backend.', 'url' => '/'], $data['subscription_id']), 202);
    }

    public function deliveries(Request $request)
    {
        return response()->json(['deliveries' => PushDelivery::where('user_id', Auth::guard('web')->id())->latest()->limit(20)->get(['id', 'status', 'result', 'provider_status', 'attempts', 'created_at'])]);
    }
}
