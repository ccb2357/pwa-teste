<?php

namespace App\Notifications;

use App\Models\PushDelivery;
use App\Services\Push\SafeWebPushChannel;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushMessage;

class FoundationPushNotification extends Notification
{
    public function __construct(public PushDelivery $delivery) {}

    public function via(object $notifiable): array
    {
        return [SafeWebPushChannel::class];
    }

    public function toWebPush(object $notifiable): WebPushMessage
    {
        $payload = $this->delivery->payload;
        $message = (new WebPushMessage)->title($payload['title'])->body($payload['body'])->icon('/icons/icon-192.png')->tag($this->delivery->id)->data(['url' => $payload['url']]);
        if (! empty($payload['image'])) {
            $message->image($payload['image']);
        }

        return $message;
    }
}
