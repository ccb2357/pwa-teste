import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { parseCentral, validate, args, contained } from '../lib/config.mjs';
import { mapPath, mappedPaths, infraProblems, sameHost } from '../lib/docker.mjs';
import { managedEnv, synchronizeEnvs, appKey, checkIdentity, identity, writeAtomic } from '../lib/files.mjs';
import { composeSnippet, nginxSnippet, siteApplied, viteCmd, publicConfiguration } from '../lib/templates.mjs';
import { run } from '../lib/process.mjs';
import { httpFailure } from '../lib/errors.mjs';
const raw = await fs.readFile(new URL('../../../.env.foundation.example', import.meta.url), 'utf8');
const input = parseCentral(raw);
const config = changes => validate({ ...input, ...changes }, '/var/www/pwa-teste');
test('HTTP failures show only controlled diagnostics and discard private output', () => {
  const output = httpFailure(JSON.stringify({ status: 'error', reason: 'html-contract', path: '/status', http_status: 200, curl_errno: 0, origin_index: 0, body: 'PRIVATE-BODY', cookies: 'PRIVATE-COOKIE' }));
  assert.match(output, /\/status/); assert.match(output, /HTML/); assert.match(output, /HTTP 200/);
  assert.doesNotMatch(output, /PRIVATE/);
  for (const value of ['PRIVATE-ERROR', JSON.stringify({ status: 'error', reason: 'PRIVATE-ERROR' }), JSON.stringify({ status: 'error', reason: 'no-store', path: 'PRIVATE-PATH', http_status: 'PRIVATE-STATUS' })]) {
    assert.doesNotMatch(httpFailure(value), /PRIVATE/);
  }
});
const d = {
  project: 'infra', directory: '/var/www/infra', hostDir: 'C:\\var\\www\\infra', internalFiles: ['/var/www/infra/docker-compose.yml'],
  mapping: { toHost: x => mapPath(x, '/var/www', 'C:\\var\\www') },
};
test('dotenv preserves special characters without expansion or execution', () => {
  const values = parseCentral('DB_PASSWORD="a b$HOME#c=;`$(command)"\nPROJECT_NAME=Teste\n');
  assert.equal(values.DB_PASSWORD, 'a b$HOME#c=;`$(command)');
  assert.throws(() => parseCentral('APP_ENV=local\nAPP_ENV=production\n'));
  assert.throws(() => parseCentral('APP_ENV="unterminated\n'));
});
test('environment and identity cannot fall back silently', () => {
  assert.throws(() => config({ APP_ENV: '' }));
  assert.throws(() => config({ APP_ENV: 'staging' }));
  assert.throws(() => config({ PROJECT_SLUG: 'other' }));
  assert.equal(config().nodeService, 'pwa-teste-node');
});
test('production requires HTTPS origin and derives secure stateful host', () => {
  assert.throws(() => config({ APP_ENV: 'production', PRODUCTION_URL: 'http://example.com' }));
  assert.throws(() => config({ APP_ENV: 'production', PRODUCTION_URL: 'https://example.com/subpath' }));
  const c = config({ APP_ENV: 'production', PRODUCTION_URL: 'https://example.com' });
  assert.equal(c.appUrl, 'https://example.com'); assert.equal(c.stateful, 'example.com');
});
test('test database collision is rejected, including case-only difference', () => {
  assert.throws(() => config({ DB_TEST_DATABASE: 'PWA_TESTE' }));
  assert.equal(config({ DB_TEST_DATABASE: '' }).DB_TEST_DATABASE, 'pwa_teste_test');
  assert.throws(() => config({ DB_DATABASE: 'bad`;DROP' }));
});
test('ports must be valid and distinct', () => {
  assert.throws(() => config({ DEV_PORT: '5177' }));
  assert.throws(() => config({ DEV_PORT: '65536' }));
  assert.throws(() => config({ DEV_PORT: '5176x' }));
});
test('Windows/Linux host mapping preserves spaces and prevents traversal', () => {
  assert.equal(mapPath('/var/www/my project/a', '/var/www', 'C:\\var\\www'), 'C:\\var\\www\\my project\\a');
  assert.equal(mapPath('C:\\var\\www\\my project\\a', 'C:\\var\\www', '/var/www'), '/var/www/my project/a');
  assert.equal(mapPath('/srv/apps/a', '/srv/apps', '/var/www'), '/var/www/a');
  assert.throws(() => mapPath('C:\\other\\a', 'C:\\var\\www', '/var/www'));
  assert.throws(() => mapPath('/var/www-other/a', '/var/www', '/srv/apps'));
});
test('effective mount mapping is mandatory', () => {
  assert.throws(() => mappedPaths({ Mounts: [] }, config()));
  const result = mappedPaths({ Mounts: [{ Type: 'bind', Source: 'C:\\var\\www', Destination: '/var/www' }] }, config());
  assert.equal(result.toHost('/var/www/pwa-teste'), 'C:\\var\\www\\pwa-teste');
});
test('Docker Desktop mount aliases match Windows Compose labels without escaping the root', () => {
  const source = '/run/desktop/mnt/host/c/var/www';
  const mapping = mappedPaths({ Mounts: [{ Type: 'bind', Source: source, Destination: '/var/www' }] }, config());
  assert.equal(mapping.toInternal('C:\\var\\www\\infra\\docker-compose.yml'), '/var/www/infra/docker-compose.yml');
  assert.equal(mapping.toInternal(source + '/infra/docker-compose.yml'), '/var/www/infra/docker-compose.yml');
  assert.equal(mapping.toHost('/var/www/pwa-teste/frontend'), 'C:\\var\\www\\pwa-teste\\frontend');
  assert.equal(sameHost(source, 'C:\\var\\www'), true);
  assert.equal(sameHost('C:\\var\\www', source), true);
  assert.equal(sameHost(source, 'D:\\var\\www'), false);
  assert.equal(sameHost(source, '/var/www'), false);
  assert.throws(() => mapping.toInternal('C:\\var\\other\\file'));
  assert.throws(() => mapping.toInternal(source + '/../other/file'));
});
test('central target cannot escape through symlink', async () => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'foundation-containment-'));
  try {
    await fs.mkdir(temp + '/allowed'); await fs.mkdir(temp + '/outside'); await fs.symlink(temp + '/outside', temp + '/allowed/escape');
    await assert.rejects(contained(temp + '/allowed/escape', temp + '/allowed'));
  } finally { await fs.rm(temp, { recursive: true, force: true }); }
});
test('valid app key is preserved and invalid existing key is not regenerated', () => {
  const key = appKey(''); assert.equal(appKey('APP_KEY=' + key), key);
  assert.equal(appKey('APP_KEY=abcdefghijklmnopqrstuvwxyz123456'), 'abcdefghijklmnopqrstuvwxyz123456');
  assert.throws(() => appKey('APP_KEY=invalid'));
});
test('managed env preserves product settings and reexecution is stable', () => {
  const first = managedEnv('PRODUCT_SETTING=keep\nAPP_ENV=old\n', { APP_ENV: 'local', DB_PASSWORD: 'a b$"\\#' });
  assert.match(first, /PRODUCT_SETTING=keep/); assert.doesNotMatch(first, /APP_ENV=old/);
  assert.equal(managedEnv(first, { APP_ENV: 'local', DB_PASSWORD: 'a b$"\\#' }), first);
});
test('initialized identity changes require explicit migration', () => {
  const c = config(), state = { identity: identity(c) }; checkIdentity(state, c);
  assert.throws(() => checkIdentity(state, config({ DB_DATABASE: 'another' })));
});
test('generated infrastructure is credential-free and restricted to the clone', () => {
  const c = config({ DB_PASSWORD: 'UNIQUE-SECRET' });
  const snippets = composeSnippet(c, d) + nginxSnippet(c);
  assert.doesNotMatch(snippets, /UNIQUE-SECRET/);
  assert.match(snippets, /pwa_teste_vendor/); assert.match(snippets, /127\.0\.0\.1:5176:5173/);
  assert.match(snippets, /C:\\\\var\\\\www\\\\pwa-teste\\\\frontend/);
});
test('Nginx validation checks actual config rather than marker alone', () => {
  const c = config(); assert.equal(siteApplied('# PWA FOUNDATION: pwa-teste', c), false);
  assert.equal(siteApplied(nginxSnippet(c), c), true);
  assert.equal(siteApplied(nginxSnippet(c).replace('php-fpm:9000', 'wrong:9000'), c), false);
});
test('Windows shortcut preserves shared Compose identity and exit code', () => {
  const output = viteCmd(config(), d); assert.match(output, /-p infra/); assert.match(output, /%~dp0/); assert.match(output, /exit \/b %errorlevel%/);
  assert.match(output, /--service-ports pwa-teste-node npm run dev/);
  assert.doesNotMatch(output.split(':build')[1], /--service-ports/);
});
test('initial absence reports infra pending instead of installing', () => {
  const problems = infraProblems(config(), { ...d, config: { services: {} }, php: { Mounts: [] }, nginx: { Mounts: [] } });
  assert.ok(problems.some(x => x.includes('pwa-teste-node'))); assert.ok(problems.some(x => x.includes('vendor')));
});
test('CLI only accepts explicit target and narrow force option', () => {
  assert.deepEqual(args(['--project', '/var/www/pwa-teste', '--force']), { force: true, project: '/var/www/pwa-teste' });
  assert.throws(() => args(['--env', 'production'])); assert.throws(() => args(['--project', '../escape']));
});
test('process failures do not print stdout, secrets, or arbitrary shell content', async () => {
  await assert.rejects(run(process.execPath, ['-e', 'console.error("UNIQUE-PRIVATE-VALUE");process.exit(9)'], { label: 'Processo de teste' }), error => !error.message.includes('UNIQUE-PRIVATE-VALUE') && error.message.includes('9'));
});
test('atomic writes avoid unnecessary replacement', async () => {
  const folder = await fs.mkdtemp(path.join(os.tmpdir(), 'foundation-write-'));
  try { assert.equal(await writeAtomic(folder + '/x', 'value'), true); assert.equal(await writeAtomic(folder + '/x', 'value'), false); }
  finally { await fs.rm(folder, { recursive: true, force: true }); }
});

test('public config excludes credentials and keeps proxy details out of the browser app fields', () => {
  const output = publicConfiguration(config({ DB_PASSWORD: 'PRIVATE-DATABASE' }));
  assert.doesNotMatch(JSON.stringify(output), /PRIVATE-DATABASE|DB_USERNAME|DB_PASSWORD/);
  assert.equal(output.app.apiBase, '/api/v1');
  assert.equal(output.app.locale, 'pt-BR');
  assert.equal(output.app.proxyTarget, undefined);
});

test('PWA Nginx separates backend routes, mutable entrypoints and immutable assets', () => {
  const site = nginxSnippet(config());
  assert.match(site, /root "\/var\/www\/pwa-teste\/frontend\/dist"/);
  assert.match(site, /api\|sanctum\|up\|status/);
  assert.match(site, /internal;/); assert.match(site, /SCRIPT_FILENAME "\/var\/www\/pwa-teste\/backend\/public\/index.php"/);
  assert.match(site, /location = \/sw.js[^}]+no-cache/);
  assert.match(site, /location \/assets\/[^}]+immutable/);
  assert.doesNotMatch(site, /return 302 \/status/);
});
test('push defaults, private derivation and production test access are guarded', async () => {
  const defaults = config(); assert.equal(defaults.PUSH_ENABLED, 'false');
  assert.throws(() => config({ PUSH_ENABLED: 'true' }));
  assert.throws(() => config({ VAPID_PUBLIC_KEY: 'partial' }));
  assert.throws(() => config({ APP_ENV: 'production', PRODUCTION_URL: 'https://app.example.test', PUSH_TEST_AUTH_ENABLED: 'true' }));
  const c = config({ PUSH_ENABLED: 'true', VAPID_SUBJECT: 'mailto:push@example.test', VAPID_PUBLIC_KEY: 'PUBLIC-TEST', VAPID_PRIVATE_KEY: 'PRIVATE-TEST' });
  assert.doesNotMatch(JSON.stringify(publicConfiguration(c)), /PRIVATE-TEST|PUBLIC-TEST|VAPID/);
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'push-env-'));
  try { await synchronizeEnvs({ ...c, backend: temp }); const env = parseCentral(await fs.readFile(path.join(temp, '.env'), 'utf8')); assert.equal(env.QUEUE_CONNECTION, 'database'); assert.equal(env.VAPID_PRIVATE_KEY, 'PRIVATE-TEST'); const testing = parseCentral(await fs.readFile(path.join(temp, '.env.testing'), 'utf8')); assert.equal(testing.PUSH_ENABLED, 'false'); assert.equal(testing.VAPID_PRIVATE_KEY, ''); } finally { await fs.rm(temp, { recursive: true, force: true }); }
});
