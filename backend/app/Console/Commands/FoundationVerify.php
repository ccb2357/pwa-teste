<?php

namespace App\Console\Commands;

use Dotenv\Dotenv;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use RuntimeException;
use Throwable;

class FoundationVerify extends Command
{
    protected $signature = 'foundation:verify {--save : Salva uma referência privada após instalar} {--replace-baseline : Substitui uma referência conscientemente} {--compare= : Raiz interna absoluta de outro clone já validado}';

    protected $description = 'Confere preservação local de configuração, chaves, arquivos e dados, sem expor segredos.';

    public function handle(): int
    {
        try {
            $root = realpath(base_path('..'));
            $central = Dotenv::parse(file_get_contents($root.'/.env.foundation'));
            $main = ($central['DB_DATABASE'] ?? '') ?: str_replace('-', '_', $central['PROJECT_SLUG'] ?? '');
            $test = ($central['DB_TEST_DATABASE'] ?? '') ?: $main.'_test';
            $mysql = config('database.connections.mysql');
            if (! app()->environment('local') || ($central['APP_ENV'] ?? '') !== 'local' || config('database.default') !== 'mysql' || $mysql['database'] !== $main || strcasecmp($main, $test) === 0 || $mysql['host'] !== ($central['DB_HOST'] ?? '') || (int) $mysql['port'] !== (int) ($central['DB_PORT'] ?? 3306) || ! empty($mysql['url']) || ! empty($mysql['unix_socket']) || isset($mysql['read']) || isset($mysql['write']) || basename($root) !== ($central['PROJECT_SLUG'] ?? '')) {
                throw new RuntimeException('local-configuration');
            }
            if (DB::selectOne('SELECT DATABASE() AS db')->db !== $main) {
                throw new RuntimeException('effective-database');
            }
            $state = json_decode(file_get_contents($root.'/.foundation-state.json'), true, 32, JSON_THROW_ON_ERROR);
            if (($state['phase'] ?? '') !== 'pwa-ready' || ($state['lastExitCode'] ?? null) !== 0) {
                throw new RuntimeException('bootstrap-not-ready');
            }
            $file = $root.'/.foundation-acceptance.json';
            if ($this->option('compare')) {
                if ($this->option('save') || $this->option('replace-baseline')) {
                    throw new RuntimeException('conflicting-options');
                }
                $other = realpath($this->option('compare'));
                if (! $other || ! str_starts_with($this->option('compare'), '/')) {
                    throw new RuntimeException('other-path');
                }
                $a = $this->readBaseline($file);
                $b = $this->readBaseline($other.'/.foundation-acceptance.json');
                if ($a['identity']['root'] !== $root || $b['identity']['root'] !== $other) {
                    throw new RuntimeException('baseline-moved');
                }
                $collisions = self::collisions($a['identity'], $b['identity']);
                if ($collisions) {
                    $this->error('Colisão entre clones: '.implode(', ', $collisions));

                    return self::FAILURE;
                }
                $this->info('ISOLAMENTO DE IDENTIFICADORES: OK. Ambos os clones devem passar também na verificação individual.');

                return self::SUCCESS;
            }
            $snapshot = $this->capture($root, $central, $main, $test, $state);
            if ($this->option('save')) {
                if (is_file($file) && ! $this->option('replace-baseline')) {
                    $this->error('Referência já existe. Compare primeiro; --save --replace-baseline só para criar uma nova referência intencional.');

                    return self::FAILURE;
                }
                $temp = $file.'.tmp';
                if (file_put_contents($temp, json_encode($snapshot, JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT)."\n", LOCK_EX) === false || ! chmod($temp, 0600) || ! rename($temp, $file)) {
                    throw new RuntimeException('write');
                }
                $this->info('REFERÊNCIA SALVA. Repita o bootstrap sem alterar configurações/dados e execute foundation:verify.');

                return self::SUCCESS;
            }
            if ($this->option('replace-baseline')) {
                throw new RuntimeException('replace-needs-save');
            }
            $before = $this->readBaseline($file);
            $changed = [];
            foreach (['identity', 'files', 'tables'] as $part) {
                if ($before[$part] !== $snapshot[$part]) {
                    $changed[] = $part;
                }
            }
            if ($changed) {
                $this->error('PRESERVAÇÃO: FALHOU em '.implode(', ', $changed).'. Não substitua a referência para esconder a diferença.');

                return self::FAILURE;
            }
            $this->info('PRESERVAÇÃO: OK — identidade, arquivos/chaves e conteúdo das tabelas inalterados.');

            return self::SUCCESS;
        } catch (Throwable $error) {
            // No environment values, SQL, rows, keys or arbitrary exception text.
            $this->error('Verificação interrompida. Exige clone local inicializado, MySQL principal correspondente ao central e referência --save existente para comparar.');

            return self::FAILURE;
        }
    }

    private function readBaseline(string $file): array
    {
        $data = json_decode(file_get_contents($file), true, 64, JSON_THROW_ON_ERROR);
        if (($data['schema'] ?? null) !== 1 || ! isset($data['identity'], $data['files'], $data['tables'])) {
            throw new RuntimeException('baseline-invalid');
        }

        return $data;
    }

    private function capture(string $root, array $central, string $main, string $test, array $state): array
    {
        $id = $state['identity'] ?? [];
        $identity = ['root' => $root, 'slug' => $central['PROJECT_SLUG'], 'domain' => $central['LOCAL_DOMAIN'] ?? $central['PROJECT_SLUG'].'.localhost', 'ports' => [(int) $central['DEV_PORT'], (int) $central['PREVIEW_PORT']], 'databases' => [$main, $test], 'volumes' => [$id['vendor'] ?? '', $id['modules'] ?? ''], 'appKey' => hash('sha256', (string) config('app.key')), 'vapidKey' => config('webpush.vapid.private_key') ? hash('sha256', config('webpush.vapid.private_key')) : null];
        if (empty(config('app.key')) || in_array('', $identity['volumes'], true)) {
            throw new RuntimeException('identity-incomplete');
        }
        $files = [];
        foreach (['.env.foundation', 'backend/.env', 'backend/.env.testing', 'backend/composer.lock', 'backend/vendor/.foundation-lock', 'frontend/package-lock.json', 'frontend/.foundation.public.json', 'frontend/vite.cmd', 'frontend/dist/index.html'] as $name) {
            if (! is_file($root.'/'.$name)) {
                throw new RuntimeException('file-missing');
            }
            $files[$name] = hash_file('sha256', $root.'/'.$name);
        }
        $tables = DB::transaction(function (): array {
            $result = [];
            $names = Schema::getTableListing();
            sort($names);
            foreach ($names as $table) {
                $primary = collect(Schema::getIndexes($table))->firstWhere('primary', true);
                if (! $primary) {
                    throw new RuntimeException('primary-key-required');
                }
                $query = DB::table($table);
                foreach ($primary['columns'] as $column) {
                    $query->orderBy($column);
                }
                $hash = hash_init('sha256');
                $count = 0;
                foreach ($query->cursor() as $row) {
                    hash_update($hash, json_encode($row, JSON_THROW_ON_ERROR)."\n");
                    $count++;
                }
                $result[$table] = ['count' => $count, 'hash' => hash_final($hash)];
            }

            return $result;
        });

        return ['schema' => 1, 'identity' => $identity, 'files' => $files, 'tables' => $tables];
    }

    public static function collisions(array $a, array $b): array
    {
        $result = [];
        foreach (['root', 'slug', 'domain', 'appKey'] as $key) {
            if (empty($a[$key]) || empty($b[$key]) || $a[$key] === $b[$key]) {
                $result[] = $key;
            }
        }
        foreach (['ports', 'databases', 'volumes'] as $key) {
            $all = array_merge($a[$key], $b[$key]);
            if ($key === 'databases') {
                $all = array_map('strtolower', $all);
            }
            if (count(array_unique($all)) !== count($all)) {
                $result[] = $key;
            }
        }
        if ($a['vapidKey'] && $a['vapidKey'] === $b['vapidKey']) {
            $result[] = 'vapidKey';
        }

        return $result;
    }
}
