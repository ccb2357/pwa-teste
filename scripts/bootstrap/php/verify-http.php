<?php

declare(strict_types=1);

try {
    $config = json_decode(stream_get_contents(STDIN), true, 32, JSON_THROW_ON_ERROR);
    $host = parse_url($config['url'], PHP_URL_HOST);
    $checks = [];
    $request = function (string $path, ?string $origin = null, bool $public = false) use ($config, $host): array {
        $handle = curl_init(($public ? $config['url'] : rtrim($config['target'], '/')).$path);
        $headers = ['Host: '.$host, 'Accept: '.($path === '/api/v1/status' ? 'application/json' : 'text/html')];
        if ($origin !== null) {
            $headers[] = 'Origin: '.$origin;
        }
        curl_setopt_array($handle, [CURLOPT_RETURNTRANSFER => true, CURLOPT_HEADER => true, CURLOPT_HTTPHEADER => $headers, CURLOPT_CONNECTTIMEOUT => 10, CURLOPT_TIMEOUT => 20, CURLOPT_FOLLOWLOCATION => false, CURLOPT_SSL_VERIFYPEER => true, CURLOPT_SSL_VERIFYHOST => 2]);
        $response = curl_exec($handle);
        if ($response === false) {
            throw new RuntimeException('http-connection');
        }
        $code = curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
        $size = curl_getinfo($handle, CURLINFO_HEADER_SIZE);
        curl_close($handle);

        return [$code, substr($response, 0, $size), substr($response, $size)];
    };
    // In production validate the real HTTPS origin/certificate, not an internal HTTP redirect.
    $public = $config['environment'] === 'production';
    foreach (['/up', '/status', '/api/v1/status'] as $path) {
        [$code, $headers, $body] = $request($path, null, $public);
        if ($code !== 200) {
            throw new RuntimeException('http-status');
        }
        if ($path !== '/up' && ! preg_match('/Cache-Control:[^\r\n]*no-store/i', $headers)) {
            throw new RuntimeException('no-store');
        }
        if ($path === '/api/v1/status') {
            $json = json_decode($body, true, 16, JSON_THROW_ON_ERROR);
            if ($json !== ['status' => 'ok', 'checks' => ['application' => 'ok', 'database' => 'ok']] || ! preg_match('/Content-Type:\s*application\/json/i', $headers)) {
                throw new RuntimeException('status-contract');
            }
        }
        if ($path === '/status' && (! str_contains($body, 'Backend OK') || ! str_contains($body, 'Banco OK'))) {
            throw new RuntimeException('html-contract');
        }
        $checks[$path] = 'ok';
    }
    foreach ($config['origins'] as $origin) {
        $origin = ($public ? 'https://' : 'http://').$origin;
        [$code, $headers, $body] = $request('/api/v1/status', $origin, $public);
        if ($code !== 200 || (json_decode($body, true)['status'] ?? '') !== 'ok') {
            throw new RuntimeException('origin-status');
        }
        [$code, $headers] = $request('/sanctum/csrf-cookie', $origin, $public);
        if ($code !== 204 || ! str_contains($headers, 'XSRF-TOKEN=') || preg_match('/Set-Cookie:[^\r\n]*;\s*domain=/i', $headers)) {
            throw new RuntimeException('csrf-cookie');
        }
    }
    $checks['origins-csrf-host-only'] = 'ok';
    echo json_encode(['status' => 'ok', 'checks' => $checks], JSON_THROW_ON_ERROR);
} catch (Throwable $exception) {
    fwrite(STDERR, "Verificação HTTP/CSRF falhou. Confira Nginx, banco, origens, cookies e HTTPS conforme o ambiente.\n");
    exit(1);
}
