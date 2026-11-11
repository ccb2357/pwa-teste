<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Throwable;

class AppSync extends Command
{
    protected $signature = 'app:sync {--force : Autoriza migrations em produção}';

    protected $description = 'Limpa caches e aplica somente migrations pendentes, sem recriar dados';

    public function handle(): int
    {
        if ($this->laravel->environment('production') && ! $this->option('force')) {
            $this->error('Produção exige --force explícito antes de limpar caches ou executar migrations.');

            return self::FAILURE;
        }
        try {
            $clear = $this->call('optimize:clear');
            if ($clear !== self::SUCCESS) {
                $this->error('Limpeza de caches falhou; migrations não executadas.');

                return $clear;
            }
            $migrate = $this->call('migrate', ['--force' => (bool) $this->option('force')]);
            if ($migrate !== self::SUCCESS) {
                $this->error('Migrations falharam; sincronização interrompida.');

                return $migrate;
            }
            $this->info('Caches limpos e migrations pendentes aplicadas.');

            return self::SUCCESS;
        } catch (Throwable $exception) {
            report($exception);
            $this->error('Sincronização interrompida. Consulte o log privado do Laravel.');

            return self::FAILURE;
        }
    }
}
