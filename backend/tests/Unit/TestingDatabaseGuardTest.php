<?php

namespace Tests\Unit;

use App\Support\TestingDatabaseGuard;
use RuntimeException;
use Tests\TestCase;

class TestingDatabaseGuardTest extends TestCase
{
    public function test_principal_database_is_blocked(): void
    {
        config(['database.connections.mysql.database' => config('foundation.main_database')]);
        $this->expectException(RuntimeException::class);
        TestingDatabaseGuard::check($this->app);
    }

    public function test_non_testing_environment_is_blocked(): void
    {
        $this->app['env'] = 'production';
        $this->expectException(RuntimeException::class);
        TestingDatabaseGuard::check($this->app);
    }
}
