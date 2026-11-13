<?php

namespace App\Jobs;

use App\Models\PushDelivery;
use App\Models\User;
use App\Notifications\FoundationPushNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;
use Throwable;

class SendPushDelivery implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 45;

    public function __construct(public string $deliveryId)
    {
        $this->onConnection('database')->onQueue('push');
    }

    public function backoff(): array
    {
        return [30, 120, 600];
    }

    public function handle(): void
    {
        $lock = Cache::lock('push-delivery:'.$this->deliveryId, 60);
        if (! $lock->get()) {
            $this->release(10);

            return;
        }
        try {
            $delivery = PushDelivery::find($this->deliveryId);
            if (! $delivery || in_array($delivery->status, ['accepted', 'failed', 'cancelled'], true)) {
                return;
            }
            $user = User::find($delivery->user_id);
            if (! $user || ! $user->push_enabled || ! config('webpush.enabled') || $delivery->created_at->lt(now()->subDay())) {
                $delivery->update(['status' => 'cancelled', 'result' => 'no-longer-authorized']);

                return;
            }
            $delivery->increment('attempts');
            $user->notifyNow(new FoundationPushNotification($delivery));
        } finally {
            $lock->release();
        }
    }

    public function failed(?Throwable $error): void
    {
        PushDelivery::whereKey($this->deliveryId)->where('status', 'queued')->update(['status' => 'failed', 'result' => 'retries-exhausted']);
    }
}
