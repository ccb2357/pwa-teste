<?php

namespace App\Providers;

use Illuminate\Auth\Events\Logout;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
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
        // Named limiters keep each operation's quota separate from other routes.
        foreach (['push-api' => 60, 'push-login' => 5, 'push-logout' => 10, 'push-subscriptions' => 20, 'push-test' => 3] as $name => $attempts) {
            RateLimiter::for($name, function (Request $request) use ($name, $attempts) {
                $id = $name === 'push-login' ? null : Auth::guard('web')->id();
                $key = $id !== null ? 'user:'.$id : 'ip:'.$request->ip();

                return Limit::perMinute($attempts)->by($key);
            });
        }

        Event::listen(Logout::class, function ($event): void {
            if ($event->guard === 'web' && $event->user && request()->hasSession() && ($id = request()->session()->pull('push_subscription_id'))) {
                $event->user->pushSubscriptions()->whereKey($id)->delete();
            }
        });
    }
}
