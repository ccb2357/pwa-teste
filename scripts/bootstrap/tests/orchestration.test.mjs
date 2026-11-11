import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { run } from '../lib/process.mjs';
import { validate, parseCentral } from '../lib/config.mjs';
import { nginxSnippet } from '../lib/templates.mjs';
const entry = fileURLToPath(new URL('../index.mjs', import.meta.url));
const runtime = fileURLToPath(new URL('../executor/package.json', import.meta.url));
const example = parseCentral(await fs.readFile(new URL('../../../.env.foundation.example', import.meta.url), 'utf8'));
// Deterministic Engine/Compose simulation; never connects to or mutates a real Docker Engine.
async function fixture({ pending = false, production = false } = {}) {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'foundation-flow-'));
  const projects = tmp + '/projects', root = projects + '/product-a';
  await fs.mkdir(root + '/backend', { recursive: true }); await fs.mkdir(root + '/frontend'); await fs.mkdir(projects + '/infra'); await fs.mkdir(tmp + '/bin');
  await fs.copyFile(new URL('../../../instalacao-pwa-framework.md', import.meta.url), root + '/instalacao-pwa-framework.md');
  await fs.writeFile(projects + '/infra/docker-compose.yml', '# fixture'); await fs.writeFile(root + '/backend/composer.lock', '{}');
  const values = { ...example, PROJECT_SLUG: 'product-a', LOCAL_DOMAIN: 'product-a.localhost', DB_DATABASE: 'product_a', DB_TEST_DATABASE: 'product_a_test', CONTAINER_PROJECTS_ROOT: projects, APP_ENV: production ? 'production' : 'local', PRODUCTION_URL: production ? 'https://example.com' : '', DB_PASSWORD: 'fixture$special #password' };
  await fs.writeFile(root + '/.env.foundation', Object.entries(values).map(([k, v]) => `${k}='${v}'`).join('\n'));
  const c = validate(values, root);
  const source = '/srv/apps';
  const mounts = [{ Type: 'bind', Source: source, Destination: projects, RW: true }];
  const labels = service => ({ 'com.docker.compose.service': service, 'com.docker.compose.project': 'shared-infra', 'com.docker.compose.project.config_files': '/srv/apps/infra/docker-compose.yml', 'com.docker.compose.project.working_dir': '/srv/apps/infra', 'com.docker.compose.oneoff': 'False' });
  const php = { Id: 'php-id', Config: { Labels: labels('php-fpm') }, State: { Running: true }, Mounts: [...mounts, ...(!pending ? [{ Type: 'volume', Name: c.vendorVolume, Destination: c.backend + '/vendor' }] : [])], NetworkSettings: { Networks: { infra_network: {} }, Ports: {} } };
  const nginx = { Id: 'nginx-id', Config: { Labels: labels('nginx') }, State: { Running: true }, Mounts: mounts, NetworkSettings: { Networks: { infra_network: {} }, Ports: {} } };
  const config = { services: { 'php-fpm': { volumes: [{ type: 'volume', source: c.vendorVolume, target: c.backend + '/vendor' }] }, [c.nodeService]: { image: 'node:22-alpine', working_dir: '/app', profiles: ['dev'], networks: { infra_network: {} }, volumes: [{ type: 'bind', source: '/srv/apps/product-a/frontend', target: '/app' }, { type: 'volume', source: c.modulesVolume, target: '/app/node_modules' }], ports: [{ target: 5173, published: '5176', host_ip: '127.0.0.1' }] } }, volumes: { [c.vendorVolume]: { name: c.vendorVolume }, [c.modulesVolume]: { name: c.modulesVolume } } };
  const data = { php, nginx, config, site: pending ? '' : nginxSnippet(c), marker: '', installs: 0, syncs: 0, calls: [] };
  const dataFile = tmp + '/fake-engine.json'; await fs.writeFile(dataFile, JSON.stringify(data));
  const fake = `#!${process.execPath}
import fs from 'node:fs';
const file=process.env.FAKE_ENGINE_DATA;const data=JSON.parse(fs.readFileSync(file));const a=process.argv.slice(2);data.calls.push(a);let out='';
const stdin=()=>fs.readFileSync(0,'utf8');
if(a[0]==='version')out='"fixture"';
else if(a[0]==='compose'&&a.includes('version'))out='2.40.3';
else if(a[0]==='compose'&&a.includes('config'))out=JSON.stringify(data.config);
else if(a[0]==='ps')out=a.some(x=>x.includes('service=php-fpm'))?'php-id':'php-id nginx-id';
else if(a[0]==='inspect')out=JSON.stringify(a.slice(1).map(x=>x==='php-id'?data.php:data.nginx));
else if(a[0]==='run')out='';
else if(a[0]==='exec'){
 if(a.includes('nginx'))out=data.site;
 else if(a.includes('--version'))out='Composer version 2.11.2';
 else if(a.includes('-m'))out='ctype\\ncurl\\ndom\\nfileinfo\\nmbstring\\nopenssl\\npdo\\npdo_mysql\\nsession\\ntokenizer\\nxml';
 else if(a.includes('install'))data.installs++;
 else if(a.includes('app:sync'))data.syncs++;
 else if(a.some(x=>x.endsWith('databases.php'))){stdin();out='{"status":"ok"}';}
 else if(a.some(x=>x.endsWith('verify-runtime.php')))stdin();
 else if(a.some(x=>x.endsWith('verify-http.php'))){stdin();out='{"status":"ok","checks":{"simulation":"ok"}}';}
 else if(a.includes('-r')){
  const code=a[a.indexOf('-r')+1];
  if(code.includes('PHP_VERSION'))out='8.2.35';
  else if(code.includes('json_encode'))out=JSON.stringify({marker:data.marker,metadata:!!data.marker});
  else if(code.includes('file_put_contents'))data.marker=stdin().trim();
 }
}else{process.exitCode=90;}
fs.writeFileSync(file,JSON.stringify(data));process.stdout.write(out);
`;
  await fs.writeFile(tmp + '/bin/docker', fake, { mode: 0o755 });
  const invoke = async force => run(process.execPath, [entry, '--project', root, ...(force ? ['--force'] : [])], { allowFailure: true, env: { ...process.env, PATH: tmp + '/bin:' + process.env.PATH, FOUNDATION_RUNTIME_PACKAGE: runtime, FAKE_ENGINE_DATA: dataFile }, timeout: 30000 });
  return { root, invoke, data: async () => JSON.parse(await fs.readFile(dataFile, 'utf8')), cleanup: () => fs.rm(tmp, { recursive: true, force: true }) };
}
test('preparation exits 2 before dependencies/env writes when effective infra is missing', async () => {
  const f = await fixture({ pending: true });
  try {
    const result = await f.invoke(); assert.equal(result.code, 2); assert.equal((await f.data()).installs, 0);
    await assert.rejects(fs.access(f.root + '/backend/.env'));
    const guide = await fs.readFile(f.root + '/instalacao-pwa-framework.md', 'utf8');
    assert.match(guide, /product-a-node/); assert.match(guide, /product_a_vendor/);
    assert.match(guide, /server_name product-a.localhost/);
    assert.match(result.stderr, /instalacao-pwa-framework.md/);
    await assert.rejects(fs.access(f.root + '/infra-generated'));
    assert.doesNotMatch(result.stdout + result.stderr, /fixture\$special/);
  } finally { await f.cleanup(); }
});
test('initialized flow preserves keys and skips unchanged dependencies on reexecution', async () => {
  const f = await fixture();
  try {
    const first = await f.invoke(); assert.equal(first.code, 0, first.stdout + first.stderr);
    const env = await fs.readFile(f.root + '/backend/.env', 'utf8');
    const guidePath = f.root + '/instalacao-pwa-framework.md';
    await fs.appendFile(guidePath, '\nObservação local preservada.\n');
    const guide = await fs.readFile(guidePath, 'utf8');
    const second = await f.invoke(); assert.equal(second.code, 0, second.stderr); assert.equal(await fs.readFile(f.root + '/backend/.env', 'utf8'), env);
    assert.equal(await fs.readFile(guidePath, 'utf8'), guide);
    assert.equal((guide.match(/<!-- BEGIN FOUNDATION INSTALL INFRA -->/g) || []).length, 1);
    const data = await f.data(); assert.equal(data.installs, 1); assert.equal(data.syncs, 2);
    assert.ok(data.calls.some(a => a[0] === 'run' && a.includes('--publish') && a.includes('infra_network')));
    const state = JSON.parse(await fs.readFile(f.root + '/.foundation-state.json', 'utf8')); assert.equal(state.completeFoundation, false); assert.equal(state.phase, 'backend-ready');
    assert.ok(!data.calls.some(a => a[0] === 'compose' && ['up', 'run', 'down'].some(x => a.includes(x))));
    assert.doesNotMatch(first.stdout + first.stderr + second.stdout + second.stderr, /fixture\$special/);
  } finally { await f.cleanup(); }
});
test('production requires force before backend initialization and does not generate testing env', async () => {
  const f = await fixture({ production: true });
  try {
    const blocked = await f.invoke(); assert.equal(blocked.code, 1, blocked.stdout + blocked.stderr); assert.equal((await f.data()).installs, 0); await assert.rejects(fs.access(f.root + '/backend/.env'));
    const allowed = await f.invoke(true); assert.equal(allowed.code, 0, allowed.stderr); await assert.rejects(fs.access(f.root + '/backend/.env.testing'));
    const data = await f.data(); assert.ok(data.calls.some(a => a.includes('app:sync') && a.includes('--force')));
  } finally { await f.cleanup(); }
});
