<?php

use App\Models\PushSubscription;

return [
    'enabled' => env('PUSH_ENABLED', false),
    'test_auth' => env('PUSH_TEST_AUTH_ENABLED', false),
    'vapid' => ['subject' => env('VAPID_SUBJECT'), 'public_key' => env('VAPID_PUBLIC_KEY'), 'private_key' => env('VAPID_PRIVATE_KEY'), 'pem_file' => null],
    'model' => PushSubscription::class,
    'table_name' => 'push_subscriptions',
    'database_connection' => env('DB_CONNECTION', 'mysql'),
];
