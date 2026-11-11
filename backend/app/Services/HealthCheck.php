<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class HealthCheck
{
    public function inspect(): array
    {
        try {
            DB::connection()->select('SELECT 1 AS healthy');

            return ['status' => 'ok', 'checks' => ['application' => 'ok', 'database' => 'ok']];
        } catch (Throwable $exception) {
            Log::warning('Database health check failed.', ['exception_type' => $exception::class, 'error_code' => (string) $exception->getCode()]);

            return ['status' => 'error', 'checks' => ['application' => 'ok', 'database' => 'error']];
        }
    }
}
