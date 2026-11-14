<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class FoundationVerifyGuardTest extends TestCase
{
    public function test_testing_and_production_cannot_capture_main_database_baselines(): void
    {
        DB::shouldReceive('transaction')->never();
        $this->artisan('foundation:verify', ['--save' => true])->assertFailed();
        $this->app['env'] = 'production';
        $this->artisan('foundation:verify', ['--save' => true])->assertFailed();
    }
}
