import { test } from 'vitest';
import assert from 'node:assert/strict';
import { pushDestination, pushNotification } from '../../src/pwa/push-payload.js';
const origin = 'https://app.example.test';
test('push click retains safe route and rejects external/technical/encoded targets', () => {
  for (const route of ['/transition/fade', '/?item=1', origin + '/transition/dive']) assert.notEqual(pushDestination(route, origin), origin + '/');
  for (const route of ['https://evil.test/x', '//evil.test', '/%2fevil.test', '/%5cevil.test', '/api/v1/status', '/%61pi/users', '/.env', '/x/../api/users', '/a%00b', '/%zz']) assert.equal(pushDestination(route, origin), origin + '/', route);
});
test('payload defaults are defensive, bounded and preserve click target on normalization', () => {
  const blank = pushNotification(null, origin); assert.equal(blank.title, 'Notificação');
  const message = pushNotification({ title: 'x'.repeat(200), body: 'y'.repeat(400), data: { url: '/transition/fade' }, image: 'https://evil.test/image.png' }, origin);
  assert.equal(message.title.length, 100); assert.equal(message.options.body.length, 240); assert.equal(message.options.image, undefined);
  assert.equal(pushDestination(message.options.data.url, origin), origin + '/transition/fade');
  assert.equal(pushNotification({ image: '/icons/icon-192.png' }, origin).options.image, origin + '/icons/icon-192.png');
});
