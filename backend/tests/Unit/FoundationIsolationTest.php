<?php

namespace Tests\Unit;

use App\Console\Commands\FoundationVerify;
use PHPUnit\Framework\TestCase;

class FoundationIsolationTest extends TestCase
{
    public function test_cross_database_port_and_key_collisions_are_detected(): void
    {
        $a = ['root' => '/apps/a', 'slug' => 'a', 'domain' => 'a.localhost', 'appKey' => 'hash-a', 'vapidKey' => null, 'ports' => [5180, 5181], 'databases' => ['a', 'a_test'], 'volumes' => ['a_vendor', 'a_modules']];
        $b = ['root' => '/apps/b', 'slug' => 'b', 'domain' => 'b.localhost', 'appKey' => 'hash-b', 'vapidKey' => null, 'ports' => [5182, 5183], 'databases' => ['b', 'b_test'], 'volumes' => ['b_vendor', 'b_modules']];
        $this->assertSame([], FoundationVerify::collisions($a, $b));
        $b['databases'][0] = 'a_test';
        $this->assertContains('databases', FoundationVerify::collisions($a, $b));
        $b['ports'][0] = 5181;
        $b['appKey'] = 'hash-a';
        $b['volumes'][0] = 'a_vendor';
        $a['vapidKey'] = $b['vapidKey'] = 'same-vapid';
        $this->assertSame(['appKey', 'ports', 'databases', 'volumes', 'vapidKey'], FoundationVerify::collisions($a, $b));
    }
}
