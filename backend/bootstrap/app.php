<?php

use App\Http\Controllers\StatusController;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function (): void {
            // No web/api session middleware: database failure must remain a controlled 503.
            Route::get('/status', [StatusController::class, 'html'])->name('foundation.status.html');
            Route::get('/api/v1/status', [StatusController::class, 'json'])->name('foundation.status.json');
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->statefulApi();
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(fn (Request $request, Throwable $exception) => $request->is('api/*') || $request->expectsJson());
        $exceptions->dontReportWhen(fn (Throwable $error) => request()->is('api/v1/push/*'));
        $exceptions->render(function (Throwable $error, Request $request) {
            if (! $request->is('api/v1/push/*')) {
                return null;
            }
            $status = $error instanceof ValidationException ? 422 : ($error instanceof AuthenticationException ? 401 : ($error instanceof HttpExceptionInterface ? $error->getStatusCode() : 500));

            return response()->json(['message' => match ($status) {
                401 => 'Autenticação necessária.', 403 => 'Acesso negado.', 404 => 'Não encontrado.', 409 => 'Vínculo ou sessão já existente.', 419 => 'Sessão expirada.', 422 => 'Dados inválidos.', 429 => 'Aguarde antes de repetir.', 503 => 'Push desabilitado ou indisponível.', default => 'Não foi possível concluir a operação.'
            }], $status, ['Cache-Control' => 'no-store, private']);
        });
    })->create();
