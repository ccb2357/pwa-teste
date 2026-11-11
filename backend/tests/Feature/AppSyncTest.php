<?php

namespace Tests\Feature;

use App\Console\Commands\AppSync;
use Illuminate\Contracts\Console\Kernel;
use Mockery;
use Tests\TestCase;

class AppSyncTest extends TestCase
{
    private function register(): AppSync
    {
        $command = Mockery::mock(AppSync::class)->makePartial();
        $command->__construct();
        $this->app->make(Kernel::class)->registerCommand($command);

        return $command;
    }

    public function test_cache_failure_prevents_migrations_and_propagates_exit(): void
    {
        $command = $this->register();
        $command->shouldReceive('call')->with('optimize:clear')->once()->andReturn(7);
        $command->shouldReceive('call')->with('migrate', Mockery::any())->never();
        $this->artisan('app:sync')->assertExitCode(7);
    }

    public function test_migration_failure_is_propagated(): void
    {
        $command = $this->register();
        $command->shouldReceive('call')->with('optimize:clear')->once()->ordered()->andReturn(0);
        $command->shouldReceive('call')->with('migrate', ['--force' => false])->once()->ordered()->andReturn(9);
        $this->artisan('app:sync')->assertExitCode(9);
    }

    public function test_production_without_force_does_not_change_caches_or_database(): void
    {
        $command = $this->register();
        $command->shouldReceive('call')->never();
        $this->app['env'] = 'production';
        $this->artisan('app:sync')->assertFailed();
    }

    public function test_force_is_passed_only_to_migrations(): void
    {
        $command = $this->register();
        $command->shouldReceive('call')->with('optimize:clear')->once()->ordered()->andReturn(0);
        $command->shouldReceive('call')->with('migrate', ['--force' => true])->once()->ordered()->andReturn(0);
        $this->app['env'] = 'production';
        $this->artisan('app:sync', ['--force' => true])->assertSuccessful();
    }
}
