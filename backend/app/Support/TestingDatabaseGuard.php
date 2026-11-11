<?php

namespace App\Support;

use Dotenv\Dotenv;
use Illuminate\Contracts\Foundation\Application;
use RuntimeException;

class TestingDatabaseGuard
{
    public static function check(Application $app): void
    {
        $file = $app->basePath('../.env.foundation');
        if (! is_file($file)) {
            throw new RuntimeException('Testes exigem arquivo central local para conferir isolamento.');
        }
        $central = Dotenv::parse(file_get_contents($file));
        $main = $central['DB_DATABASE'] ?? str_replace('-', '_', $central['PROJECT_SLUG'] ?? '');
        $test = ($central['DB_TEST_DATABASE'] ?? '') ?: $main.'_test';
        $config = $app['config'];
        $mysql = $config->get('database.connections.mysql');
        if (($central['APP_ENV'] ?? null) !== 'local' || ! $app->environment('testing') || $config->get('database.default') !== 'mysql' || ! $main || ! $test || strcasecmp($main, $test) === 0 || ($mysql['database'] ?? null) !== $test || ($mysql['host'] ?? null) !== ($central['DB_HOST'] ?? null) || (int) ($mysql['port'] ?? 0) !== (int) ($central['DB_PORT'] ?? 3306) || ! empty($mysql['url']) || ! empty($mysql['unix_socket']) || isset($mysql['read']) || isset($mysql['write'])) {
            throw new RuntimeException('Testes bloqueados: confira APP_ENV=testing, conexão MySQL efetiva e banco exclusivo correspondentes ao central local.');
        }
    }
}
