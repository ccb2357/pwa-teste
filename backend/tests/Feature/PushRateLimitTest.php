<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

class PushRateLimitTest extends TestCase
{
    private function sessionUser(): void
    {
        $user = new User(['name' => 'Rate limit test']);
        $user->id = 42;
        $this->actingAs($user, 'web');
        config(['webpush.enabled' => true]);
    }

    public function test_reading_config_does_not_spend_the_three_test_send_attempts(): void
    {
        $this->sessionUser();
        for ($i = 0; $i < 4; $i++) {
            $this->getJson('/api/v1/push/config')->assertOk();
        }
        // Test auth is disabled: reaching its 404 proves throttle allowed the request.
        // No notification or database operation occurs.
        for ($i = 0; $i < 3; $i++) {
            $this->postJson('/api/v1/push/test')->assertNotFound();
        }
        $this->postJson('/api/v1/push/test')->assertStatus(429);
    }

    public function test_logout_requests_do_not_consume_the_five_login_attempts(): void
    {
        for ($i = 0; $i < 6; $i++) {
            $this->postJson('/api/v1/push/test-logout')->assertNotFound();
        }
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/push/test-session')->assertNotFound();
        }
        $this->postJson('/api/v1/push/test-session')->assertStatus(429);
    }

    public function test_registration_keeps_its_own_twenty_attempt_quota(): void
    {
        $this->sessionUser();
        for ($i = 0; $i < 10; $i++) {
            $this->getJson('/api/v1/push/config')->assertOk();
        }
        for ($i = 0; $i < 20; $i++) {
            $this->postJson('/api/v1/push/subscriptions', [])->assertStatus(422);
        }
        $this->postJson('/api/v1/push/subscriptions', [])->assertStatus(429);
    }
}
