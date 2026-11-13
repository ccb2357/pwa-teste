<?php

namespace App\Services\Push;

use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class PushPayload
{
    public static function path(string $value): bool
    {
        $decoded = rawurldecode($value);

        return strlen($value) <= 512 && str_starts_with($value, '/') && ! str_starts_with($decoded, '//')
            && ! preg_match('/[\\\\\x00-\x20]/', $decoded) && ! preg_match('#^/(api|sanctum|up|status|backend|storage|vendor)(/|\?|$)|(^|/)\.|\.php#i', $decoded);
    }

    public static function validate(array $payload): array
    {
        $data = Validator::make($payload, ['title' => 'required|string|max:100', 'body' => 'required|string|max:240', 'url' => 'required|string|max:512', 'image' => 'nullable|string|max:512'])->validate();
        if (! self::path($data['url']) || (isset($data['image']) && (! self::path($data['image']) || ! preg_match('/\.(png|jpe?g|webp)$/i', $data['image'])))) {
            throw ValidationException::withMessages(['url' => 'Destino ou imagem inválidos.']);
        }

        return $data;
    }
}
