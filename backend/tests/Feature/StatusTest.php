<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Mockery;
use RuntimeException;
use Tests\TestCase;

class StatusTest extends TestCase
{
    private function healthy(int $times = 1): void
    {
        $connection = Mockery::mock();
        $connection->shouldReceive('select')->with('SELECT 1 AS healthy')->times($times)->andReturn([(object) ['healthy' => 1]]);
        DB::shouldReceive('connection')->times($times)->andReturn($connection);
    }

    public function test_json_and_html_report_real_check_result_without_cache(): void
    {
        $this->healthy(2);
        $this->getJson('/api/v1/status')->assertOk()->assertExactJson(['status' => 'ok', 'checks' => ['application' => 'ok', 'database' => 'ok']])->assertHeader('Cache-Control', 'no-store, private');
        $this->get('/status')->assertOk()->assertSee('Backend OK')->assertSee('Banco OK')->assertHeader('Cache-Control', 'no-store, private');
    }

    public function test_database_failure_is_503_even_with_stateful_origin_and_database_session(): void
    {
        config(['session.driver' => 'database', 'sanctum.stateful' => ['localhost:5176']]);
        DB::shouldReceive('connection')->twice()->andReturnUsing(fn () => throw new RuntimeException('PRIVATE-EXCEPTION-DO-NOT-EXPOSE'));
        $this->withHeader('Origin', 'http://localhost:5176')->getJson('/api/v1/status')->assertStatus(503)->assertExactJson(['status' => 'error', 'checks' => ['application' => 'ok', 'database' => 'error']])->assertDontSee('PRIVATE-EXCEPTION');
        $this->get('/status')->assertStatus(503)->assertSee('Banco indisponível')->assertDontSee('Banco OK')->assertDontSee('PRIVATE-EXCEPTION');
    }

    public function test_up_does_not_query_database(): void
    {
        DB::shouldReceive('connection')->never();
        $this->get('/up')->assertOk();
    }

    public function test_unknown_api_route_is_not_frontend_html(): void
    {
        $this->get('/api/v1/not-defined', ['Accept' => 'text/html'])->assertNotFound()->assertHeader('Content-Type', 'application/json');
    }
}
