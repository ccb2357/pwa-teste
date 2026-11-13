<?php

namespace App\Services\Push;

use RuntimeException;
use Symfony\Component\HttpFoundation\IpUtils;

class EndpointPolicy
{
    public function host(#[\SensitiveParameter] string $endpoint): string
    {
        $parts = parse_url($endpoint);
        $host = strtolower($parts['host'] ?? '');
        $allowed = in_array($host, ['fcm.googleapis.com', 'updates.push.services.mozilla.com', 'web.push.apple.com'], true) || str_ends_with($host, '.notify.windows.com');
        if (strlen($endpoint) > 2048 || ! $allowed || ($parts['scheme'] ?? '') !== 'https' || isset($parts['user'], $parts['pass']) || isset($parts['user']) || isset($parts['fragment']) || (($parts['port'] ?? 443) !== 443) || preg_match('/[\x00-\x20\\\\]/', $endpoint)) {
            throw new RuntimeException('push-endpoint-invalid');
        }

        return $host;
    }

    public function addresses(string $host): array
    {
        $records = dns_get_record($host, DNS_A | DNS_AAAA);

        return array_values(array_filter(array_map(fn ($record) => $record['ip'] ?? $record['ipv6'] ?? null, $records ?: [])));
    }

    public function pin(#[\SensitiveParameter] string $endpoint): array
    {
        $host = $this->host($endpoint);
        $ips = $this->addresses($host);
        if (! $ips) {
            throw new RuntimeException('push-dns-unavailable');
        }
        foreach ($ips as $ip) {
            if (IpUtils::checkIp($ip, ['100.64.0.0/10', '198.18.0.0/15', '192.0.0.0/24', '192.0.2.0/24', '198.51.100.0/24', '203.0.113.0/24']) || ! filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) || str_starts_with(strtolower($ip), '::ffff:') || (str_contains($ip, ':') && (! preg_match('/^[23][0-9a-f]{3}:/i', $ip) || preg_match('/^(2001:db8:|2001:0:|2002:)/i', $ip)))) {
                throw new RuntimeException('push-dns-not-public');
            }
        }
        $ip = $ips[0];

        return [$host.':443:'.(str_contains($ip, ':') ? '['.$ip.']' : $ip)];
    }
}
