<?php

namespace App\Services\Push;

use App\Models\PushDelivery;
use Minishlink\WebPush\MessageSentReport;
use NotificationChannels\WebPush\PushSubscription;
use NotificationChannels\WebPush\ReportHandlerInterface;
use NotificationChannels\WebPush\WebPushMessageInterface;
use RuntimeException;

class DeliveryReports implements ReportHandlerInterface
{
    public function __construct(private PushDelivery $delivery) {}

    public function handleReport(MessageSentReport $report, PushSubscription $subscription, WebPushMessageInterface $message): void
    {
        $status = $report->getResponse()?->getStatusCode();
        $this->delivery->provider_status = $status;
        if ($report->isSuccess()) {
            $this->delivery->status = 'accepted';
            $this->delivery->result = 'provider-accepted';
            $subscription->forceFill(['last_success_at' => now(), 'last_result' => 'provider-accepted'])->save();
        } elseif (in_array($status, [404, 410], true)) {
            $this->delivery->status = 'failed';
            $this->delivery->result = 'subscription-expired';
            $subscription->delete();
        } elseif ($status === null || $status === 429 || $status >= 500) {
            $this->delivery->result = 'provider-temporary';
            $this->delivery->save();
            throw new RuntimeException('push-provider-retry');
        } else {
            $this->delivery->status = 'failed';
            $this->delivery->result = in_array($status, [401, 403], true) ? 'provider-auth' : 'provider-rejected';
            $subscription->forceFill(['last_result' => $this->delivery->result])->save();
        }
        $this->delivery->save();
    }
}
