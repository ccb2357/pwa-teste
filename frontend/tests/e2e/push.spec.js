import { test, expect, open } from './fixtures.js';
import { createHash } from 'node:crypto';

test('push pede permissão somente por clique, lista quatro envios e remove inscrição', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'PushManager simulado neste contrato é Chromium; entrega real exige aparelho.');
  const endpoint = 'https://fcm.googleapis.com/e2e-mock-only';
  const key = Buffer.from(Uint8Array.from({ length: 65 }, (_, i) => i)).toString('base64url');
  const fingerprint = createHash('sha256').update(endpoint).digest('hex');
  await page.addInitScript(({ endpoint }) => {
    let permission = 'default', subscription = null;
    window.__pushPrompts = 0;
    Object.defineProperty(Notification, 'permission', { get: () => permission });
    Notification.requestPermission = async () => { window.__pushPrompts++; permission = 'granted'; return permission; };
    PushManager.prototype.getSubscription = async () => subscription;
    PushManager.prototype.subscribe = async options => {
      subscription = { endpoint, options, toJSON: () => ({ endpoint, keys: { p256dh: 'mock', auth: 'mock' } }), unsubscribe: async () => { subscription = null; return true; } };
      return subscription;
    };
    // The app uses the registration, but this test must never contact a push provider.
    navigator.serviceWorker.getRegistration = async () => ({ active: {}, pushManager: { getSubscription: () => PushManager.prototype.getSubscription(), subscribe: options => PushManager.prototype.subscribe(options) } });
  }, { endpoint });
  let logged = false, devices = [], preference = false;
  const deliveries = [{ id: '1', status: 'queued' }, { id: '2', status: 'accepted', provider_status: 201 }, { id: '3', status: 'failed', provider_status: 403 }, { id: '4', status: 'cancelled' }, { id: '5', status: 'accepted' }];
  await page.route('**/sanctum/csrf-cookie', route => route.fulfill({ status: 204, headers: { 'set-cookie': 'XSRF-TOKEN=e2e; Path=/; SameSite=Lax' } }));
  await page.route('**/api/v1/push/**', async route => {
    const request = route.request(), name = new URL(request.url()).pathname.split('/push/')[1];
    const method = request.method();
    let status = 200, data;
    if (name === 'test-session') { if (method === 'POST') logged = true; data = { test_auth: true }; }
    else if (!logged) { status = 401; data = {}; }
    else if (name === 'config') data = { enabled: true, public_key: key, user: { id: 1, name: 'Teste E2E' }, test_auth: true };
    else if (name === 'subscriptions') {
      if (method === 'POST') { devices = [{ id: 1, label: 'Navegador de teste', fingerprint }]; status = 201; data = devices[0]; }
      else data = { devices };
    } else if (name === 'preferences') { if (method === 'PUT') preference = request.postDataJSON().enabled; data = { enabled: preference }; }
    else if (name === 'deliveries') data = { deliveries };
    else if (name === 'subscriptions/1') { devices = []; status = 204; }
    else { status = 404; data = {}; }
    await route.fulfill({ status, ...(status === 204 ? {} : { json: data }), headers: { 'cache-control': 'no-store' } });
  });
  await open(page);
  await expect(page.getByLabel('Código de acesso de teste local')).toBeVisible();
  expect(await page.evaluate(() => window.__pushPrompts)).toBe(0);
  await page.getByLabel('Código de acesso de teste local').fill('x'.repeat(64));
  await page.getByRole('button', { name: 'Entrar para testar' }).click();
  await expect(page.getByRole('button', { name: 'Ativar neste dispositivo' })).toBeVisible();
  expect(await page.evaluate(() => window.__pushPrompts)).toBe(0);
  await page.getByRole('button', { name: 'Ativar neste dispositivo' }).click();
  await expect(page.getByRole('button', { name: 'Remover este dispositivo' })).toBeVisible();
  expect(await page.evaluate(() => window.__pushPrompts)).toBe(1);
  await expect(page.locator('.push-history-chip')).toHaveCount(4);
  for (const [index, color] of ['blue', 'green', 'red', 'gray'].entries()) await expect(page.locator('.push-history-chip').nth(index)).toHaveClass(new RegExp(`color-${color}`));
  await page.getByRole('button', { name: 'Remover este dispositivo' }).click();
  await page.locator('.dialog.modal-in .dialog-button').last().click();
  await expect(page.getByRole('button', { name: 'Ativar neste dispositivo' })).toBeVisible();
  expect(devices).toHaveLength(0);
});
