<?php

declare(strict_types=1);

try {
    $c = json_decode(stream_get_contents(STDIN), true, 32, JSON_THROW_ON_ERROR);
    foreach (['database', 'testDatabase'] as $key) {
        if (! preg_match('/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/D', $c[$key] ?? '')) {
            throw new RuntimeException('invalid-name');
        }
    }
    if (strcasecmp($c['database'], $c['testDatabase']) === 0 || preg_match('/[;\r\n\x00]/', $c['host'])) {
        throw new RuntimeException('invalid-connection');
    }
    $pdo = new PDO('mysql:host='.$c['host'].';port='.(int) $c['port'].';charset=utf8mb4', $c['username'], $c['password'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 10]);
    $result = [];
    foreach ([$c['database'], $c['testDatabase']] as $database) {
        $check = $pdo->prepare('SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?');
        $check->execute([$database]);
        if (! $check->fetchColumn()) {
            try {
                $pdo->exec('CREATE DATABASE `'.$database.'` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
            } catch (PDOException $e) {
                fwrite(STDERR, "Banco ausente: crie manualmente com a conta existente e repita o bootstrap. Não serão criados usuários ou grants.\n");
                exit(2);
            }
        }
        $pdo->exec('USE `'.$database.'`');
        $pdo->query('SELECT 1')->fetchColumn();
        $result[$database] = 'ok';
    }
    echo json_encode(['status' => 'ok', 'databases' => $result], JSON_THROW_ON_ERROR);
} catch (Throwable $e) {
    fwrite(STDERR, "Não foi possível conferir os bancos com a conexão informada. Verifique a configuração privada, conta, permissões e rede.\n");
    exit(1);
}
