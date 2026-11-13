<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class PushGuardsTest extends TestCase
{
    public function test_guest_cannot_read_push_config_or_devices(): void
    {
        foreach (['config', 'subscriptions', 'preferences', 'deliveries'] as $route) {
            $this->getJson('/api/v1/push/'.$route)->assertUnauthorized()->assertHeader('Cache-Control', 'no-store, private')->assertDontSee('trace');
        }
    }

    public function test_config_requires_real_web_session_and_never_exposes_private_key(): void
    {
        config(['webpush.enabled' => true, 'webpush.vapid.public_key' => 'public', 'webpush.vapid.private_key' => 'PRIVATE-NEVER-OUTPUT']);
        $user = new User(['name' => 'Test']);
        $user->id = 42;
        $this->actingAs($user, 'web')->getJson('/api/v1/push/config')->assertOk()->assertJsonPath('public_key', 'public')->assertJsonPath('user.id', 42)->assertDontSee('PRIVATE-NEVER-OUTPUT');
    }

    public function test_sanctum_identity_without_web_session_is_rejected(): void
    {
        $user = new User(['name' => 'Token-only']);
        $user->id = 43;
        Auth::guard('sanctum')->setUser($user);
        $this->getJson('/api/v1/push/config')->assertUnauthorized();
    }

    public function test_local_test_session_is_hidden_by_default_and_always_in_production(): void
    {
        $this->getJson('/api/v1/push/test-session')->assertNotFound();
        config(['webpush.test_auth' => true]);
        $this->app['env'] = 'production';
        $this->getJson('/api/v1/push/test-session')->assertNotFound();
        $this->app['env'] = 'local';
        $this->getJson('/api/v1/push/test-session')->assertOk()->assertJsonPath('test_auth', true);
    }

    public function test_mutations_require_csrf_even_without_origin_header(): void
    {
        $this->app['env'] = 'local';
        $this->withSession(['_token' => 'test-token'])->postJson('/api/v1/push/subscriptions', [])->assertStatus(419)->assertHeader('Cache-Control', 'no-store, private')->assertDontSee('trace');
    }
}
