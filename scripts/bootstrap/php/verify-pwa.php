<?php

declare(strict_types=1);

try {
    $config = json_decode(stream_get_contents(STDIN), true, 32, JSON_THROW_ON_ERROR);
    $public = $config['environment'] === 'production';
    $base = $public ? $config['url'] : $config['target'];
    $request = static function (string $path, int $expected = 200) use ($config, $base): array {
        $handle = curl_init(rtrim($base, '/').$path);
        curl_setopt_array($handle, [CURLOPT_RETURNTRANSFER => true, CURLOPT_HEADER => true, CURLOPT_HTTPHEADER => ['Host: '.parse_url($config['url'], PHP_URL_HOST)], CURLOPT_CONNECTTIMEOUT => 10, CURLOPT_TIMEOUT => 20, CURLOPT_FOLLOWLOCATION => false, CURLOPT_SSL_VERIFYPEER => true, CURLOPT_SSL_VERIFYHOST => 2]);
        $response = curl_exec($handle);
        $code = (int) curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
        $size = (int) curl_getinfo($handle, CURLINFO_HEADER_SIZE);
        curl_close($handle);
        if ($response === false || $code !== $expected) {
            throw new RuntimeException('http');
        }

        return [substr($response, 0, $size), substr($response, $size)];
    };
    [$headers, $html] = $request('/');
    if (! str_contains($html, 'name="app-build" content="'.$config['buildId'].'"') || ! str_contains($html, 'manifest.webmanifest')) {
        throw new RuntimeException('html');
    }
    foreach (['/', '/manifest.webmanifest', '/sw.js', '/offline.html'] as $path) {
        [$headers, $body] = $request($path);
        if (! preg_match('/Cache-Control:[^\r\n]*(no-cache|no-store|max-age=0)/i', $headers) || preg_match('/Cache-Control:[^\r\n]*immutable/i', $headers)) {
            throw new RuntimeException('cache');
        }
        if ($path === '/manifest.webmanifest') {
            $manifest = json_decode($body, true, 32, JSON_THROW_ON_ERROR);
            if (($manifest['name'] ?? null) !== $config['name'] || ($manifest['start_url'] ?? null) !== '/' || ($manifest['scope'] ?? null) !== '/' || ! preg_match('/Content-Type:[^\r\n]*(json|manifest)/i', $headers)) {
                throw new RuntimeException('manifest');
            }
        }
        if ($path === '/offline.html' && ! str_contains($body, '<title>Sem conexão</title>')) {
            throw new RuntimeException('offline');
        }
        if ($path === '/sw.js' && (! str_contains($body, 'SKIP_WAITING') || ! preg_match('/Content-Type:[^\r\n]*javascript/i', $headers))) {
            throw new RuntimeException('worker');
        }
    }
    if (! is_string($config['asset']) || ! preg_match('/^assets\/[\w.-]+\.js$/', $config['asset'])) {
        throw new RuntimeException('asset-path');
    }
    [$headers, $assetBody] = $request('/'.$config['asset']);
    if (! str_contains($assetBody, $config['buildId'])) {
        throw new RuntimeException('html');
    }
    if (! preg_match('/Cache-Control:[^\r\n]*immutable/i', $headers)) {
        throw new RuntimeException('asset-cache');
    }
    [$headers, $apiBody] = $request('/api/v1/__foundation_missing__', 404);
    if (! preg_match('/Content-Type:[^\r\n]*application\/json/i', $headers) || str_contains($apiBody, 'app-build')) {
        throw new RuntimeException('api-route');
    }
    $request('/assets/__foundation_missing__.js', 404);
    echo json_encode(['status' => 'ok', 'checks' => ['html-build' => 'ok', 'manifest-worker-offline' => 'ok', 'cache-headers' => 'ok']], JSON_THROW_ON_ERROR);
} catch (Throwable $error) {
    // No response bodies, cookies, paths or private exceptions are exposed.
    echo json_encode(['status' => 'error', 'reason' => in_array($error->getMessage(), ['http', 'html', 'cache', 'manifest', 'worker', 'offline', 'asset-path', 'asset-cache', 'api-route'], true) ? $error->getMessage() : 'unexpected']);
    exit(1);
}
