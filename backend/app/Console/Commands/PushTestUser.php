<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PushTestUser extends Command
{
    protected $signature = 'push:test-user {email}';

    protected $description = 'Cria acesso de teste local de uso único (10 minutos).';

    public function handle(): int
    {
        if (! app()->environment('local') || ! config('webpush.test_auth') || ! filter_var($this->argument('email'), FILTER_VALIDATE_EMAIL)) {
            $this->error('Exige ambiente local, PUSH_TEST_AUTH_ENABLED=true e e-mail válido.');

            return self::FAILURE;
        }
        $user = User::where('email', $this->argument('email'))->first();
        if ($user && ! $user->is_push_test) {
            $this->error('A conta já existe e não é uma conta de teste push.');

            return self::FAILURE;
        }
        if (! $user) {
            $user = new User(['name' => 'Teste Push', 'email' => $this->argument('email'), 'password' => Str::random(64)]);
            $user->is_push_test = true;
            $user->save();
        }
        $code = bin2hex(random_bytes(32));
        DB::table('push_test_tokens')->where('expires_at', '<', now())->delete();
        DB::table('push_test_tokens')->insert(['user_id' => $user->id, 'token_hash' => hash('sha256', $code), 'expires_at' => now()->addMinutes(10)]);
        $this->info('Cole este código no campo de acesso de teste da Hello (uso único, 10 minutos):');
        $this->line($code);

        return self::SUCCESS;
    }
}
