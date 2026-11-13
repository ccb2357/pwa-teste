<?php

use App\Http\Controllers\PushController;
use App\Http\Controllers\PushTestSessionController;
use App\Http\Middleware\PushNoStore;
use App\Http\Middleware\PushSession;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/status');

// Always use the web CSRF/session stack, even when Origin is absent.
Route::prefix('api/v1/push')->middleware([PushNoStore::class])->group(function (): void {
    Route::get('test-session', [PushTestSessionController::class, 'show']);
    Route::post('test-session', [PushTestSessionController::class, 'store'])->middleware('throttle:5,1');
    Route::post('test-logout', [PushTestSessionController::class, 'destroy'])->middleware('throttle:10,1');
    Route::middleware(['auth:sanctum', PushSession::class, 'throttle:60,1'])->group(function (): void {
        $controller = PushController::class;
        Route::get('config', [$controller, 'config']);
        Route::get('subscriptions', [$controller, 'index']);
        Route::post('subscriptions', [$controller, 'store'])->middleware('throttle:20,1');
        Route::delete('subscriptions/{id}', [$controller, 'destroy'])->whereNumber('id');
        Route::get('preferences', [$controller, 'preferences']);
        Route::put('preferences', [$controller, 'updatePreferences']);
        Route::post('test', [$controller, 'test'])->middleware('throttle:3,1');
        Route::get('deliveries', [$controller, 'deliveries']);
    });
});
