<?php

namespace App\Providers;

use Illuminate\Auth\Events\Logout;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Event::listen(Logout::class, function ($event): void {
            if ($event->guard === 'web' && $event->user && request()->hasSession() && ($id = request()->session()->pull('push_subscription_id'))) {
                $event->user->pushSubscriptions()->whereKey($id)->delete();
            }
        });
    }
}
