<?php

namespace Tests\Feature;

use App\Services\Push\EndpointPolicy;
use App\Services\Push\SafeWebPushChannel;
use GuzzleHttp\Client;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use Minishlink\WebPush\ContentEncoding;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\VAPID;
use Minishlink\WebPush\WebPush;
use Psr\Http\Client\ClientInterface;
use Tests\TestCase;

class PushTransportTest extends TestCase
{
    public function test_real_encryption_and_channel_initialization_work_with_laravel_error_handler_and_mock_provider(): void
    {
        // Run under Laravel's real error handler; optional GMP/BCMath notices must not abort.
        // All HTTP is mocked. No subscription or real provider is contacted.
        $client = new Client(['handler' => HandlerStack::create(new MockHandler([new Response(201)]))]);
        $channel = new class(new EndpointPolicy, $client) extends SafeWebPushChannel
        {
            public function __construct(EndpointPolicy $policy, private ClientInterface $client)
            {
                parent::__construct($policy);
            }

            protected function httpClient(array $pin): ClientInterface
            {
                return $this->client;
            }

            public function prepare(array $keys): WebPush
            {
                return $this->engine($keys, []);
            }
        };
        $server = VAPID::createVapidKeys();
        $device = VAPID::createVapidKeys();
        $engine = $channel->prepare(['subject' => 'mailto:push@example.test', 'public_key' => $server['publicKey'], 'private_key' => $server['privateKey']]);
        $auth = rtrim(strtr(base64_encode(random_bytes(16)), '+/', '-_'), '=');
        $engine->queueNotification(new Subscription('https://fcm.googleapis.com/mock-only', $device['publicKey'], $auth, ContentEncoding::aes128gcm), '{"title":"Teste","data":{"url":"/"}}');
        $reports = iterator_to_array($engine->flush());
        $this->assertCount(1, $reports);
        $this->assertTrue($reports[0]->isSuccess());
        $this->assertSame(201, $reports[0]->getResponse()->getStatusCode());
        $this->assertNotSame('{"title":"Teste","data":{"url":"/"}}', (string) $reports[0]->getRequest()->getBody());
    }
}
