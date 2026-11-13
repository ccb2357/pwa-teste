<?php

namespace Tests\Unit;

use App\Services\Push\EndpointPolicy;
use App\Services\Push\PushPayload;
use App\Services\Push\VapidKeys;
use Minishlink\WebPush\VAPID;
use PHPUnit\Framework\TestCase;
use RuntimeException;

class PushPolicyTest extends TestCase
{
    public function test_generated_vapid_pair_is_valid_and_mismatched_pair_is_rejected(): void
    {
        $first = VAPID::createVapidKeys();
        $second = VAPID::createVapidKeys();
        $keys = ['subject' => 'mailto:push@example.test', 'public_key' => $first['publicKey'], 'private_key' => $first['privateKey']];
        VapidKeys::validate($keys);
        $this->addToAssertionCount(1);
        $keys['private_key'] = $second['privateKey'];
        $this->expectException(RuntimeException::class);
        VapidKeys::validate($keys);
    }

    public function test_endpoint_and_dns_cannot_target_private_networks(): void
    {
        $policy = new class extends EndpointPolicy
        {
            public array $ips = ['142.250.191.10'];

            public function addresses(string $host): array
            {
                return $this->ips;
            }
        };
        $this->assertSame(['fcm.googleapis.com:443:142.250.191.10'], $policy->pin('https://fcm.googleapis.com/test'));
        foreach (['127.0.0.1', '10.0.0.1', '169.254.169.254', '100.64.0.1', '198.18.0.1', '::1', '::ffff:127.0.0.1', '2001:db8::1'] as $ip) {
            $policy->ips = [$ip];
            try {
                $policy->pin('https://fcm.googleapis.com/test');
                $this->fail('Private DNS accepted');
            } catch (RuntimeException $error) {
                $this->assertSame('push-dns-not-public', $error->getMessage());
            }
        }
        foreach (['http://fcm.googleapis.com/x', 'https://fcm.googleapis.com.evil.test/x', 'https://127.0.0.1/x', 'https://user@fcm.googleapis.com/x', 'https://fcm.googleapis.com:444/x'] as $endpoint) {
            try {
                $policy->host($endpoint);
                $this->fail('Invalid endpoint accepted');
            } catch (RuntimeException $error) {
                $this->assertSame('push-endpoint-invalid', $error->getMessage());
            }
        }
    }

    public function test_payload_routes_exclude_technical_and_encoded_unsafe_paths(): void
    {
        $this->assertTrue(PushPayload::path('/transition/fade?item=1'));
        foreach (['//evil.test', '/%2fevil.test', '/%5cevil.test', '/api/v1/status', '/%61pi/users', '/.env', '/backend/a.php', '/a/../api/status', '/a%00b'] as $url) {
            $this->assertFalse(PushPayload::path($url), $url);
        }
    }
}
