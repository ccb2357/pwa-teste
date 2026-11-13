<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Process\Process;

class PushKeysScriptTest extends TestCase
{
    public function test_bootstrap_generates_once_preserves_pair_and_rejects_partial_without_printing_keys(): void
    {
        $root = sys_get_temp_dir().'/push-keys-'.bin2hex(random_bytes(6));
        mkdir($root.'/scripts/bootstrap/php', 0700, true);
        mkdir($root.'/backend', 0700, true);
        symlink(dirname(__DIR__, 2).'/vendor', $root.'/backend/vendor');
        $script = $root.'/scripts/bootstrap/php/push-keys.php';
        copy(dirname(__DIR__, 3).'/scripts/bootstrap/php/push-keys.php', $script);
        $central = $root.'/.env.foundation';
        try {
            file_put_contents($central, "PUSH_ENABLED=true\nVAPID_SUBJECT=mailto:push@example.test\nVAPID_PUBLIC_KEY=\nVAPID_PRIVATE_KEY=\n");
            $run = fn () => new Process([PHP_BINARY, $script]);
            $first = $run();
            $this->assertSame(0, $first->run());
            $this->assertSame('{"status":"ok"}', $first->getOutput());
            $generated = file_get_contents($central);
            $this->assertDoesNotMatchRegularExpression('/^VAPID_PRIVATE_KEY=$/m', $generated);
            $second = $run();
            $this->assertSame(0, $second->run());
            $this->assertSame($generated, file_get_contents($central));
            file_put_contents($central, preg_replace('/^VAPID_PRIVATE_KEY=.*$/m', 'VAPID_PRIVATE_KEY=', $generated));
            $third = $run();
            $this->assertSame(1, $third->run());
            $this->assertSame('{"status":"error"}', $third->getOutput());
            $this->assertSame('', $third->getErrorOutput());
        } finally {
            unlink($central);
            unlink($script);
            unlink($root.'/backend/vendor');
            rmdir($root.'/scripts/bootstrap/php');
            rmdir($root.'/scripts/bootstrap');
            rmdir($root.'/scripts');
            rmdir($root.'/backend');
            rmdir($root);
        }
    }
}
