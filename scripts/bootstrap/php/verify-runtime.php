<?php

declare(strict_types=1);
use Illuminate\Contracts\Console\Kernel;

try {
    $expected = json_decode(stream_get_contents(STDIN), true, 32, JSON_THROW_ON_ERROR);
    $backend = dirname(__DIR__, 3).'/backend';
    require $backend.'/vendor/autoload.php';
    $app = require $backend.'/bootstrap/app.php';
    $app->make(Kernel::class)->bootstrap();
    $config = $app['config'];
    $mysql = $config->get('database.connections.mysql');
    $values = [
        'environment' => $app->environment(), 'name' => $config->get('app.name'), 'url' => $config->get('app.url'), 'timezone' => $config->get('app.timezone'),
        'host' => $mysql['host'], 'port' => (int) $mysql['port'], 'database' => $mysql['database'], 'username' => $mysql['username'], 'password' => (string) $mysql['password'],
        'push' => (bool) $config->get('webpush.enabled'), 'pushTestAuth' => (bool) $config->get('webpush.test_auth'), 'vapidSubject' => (string) $config->get('webpush.vapid.subject'), 'vapidPublic' => (string) $config->get('webpush.vapid.public_key'), 'vapidPrivate' => (string) $config->get('webpush.vapid.private_key'), 'queue' => $config->get('queue.default'),
        'cookie' => $config->get('session.cookie'), 'stateful' => implode(',', $config->get('sanctum.stateful')),
    ];
    if ($values !== $expected || $config->get('database.default') !== 'mysql' || ! empty($mysql['url']) || ! empty($mysql['unix_socket']) || isset($mysql['read']) || isset($mysql['write']) || ($expected['environment'] === 'production' && $config->get('app.debug'))) {
        throw new RuntimeException('effective-config');
    }
    echo "Configuração efetiva confere com o arquivo central.\n";
} catch (Throwable $exception) {
    fwrite(STDERR, "Configuração efetiva diverge do central. Confira variáveis herdadas, cache e conexão Laravel antes de migrations.\n");
    exit(1);
}
