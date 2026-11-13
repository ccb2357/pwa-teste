<?php

declare(strict_types=1);
use App\Models\PushDelivery;
use App\Models\PushSubscription;
use App\Models\User;
use App\Notifications\FoundationPushNotification;
use App\Services\Push\EndpointPolicy;
use App\Services\Push\SafeWebPushChannel;
use App\Services\Push\VapidKeys;
use GuzzleHttp\Client;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use Illuminate\Contracts\Console\Kernel;
use Minishlink\WebPush\ContentEncoding;
use Minishlink\WebPush\MessageSentReport;
use Minishlink\WebPush\Subscription;
use NotificationChannels\WebPush\ReportHandlerInterface;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessageInterface;

// CLI only. Reads configuration/models and uses an in-memory HTTP mock: no push is sent.
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
ini_set('display_errors', '0');
$stage = 'inicializacao';
try {
    $root = dirname(__DIR__, 3);
    require $root.'/backend/vendor/autoload.php';
    $app = require $root.'/backend/bootstrap/app.php';
    $app->make(Kernel::class)->bootstrap();
    echo 'PHP: '.PHP_VERSION.PHP_EOL;
    echo 'PUSH_ENABLED: '.(config('webpush.enabled') ? 'SIM' : 'NAO').PHP_EOL;
    echo 'FILA_DATABASE: '.(config('queue.default') === 'database' ? 'SIM' : 'NAO').PHP_EOL;
    $channel = app(SafeWebPushChannel::class);
    $reflection = new ReflectionClass($channel);
    $corrected = $reflection->hasMethod('engine') && str_contains(file_get_contents($reflection->getFileName()), 'new NullLogger');
    echo 'CORRECAO_NO_CANAL: '.($corrected ? 'SIM' : 'NAO').PHP_EOL;
    $stage = 'VAPID';
    $keys = config('webpush.vapid');
    VapidKeys::validate($keys);
    $central = Dotenv\Dotenv::parse(file_get_contents($root.'/.env.foundation'));
    if (! hash_equals($central['VAPID_PUBLIC_KEY'] ?? '', $keys['public_key']) || ! hash_equals($central['VAPID_PRIVATE_KEY'] ?? '', $keys['private_key'])) {
        throw new RuntimeException('push-config-central-divergent');
    }
    echo 'VAPID: OK'.PHP_EOL;
    $stage = 'banco-e-inscricao';
    $delivery = PushDelivery::latest()->first();
    if ($delivery) {
        $status = in_array($delivery->status, ['queued', 'accepted', 'failed', 'cancelled'], true) ? $delivery->status : 'outro';
        $http = $delivery->provider_status;
        echo 'ULTIMO_ENVIO: '.$status.'; tentativas='.(int) $delivery->attempts.'; HTTP='.(is_numeric($http) ? (int) $http : 'ausente').PHP_EOL;
    }
    $subscription = $delivery ? PushSubscription::find($delivery->subscription_id) : PushSubscription::latest('id')->first();
    if (! $subscription) {
        throw new RuntimeException('push-no-subscription');
    }
    $stage = 'leitura-das-chaves-do-dispositivo';
    $endpoint = $subscription->endpoint;
    $deviceKey = $subscription->public_key;
    $auth = $subscription->auth_token;
    $encoding = $subscription->content_encoding ?? ContentEncoding::aes128gcm;
    echo 'INSCRICAO_E_CHAVES: OK'.PHP_EOL;
    $stage = 'DNS-e-destino';
    $pin = app(EndpointPolicy::class)->pin($endpoint);
    echo 'DNS_E_DESTINO: OK'.PHP_EOL;
    $stage = 'payload-e-destinatario';
    if ($delivery) {
        $user = User::findOrFail($delivery->user_id);
        echo 'PREFERENCIA_DA_CONTA: '.($user->push_enabled ? 'SIM' : 'NAO').PHP_EOL;
        $notification = new FoundationPushNotification($delivery);
        $routes = $user->routeNotificationFor('WebPush', $notification);
        echo 'DESTINATARIO_PROPRIO: '.($routes->contains('id', $subscription->id) ? 'SIM' : 'NAO').PHP_EOL;
        $payload = json_encode($notification->toWebPush($user)->toArray(), JSON_THROW_ON_ERROR);
    } else {
        $payload = '{"title":"Diagnostico simulado","data":{"url":"/"}}';
    }
    echo 'PAYLOAD: OK'.PHP_EOL;
    $stage = 'inicializacao-do-SDK';
    if (! $corrected) {
        throw new RuntimeException('push-correction-not-installed');
    }
    $engine = $reflection->getMethod('engine')->invoke($channel, $keys, $pin);
    echo 'SDK: OK'.PHP_EOL;
    $stage = 'criptografia-com-HTTP-simulado';
    // Replace the PSR-18 client BEFORE preparing/flushing any notification.
    // MockHandler never falls through to the network, even if its response queue is empty.
    $mock = new Client(['handler' => HandlerStack::create(new MockHandler([new Response(201)]))]);
    $property = new ReflectionProperty($engine, 'client');
    $property->setValue($engine, $mock);
    if ($property->getValue($engine) !== $mock) {
        throw new RuntimeException('push-mock-not-installed');
    }
    if ($delivery) {
        $handler = new class implements ReportHandlerInterface
        {
            public function handleReport(MessageSentReport $report, NotificationChannels\WebPush\PushSubscription $subscription, WebPushMessageInterface $message): void
            {
                // Intentionally no persistence: this is an HTTP mock, never a real delivery.
            }
        };
        $reports = (new WebPushChannel($engine, $handler))->send($user, $notification);
    } else {
        $engine->queueNotification(new Subscription($endpoint, $deviceKey, $auth, $encoding), $payload);
        $reports = iterator_to_array($engine->flush());
    }
    if (count($reports) !== 1 || ! $reports[0]->isSuccess()) {
        throw new RuntimeException('push-mock-failed');
    }
    echo 'CRIPTOGRAFIA_E_HTTP_SIMULADO: OK'.PHP_EOL;
    echo 'DIAGNOSTICO: concluido; nenhum envio real ou alteracao no banco.'.PHP_EOL;
} catch (Throwable $error) {
    echo 'FALHOU_NA_ETAPA: '.$stage.PHP_EOL;
    $allowed = ['push-key-invalid', 'push-key-pair-invalid', 'push-subject-invalid', 'push-config-central-divergent', 'push-endpoint-invalid', 'push-dns-not-public', 'push-dns-unavailable', 'push-no-subscription', 'push-correction-not-installed', 'push-mock-not-installed', 'push-mock-failed'];
    if (in_array($error->getMessage(), $allowed, true)) {
        echo 'CODIGO: '.$error->getMessage().PHP_EOL;
    }
    // Do not print arbitrary messages, paths, traces, keys, endpoints or payloads.
    echo 'TIPO: '.get_class($error).PHP_EOL;
    echo 'ORIGEM: '.basename($error->getFile()).':'.$error->getLine().PHP_EOL;
    exit(1);
}
