<?php

namespace App\Services;

use App\Jobs\SendPushDelivery;
use App\Models\PushDelivery;
use App\Models\User;
use App\Services\Push\PushPayload;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

class PushNotificationService
{
    public function sendToUser(User $user, array $payload, ?int $subscriptionId = null): array
    {
        return $this->sendToMany(User::query()->whereKey($user->id), $payload, $subscriptionId);
    }

    public function sendToMany(Builder $users, array $payload, ?int $subscriptionId = null): array
    {
        abort_unless(config('webpush.enabled'), 503, 'Push desabilitado.');
        $payload = PushPayload::validate($payload);
        $batch = (string) Str::uuid();
        $queued = 0;
        (clone $users)->where('push_enabled', true)->chunkById(100, function ($chunk) use ($payload, $batch, $subscriptionId, &$queued): void {
            foreach ($chunk as $user) {
                $user->pushSubscriptions()->when($subscriptionId, fn ($query) => $query->whereKey($subscriptionId))->chunkById(100, function ($subscriptions) use ($user, $payload, $batch, &$queued): void {
                    foreach ($subscriptions as $subscription) {
                        $delivery = PushDelivery::create(['id' => (string) Str::uuid(), 'batch_id' => $batch, 'user_id' => $user->id, 'subscription_id' => $subscription->id, 'payload' => $payload]);
                        SendPushDelivery::dispatch($delivery->id)->afterCommit();
                        $queued++;
                    }
                });
            }
        });

        return ['batch_id' => $batch, 'queued' => $queued, 'status' => 'queued'];
    }
}
