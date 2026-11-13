<?php

namespace App\Services\Push;

use RuntimeException;

class VapidKeys
{
    public static function decode(#[\SensitiveParameter] string $value, int $length): string
    {
        if (! preg_match('/^[A-Za-z0-9_-]+$/', $value)) {
            throw new RuntimeException('push-key-invalid');
        }
        $bytes = base64_decode(strtr($value, '-_', '+/'), true);
        if ($bytes === false || strlen($bytes) !== $length) {
            throw new RuntimeException('push-key-invalid');
        }

        return $bytes;
    }

    public static function validate(#[\SensitiveParameter] array $keys): void
    {
        $subject = $keys['subject'] ?? '';
        $validSubject = str_starts_with($subject, 'mailto:') ? filter_var(substr($subject, 7), FILTER_VALIDATE_EMAIL) : filter_var($subject, FILTER_VALIDATE_URL) && str_starts_with($subject, 'https://') && ! isset(parse_url($subject)['user']);
        if (! $validSubject) {
            throw new RuntimeException('push-subject-invalid');
        }
        $public = self::decode($keys['public_key'] ?? '', 65);
        $private = self::decode($keys['private_key'] ?? '', 32);
        $der = hex2bin('30310201010420').$private.hex2bin('a00a06082a8648ce3d030107');
        $key = @openssl_pkey_get_private("-----BEGIN EC PRIVATE KEY-----\n".chunk_split(base64_encode($der), 64, "\n")."-----END EC PRIVATE KEY-----\n");
        $details = $key ? openssl_pkey_get_details($key) : false;
        $derived = $details ? "\x04".str_pad($details['ec']['x'], 32, "\0", STR_PAD_LEFT).str_pad($details['ec']['y'], 32, "\0", STR_PAD_LEFT) : '';
        if (! hash_equals($public, $derived)) {
            throw new RuntimeException('push-key-pair-invalid');
        }
    }
}
