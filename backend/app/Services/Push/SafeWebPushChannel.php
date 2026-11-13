<?php

namespace App\Services\Push;

use App\Models\PushDelivery;
use App\Models\PushSubscription;
use App\Models\User;
use App\Notifications\FoundationPushNotification;
use GuzzleHttp\Client;
use GuzzleHttp\Handler\CurlHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\HttpFactory;
use Minishlink\WebPush\WebPush;
use NotificationChannels\WebPush\WebPushChannel;
use Psr\Http\Client\ClientInterface;
use Psr\Log\NullLogger;
use RuntimeException;
use Throwable;

class SafeWebPushChannel
{
    public function __construct(private EndpointPolicy $policy) {}

    public function send(User $user, FoundationPushNotification $notification): void
    {
        $delivery = $notification->delivery;
        $subscription = PushSubscription::find($delivery->subscription_id);
        if (! config('webpush.enabled') || ! $user->fresh()?->push_enabled || ! $subscription || $subscription->subscribable_type !== $user->getMorphClass() || (int) $subscription->subscribable_id !== $user->id) {
            $delivery->update(['status' => 'cancelled', 'result' => 'no-longer-authorized']);

            return;
        }
        try {
            $keys = config('webpush.vapid');
            VapidKeys::validate($keys);
            $pin = $this->policy->pin($subscription->endpoint);
            $engine = $this->engine($keys, $pin);
            (new WebPushChannel($engine, new DeliveryReports($delivery)))->send($user, $notification);
            // A concurrent revocation can remove the route before the official channel loads it.
            PushDelivery::whereKey($delivery->id)->where('status', 'queued')->update(['status' => 'cancelled', 'result' => 'subscription-removed']);
        } catch (Throwable $error) {
            // Never chain transport errors: their messages/traces may contain subscriptions.
            if (in_array($error->getMessage(), ['push-provider-retry', 'push-dns-unavailable'], true)) {
                throw new RuntimeException('push-provider-retry');
            }
            $delivery->update(['status' => 'failed', 'result' => 'configuration-or-endpoint']);
        }
    }

    protected function httpClient(array $pin): ClientInterface
    {
        return new Client(['handler' => HandlerStack::create(new CurlHandler), 'timeout' => 15, 'connect_timeout' => 5, 'verify' => true, 'proxy' => '', 'allow_redirects' => false, 'http_errors' => false, 'curl' => [CURLOPT_RESOLVE => $pin]]);
    }

    protected function engine(#[\SensitiveParameter] array $keys, array $pin): WebPush
    {
        $factory = new HttpFactory;

        // WebPush emits PHP notices for optional GMP/BCMath when no PSR logger is supplied.
        // Laravel converts those notices to exceptions. Keep SDK diagnostics private;
        // required extensions are checked by bootstrap, failures by exceptions/reports.
        return new WebPush(['VAPID' => ['subject' => $keys['subject'], 'publicKey' => $keys['public_key'], 'privateKey' => $keys['private_key']]], ['TTL' => 3600, 'urgency' => 'normal'], $this->httpClient($pin), $factory, $factory, null, new NullLogger);
    }
}
