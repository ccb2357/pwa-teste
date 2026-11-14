import { test } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { pushDestination, pushNotification } from '../../src/pwa/push-payload.js';
import { applicationKey, sameApplicationKey, subscriptionFingerprint } from '../../src/services/push.js';
const source = fs.readFileSync(new URL('../../src/sw.js', import.meta.url), 'utf8');
function worker(windows = []) {
  const listeners = {}, shown = [], opened = [];
  const self = { location: { origin: 'https://app.example.test' }, addEventListener: (name, handler) => { listeners[name] = handler; }, registration: { showNotification: async (...args) => { shown.push(args); } }, clients: { matchAll: async () => windows, openWindow: async url => opened.push(url) } };
  vm.runInNewContext(source.slice(source.indexOf("self.addEventListener('push',")), { self, pushDestination, pushNotification });
  return { listeners, shown, opened };
}
test('worker waits for actual handler completion and handles malformed payload without private data', async () => {
  const w = worker(); let pending;
  w.listeners.push({ data: { json() { throw new Error('malformed'); } }, waitUntil: promise => { pending = promise; } });
  await pending; assert.equal(w.shown.length, 1); assert.equal(w.shown[0][0], 'Notificação');
  assert.equal(w.shown[0][1].data.url, 'https://app.example.test/');
});
test('notification click focuses exact safe destination without navigating a different open form', async () => {
  let focused = 0, pending, closed = 0;
  const exact = { url: 'https://app.example.test/transition/fade', focus: async () => { focused++; } };
  const dirty = { url: 'https://app.example.test/', navigate: () => assert.fail('Existing form must not navigate') };
  const w = worker([dirty, exact]);
  const event = url => ({ notification: { data: { url }, close: () => { closed++; } }, waitUntil: promise => { pending = promise; } });
  w.listeners.notificationclick(event(exact.url)); await pending;
  assert.equal(focused, 1); assert.equal(w.opened.length, 0); assert.equal(closed, 1);
  w.listeners.notificationclick(event('/transition/dive')); await pending;
  assert.equal(w.opened[0], 'https://app.example.test/transition/dive');
});
test('browser subscription fingerprint and VAPID key comparison are deterministic', async () => {
  const bytes = Uint8Array.from({ length: 65 }, (_, i) => i);
  const value = Buffer.from(bytes).toString('base64url');
  assert.deepEqual(applicationKey(value), bytes);
  assert.equal(sameApplicationKey({ options: { applicationServerKey: bytes.buffer } }, value), true);
  assert.equal(sameApplicationKey({ options: { applicationServerKey: new Uint8Array(65).buffer } }, value), false);
  assert.equal((await subscriptionFingerprint({ endpoint: 'https://fcm.googleapis.com/test' })).length, 64);
  assert.throws(() => applicationKey('invalid'));
});
