<?php

namespace App\Models;

class PushSubscription extends \NotificationChannels\WebPush\PushSubscription
{
    protected $fillable = ['endpoint', 'public_key', 'auth_token', 'content_encoding', 'endpoint_hash', 'label', 'subscribable_id', 'subscribable_type'];

    protected $hidden = ['endpoint', 'public_key', 'auth_token', 'subscribable_id', 'subscribable_type'];

    protected function casts(): array
    {
        return ['endpoint' => 'encrypted', 'public_key' => 'encrypted', 'auth_token' => 'encrypted', 'last_success_at' => 'datetime'];
    }
}
