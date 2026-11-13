<?php

declare(strict_types=1);

use App\Services\Push\VapidKeys;
use Dotenv\Dotenv;
use Minishlink\WebPush\VAPID;

try {
    $root = dirname(__DIR__, 3);
    require $root.'/backend/vendor/autoload.php';
    $file = fopen($root.'/.env.foundation', 'r+');
    if (! $file || ! flock($file, LOCK_EX)) {
        throw new RuntimeException('lock');
    }
    $raw = stream_get_contents($file);
    $env = Dotenv::parse($raw);
    $public = $env['VAPID_PUBLIC_KEY'] ?? '';
    $private = $env['VAPID_PRIVATE_KEY'] ?? '';
    if (($public === '') !== ($private === '')) {
        throw new RuntimeException('partial');
    }
    $enabled = ($env['PUSH_ENABLED'] ?? 'false') === 'true';
    if ($enabled || $public !== '') {
        $generated = false;
        if ($public === '') {
            $keys = VAPID::createVapidKeys();
            $public = $keys['publicKey'];
            $private = $keys['privateKey'];
            $generated = true;
        }
        VapidKeys::validate(['subject' => $env['VAPID_SUBJECT'] ?? '', 'public_key' => $public, 'private_key' => $private]);
        if ($generated) {
            foreach (['VAPID_PUBLIC_KEY' => $public, 'VAPID_PRIVATE_KEY' => $private] as $name => $value) {
                $line = $name.'='.$value;
                $raw = preg_match('/^'.$name.'=/m', $raw) ? preg_replace('/^'.$name.'=.*$/m', $line, $raw) : rtrim($raw)."\n".$line."\n";
            }
            rewind($file);
            if (fwrite($file, $raw) !== strlen($raw) || ! ftruncate($file, strlen($raw))) {
                throw new RuntimeException('write');
            }
            fflush($file);
        }
    }
    flock($file, LOCK_UN);
    fclose($file);
    echo '{"status":"ok"}';
} catch (Throwable $error) {
    // No key, environment content or arbitrary exception is returned.
    echo '{"status":"error"}';
    exit(1);
}
