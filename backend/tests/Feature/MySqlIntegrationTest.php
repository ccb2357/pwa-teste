<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\Attributes\Group;
use Tests\TestCase;

#[Group('mysql')]
class MySqlIntegrationTest extends TestCase
{
    public function test_real_mysql_status_and_repeated_sync_on_exclusive_testing_database(): void
    {
        $this->assertSame(config('database.connections.mysql.database'), DB::selectOne('SELECT DATABASE() AS db')->db);
        $this->artisan('app:sync')->assertSuccessful();
        $this->artisan('app:sync')->assertSuccessful();
        $this->getJson('/api/v1/status')->assertOk()->assertJsonPath('checks.database', 'ok');
        $this->get('/status')->assertOk()->assertSee('Banco OK');
    }

    public function test_failure_in_only_this_process_connection_is_controlled(): void
    {
        DB::purge('mysql');
        config(['database.connections.mysql.host' => '127.0.0.1', 'database.connections.mysql.port' => 1, 'database.connections.mysql.options' => [\PDO::ATTR_TIMEOUT => 1]]);
        $this->withHeader('Origin', 'http://localhost:5176')->getJson('/api/v1/status')->assertStatus(503)->assertJsonPath('checks.database', 'error');
        $this->get('/status')->assertStatus(503)->assertSee('Banco indisponível');
    }
}
