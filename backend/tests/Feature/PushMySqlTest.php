<?php

namespace Tests\Feature;

use App\Jobs\SendPushDelivery;
use App\Models\PushDelivery;
use App\Models\PushSubscription;
use App\Models\User;
use App\Services\PushNotificationService;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Minishlink\WebPush\VAPID;
use PHPUnit\Framework\Attributes\Group;
use Tests\TestCase;

#[Group('mysql')]
class PushMySqlTest extends TestCase
{
    use RefreshDatabase;

    private function account(): User
    {
        $user = User::factory()->create();
        $user->forceFill(['is_push_test' => true, 'push_enabled' => true])->save();

        return $user;
    }

    private function inscription(string $suffix = 'one'): array
    {
        $key = VAPID::createVapidKeys();

        return ['endpoint' => 'https://fcm.googleapis.com/test-'.$suffix, 'keys' => ['p256dh' => $key['publicKey'], 'auth' => rtrim(strtr(base64_encode(random_bytes(16)), '+/', '-_'), '=')]];
    }

    public function test_registration_is_idempotent_encrypted_and_cannot_be_stolen(): void
    {
        config(['webpush.enabled' => true]);
        $owner = $this->account();
        $other = $this->account();
        $data = $this->inscription();
        $id = $this->actingAs($owner, 'web')->postJson('/api/v1/push/subscriptions', $data)->assertCreated()->assertDontSee($data['endpoint'])->json('id');
        $this->postJson('/api/v1/push/subscriptions', $data)->assertOk()->assertJsonPath('id', $id);
        $this->assertNotSame($data['endpoint'], DB::table('push_subscriptions')->value('endpoint'));
        $this->assertSame($data['endpoint'], PushSubscription::findOrFail($id)->endpoint);
        $this->actingAs($other, 'web')->postJson('/api/v1/push/subscriptions', $data)->assertStatus(409);
        $this->deleteJson('/api/v1/push/subscriptions/'.$id)->assertNotFound();
        $this->getJson('/api/v1/push/subscriptions')->assertJsonCount(0, 'devices');
        $this->assertDatabaseCount('push_subscriptions', 1);
    }

    public function test_multiple_devices_queue_separately_and_pending_jobs_recheck_preference(): void
    {
        config(['webpush.enabled' => true]);
        Queue::fake();
        $user = $this->account();
        $this->actingAs($user, 'web');
        $this->postJson('/api/v1/push/subscriptions', $this->inscription('a'))->assertCreated();
        $this->postJson('/api/v1/push/subscriptions', $this->inscription('b'))->assertCreated();
        $result = app(PushNotificationService::class)->sendToUser($user, ['title' => 'Test', 'body' => 'Test', 'url' => '/']);
        $this->assertSame(2, $result['queued']);
        Queue::assertPushed(SendPushDelivery::class, 2);
        $this->putJson('/api/v1/push/preferences', ['enabled' => false])->assertOk();
        foreach (PushDelivery::all() as $delivery) {
            (new SendPushDelivery($delivery->id))->handle();
            $this->assertSame('cancelled', $delivery->fresh()->status);
        }
    }

    public function test_disabled_environment_allows_revocation_but_blocks_new_registration(): void
    {
        config(['webpush.enabled' => true]);
        $user = $this->account();
        $id = $this->actingAs($user, 'web')->postJson('/api/v1/push/subscriptions', $this->inscription())->assertCreated()->json('id');
        config(['webpush.enabled' => false]);
        $this->postJson('/api/v1/push/subscriptions', $this->inscription('next'))->assertStatus(503);
        $this->putJson('/api/v1/push/preferences', ['enabled' => false])->assertOk();
        $this->deleteJson('/api/v1/push/subscriptions/'.$id)->assertNoContent();
    }

    public function test_local_session_uses_single_use_expiring_token_and_logout_revokes_only_bound_device(): void
    {
        config(['webpush.test_auth' => true, 'webpush.enabled' => true]);
        $user = $this->account();
        $code = str_repeat('a', 64);
        DB::table('push_test_tokens')->insert(['user_id' => $user->id, 'token_hash' => hash('sha256', $code), 'expires_at' => now()->addMinutes(10)]);
        $this->withoutMiddleware(ValidateCsrfToken::class);
        $this->app['env'] = 'local';
        $this->postJson('/api/v1/push/test-session', ['code' => $code])->assertOk();
        $this->assertAuthenticatedAs($user, 'web');
        $this->assertDatabaseCount('push_test_tokens', 0);
        $this->postJson('/api/v1/push/subscriptions', $this->inscription('a'))->assertCreated();
        $this->postJson('/api/v1/push/subscriptions', $this->inscription('b'))->assertCreated();
        $this->postJson('/api/v1/push/test-logout')->assertNoContent();
        $this->assertGuest('web');
        $this->assertDatabaseCount('push_subscriptions', 1);
        $this->postJson('/api/v1/push/test-session', ['code' => $code])->assertUnauthorized();
    }

    public function test_expired_code_is_rejected_and_other_account_delivery_is_hidden(): void
    {
        config(['webpush.test_auth' => true]);
        $user = $this->account();
        $code = str_repeat('b', 64);
        DB::table('push_test_tokens')->insert(['user_id' => $user->id, 'token_hash' => hash('sha256', $code), 'expires_at' => now()->subMinute()]);
        $this->withoutMiddleware(ValidateCsrfToken::class);
        $this->app['env'] = 'local';
        $this->postJson('/api/v1/push/test-session', ['code' => $code])->assertUnauthorized();
        $this->actingAs($user, 'web')->getJson('/api/v1/push/deliveries')->assertJsonCount(0, 'deliveries');
    }
}
