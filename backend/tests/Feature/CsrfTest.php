<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class CsrfTest extends TestCase
{
    public function test_sanctum_issues_host_only_cookies(): void
    {
        config(['session.driver' => 'file', 'session.domain' => null]);
        $response = $this->withHeader('Origin', 'http://localhost:5176')->get('/sanctum/csrf-cookie');
        $response->assertNoContent();
        $cookies = $response->headers->getCookies();
        $names = array_map(fn ($cookie) => $cookie->getName(), $cookies);
        $this->assertContains('XSRF-TOKEN', $names);
        $this->assertContains(config('session.cookie'), $names);
        foreach ($cookies as $cookie) {
            $this->assertNull($cookie->getDomain());
        }
    }

    public function test_post_requires_csrf_and_accepts_matching_session_token(): void
    {
        // Only a process-local test route. CSRF normally bypasses PHPUnit, so enable middleware behavior.
        Route::middleware('web')->post('/_foundation-test/csrf', fn () => response()->noContent());
        $this->app['env'] = 'local';
        $this->withSession(['_token' => 'controlled-test-token'])->post('/_foundation-test/csrf')->assertStatus(419);
        $this->withSession(['_token' => 'controlled-test-token'])->post('/_foundation-test/csrf', ['_token' => 'controlled-test-token'])->assertNoContent();
    }
}
