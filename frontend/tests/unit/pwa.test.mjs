import test from 'node:test';
import assert from 'node:assert/strict';
import { createPwaManager } from '../../src/pwa/manager.js';
import { draftStorage, cleanDraft } from '../../src/pwa/draft.js';
import { technicalPath, shellPath } from '../../src/pwa/policy.js';
function fixture(options = {}) {
  const win = new EventTarget(); win.document = new EventTarget(); win.document.visibilityState = 'visible'; win.matchMedia = () => ({ matches: false });
  const state = {}, calls = []; let callbacks;
  win.setInterval = () => 1; win.clearInterval = () => {}; win.location = { reload() { calls.push('reload'); } };
  const nav = { onLine: true, serviceWorker: {} };
  const pwa = createPwaManager({ window: win, navigator: nav, production: true, secure: true, state, register(value) { callbacks = value; calls.push('register'); return async () => calls.push('activate'); }, ...options });
  pwa.start(); return { pwa, state, calls, win, callbacks: () => callbacks };
}
test('development and insecure origins never register or prompt', () => {
  for (const options of [{ production: false }, { secure: false }]) { const f = fixture(options); assert.deepEqual(f.calls, []); f.pwa.destroy(); }
});
test('updates in another tab never reload a dirty form; explicit update saves first', async () => {
  const f = fixture(); f.pwa.draftGuard(() => true, () => f.calls.push('save'));
  f.callbacks().onNeedReload(); assert.equal(f.state.reloadReady, true); assert.deepEqual(f.calls, ['register']);
  await f.pwa.applyUpdate(); assert.deepEqual(f.calls, ['register', 'save', 'reload']); f.pwa.destroy();
});
test('refused draft storage blocks activation and reload; waiting update saves before activation', async () => {
  const f = fixture(); f.callbacks().onNeedRefresh(); f.pwa.draftGuard(() => true, () => { throw Error('denied'); });
  await f.pwa.applyUpdate(); assert.deepEqual(f.calls, ['register']); assert.match(f.state.message, /mantida/);
  f.pwa.draftGuard(() => true, () => f.calls.push('save')); await f.pwa.applyUpdate(); assert.deepEqual(f.calls, ['register', 'save', 'activate']);
  f.callbacks().onNeedReload(); assert.deepEqual(f.calls, ['register', 'save', 'activate', 'save', 'reload']); f.pwa.destroy();
});
test('install prompt is only consumed on explicit click and cannot be reused', async () => {
  const f = fixture(); const event = new Event('beforeinstallprompt', { cancelable: true }); let prompted = 0;
  event.prompt = async () => { prompted++; }; event.userChoice = Promise.resolve({ outcome: 'dismissed' }); f.win.dispatchEvent(event);
  assert.equal(prompted, 0); assert.equal(event.defaultPrevented, true); assert.equal(f.state.installReady, true);
  await f.pwa.install(); await f.pwa.install(); assert.equal(prompted, 1); assert.equal(f.state.installReady, false); f.pwa.destroy();
});
test('drafts restore only known fields in the same project and are consumed once', () => {
  const values = new Map(); const storage = { getItem: k => values.get(k), setItem: (k,v) => values.set(k,v), removeItem: k => values.delete(k) };
  const a = draftStorage(storage, 'a'), b = draftStorage(storage, 'b');
  a.save({ email: 'demo@example.com', phone: '(47) 91234-5678', checked: true, language: 'PHP', count: 2, password: 'never' });
  assert.equal(b.restore().email, ''); assert.equal(a.restore().email, 'demo@example.com'); assert.equal(a.restore().email, '');
  assert.throws(() => a.save({ email: 'x'.repeat(321) }));
  assert.equal(cleanDraft({ password: 'never' }).password, undefined); assert.equal(cleanDraft({ date: ['invalid'], language: '<script>' }).date.length, 0);
});
test('technical paths, including encoded variants, never use navigation fallback', () => {
  for (const path of ['/api', '/api/v1/status', '/sanctum/csrf-cookie', '/up', '/status', '/status/secret', '/%61pi/v1/me', '/API/me', '/.env', '/backend/.env', '/index.php', '/%zz']) { assert.equal(technicalPath(path), true, path); assert.equal(shellPath(path), false); }
  assert.equal(shellPath('/'), true); assert.equal(shellPath('/transition/dive/'), true); assert.equal(shellPath('/unknown'), false);
});

test('a rejected staged build leaves the served HTML and old assets intact', async () => {
  const fs = await import('node:fs/promises'); const os = await import('node:os'); const path = await import('node:path');
  const { publishBuild } = await import('../../scripts/publish-build.mjs');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'pwa-publish-'));
  try {
    await fs.mkdir(path.join(root, 'served/assets'), { recursive: true }); await fs.mkdir(path.join(root, 'staging'));
    await fs.writeFile(path.join(root, 'served/index.html'), 'old HTML'); await fs.writeFile(path.join(root, 'served/assets/old.js'), 'old asset');
    await assert.rejects(publishBuild(path.join(root, 'staging'), path.join(root, 'served')));
    assert.equal(await fs.readFile(path.join(root, 'served/index.html'), 'utf8'), 'old HTML'); assert.equal(await fs.readFile(path.join(root, 'served/assets/old.js'), 'utf8'), 'old asset');
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});
