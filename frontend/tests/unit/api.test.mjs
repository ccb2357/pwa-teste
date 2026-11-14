import { test } from 'vitest';
import assert from 'node:assert/strict';
import { apiRequest, getStatus, ApiError } from '../../src/services/api.js';
const healthy = { status: 'ok', checks: { application: 'ok', database: 'ok' } };
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
test('status requires a fresh authenticated-origin JSON request confirming both checks', async () => {
  let request;
  assert.deepEqual(await getStatus({ fetcher: async (url, options) => { request = { url, ...options }; return json(healthy); } }), healthy);
  assert.equal(request.url, '/api/v1/status'); assert.equal(request.cache, 'no-store'); assert.equal(request.credentials, 'include');
});
test('503 and HTML responses cannot become a healthy status', async () => {
  await assert.rejects(getStatus({ fetcher: async () => json({}, 503) }), error => error instanceof ApiError && error.status === 503);
  await assert.rejects(getStatus({ fetcher: async () => new Response('<html>ok</html>', { headers: { 'content-type': 'text/html' } }) }));
  await assert.rejects(getStatus({ fetcher: async () => json({ status: 'ok', checks: { application: 'ok', database: 'error' } }) }));
});
test('mutations initialize CSRF and submit the decoded cookie once, without retrying 419', async () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const document = { cookie: '' }; Object.defineProperty(globalThis, 'document', { value: document, configurable: true });
  const calls = [];
  try {
    await assert.rejects(apiRequest('/api/v1/example', { method: 'POST', json: { example: true }, fetcher: async (path, options) => {
      calls.push({ path, options });
      if (path === '/sanctum/csrf-cookie') { document.cookie = 'XSRF-TOKEN=token%3D'; return new Response(null, { status: 204 }); }
      return json({}, 419);
    } }), error => error.status === 419);
    assert.equal(calls.length, 2); assert.equal(calls[1].options.headers['X-XSRF-TOKEN'], 'token=');
  } finally { if (previous) Object.defineProperty(globalThis, 'document', previous); else delete globalThis.document; }
});
test('API client rejects external destinations before making requests', async () => {
  let called = false;
  await assert.rejects(apiRequest('https://example.com/api/v1/x', { fetcher: async () => { called = true; } }));
  assert.equal(called, false);
});
