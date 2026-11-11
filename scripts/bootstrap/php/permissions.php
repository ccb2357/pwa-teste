<?php

declare(strict_types=1);

$root = dirname(__DIR__, 3);
$paths = [$root.'/backend/storage', $root.'/backend/bootstrap/cache'];
try {
    foreach (['storage/app/private', 'storage/app/public', 'storage/framework/cache/data', 'storage/framework/sessions', 'storage/framework/views', 'storage/logs', 'bootstrap/cache'] as $directory) {
        $target = $root.'/backend/'.$directory;
        if (! is_dir($target) && ! mkdir($target, 0770, true) && ! is_dir($target)) {
            throw new RuntimeException('mkdir');
        }
    }
    foreach ($paths as $directory) {
        $items = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($directory, FilesystemIterator::SKIP_DOTS), RecursiveIteratorIterator::SELF_FIRST);
        $targets = [$directory];
        foreach ($items as $item) {
            if (! $item->isLink()) {
                $targets[] = $item->getPathname();
            }
        }
        foreach ($targets as $target) {
            if (! chmod($target, is_dir($target) ? 0770 : 0660) || ! chown($target, 'www-data') || ! chgrp($target, 'www-data')) {
                throw new RuntimeException('permissions');
            }
        }
    }
    foreach (['.env', '.env.testing'] as $name) {
        $file = $root.'/backend/'.$name;
        if (is_file($file) && (! chmod($file, 0640) || ! chown($file, 'www-data') || ! chgrp($file, 'www-data'))) {
            throw new RuntimeException('env-permissions');
        }
    }
    echo "Permissões restritas ao projeto verificadas.\n";
} catch (Throwable $e) {
    fwrite(STDERR, "Não foi possível ajustar as permissões do projeto.\n");
    exit(1);
}
