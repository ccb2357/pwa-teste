<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\Process\Exception\ProcessTimedOutException;
use Symfony\Component\Process\Process;

class PushWork extends Command
{
    protected $signature = 'push:work';

    protected $description = 'Consome somente a fila push por tempo limitado e com lock.';

    public function handle(): int
    {
        if ((int) config('queue.connections.database.retry_after') <= 75) {
            $this->error('A fila database exige retry_after superior a 75 segundos.');

            return self::FAILURE;
        }
        $lock = Cache::lock('foundation-push-worker', 180);
        if (! $lock->get()) {
            $this->info('Worker push já está ativo.');

            return self::SUCCESS;
        }
        try {
            $process = new Process([PHP_BINARY, 'artisan', 'queue:work', 'database', '--queue=push', '--stop-when-empty', '--max-time=50', '--timeout=45', '--tries=3', '--backoff=30', '--sleep=1'], base_path());
            $process->setTimeout(75);
            try {
                $code = $process->run();
                $this->line($code === 0 ? 'Worker encerrado. Consulte o estado dos envios.' : 'Worker falhou; confira banco e configuração local.');

                return $code;
            } catch (ProcessTimedOutException $error) {
                $this->error('Limite de execução do worker atingido; a fila será retomada na próxima execução.');

                return self::FAILURE;
            }
        } finally {
            $lock->release();
        }
    }
}
