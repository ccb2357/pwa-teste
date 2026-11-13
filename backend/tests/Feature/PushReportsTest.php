<?php

namespace Tests\Feature;

use App\Models\PushDelivery;
use App\Models\PushSubscription;
use App\Services\Push\DeliveryReports;
use GuzzleHttp\Psr7\Request;
use GuzzleHttp\Psr7\Response;
use Minishlink\WebPush\MessageSentReport;
use Mockery;
use NotificationChannels\WebPush\WebPushMessage;
use RuntimeException;
use Tests\TestCase;

class PushReportsTest extends TestCase
{
    public function test_only_404_and_410_remove_subscription_and_transient_failures_retry(): void
    {
        foreach ([201, 401, 403, 404, 410, 429, 503, null] as $status) {
            $delivery = Mockery::mock(PushDelivery::class)->makePartial();
            $delivery->status = 'queued';
            $delivery->shouldReceive('save')->once()->andReturnTrue();
            $subscription = Mockery::mock(PushSubscription::class)->makePartial();
            $expired = in_array($status, [404, 410], true);
            $temporary = $status === null || $status === 429 || $status === 503;
            $subscription->shouldReceive('delete')->times($expired ? 1 : 0)->andReturnTrue();
            $subscription->shouldReceive('save')->times(! $expired && ! $temporary ? 1 : 0)->andReturnTrue();
            $report = new MessageSentReport(new Request('POST', 'https://fcm.googleapis.com/test'), $status ? new Response($status) : null, $status === 201);
            try {
                (new DeliveryReports($delivery))->handleReport($report, $subscription, new WebPushMessage);
                $this->assertFalse($temporary);
                $this->assertSame($status === 201 ? 'accepted' : 'failed', $delivery->status);
            } catch (RuntimeException $error) {
                $this->assertTrue($temporary);
                $this->assertSame('push-provider-retry', $error->getMessage());
                $this->assertSame('queued', $delivery->status);
            }
        }
    }
}
