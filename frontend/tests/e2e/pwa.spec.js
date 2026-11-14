import { test, expect, open, readyWorker } from './fixtures.js';
test.use({ serviceWorkers: 'allow' });
test('worker real prepara shell offline sem cache de API', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Aceite de worker automatizado neste roteiro é Chromium; demais aparelhos têm teste manual.');
  await open(page);
  await readyWorker(page);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Hello', exact: true })).toBeVisible();
  await page.unroute('**/api/v1/status');
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Hello', exact: true })).toBeVisible();
  const result = await page.evaluate(async () => {
    try { const response = await fetch('/api/v1/status'); return { html: (response.headers.get('content-type') || '').includes('text/html'), ok: response.ok }; }
    catch { return { html: false, ok: false }; }
  });
  expect(result).toEqual({ html: false, ok: false });
  const cachedTechnical = await page.evaluate(async () => {
    for (const name of await caches.keys()) for (const request of await (await caches.open(name)).keys()) if (/\/(api|sanctum|status|up)(\/|$)/.test(new URL(request.url).pathname)) return true;
    return false;
  });
  expect(cachedTechnical).toBe(false);
});

test('atualização de worker real respeita confirmação e preserva duas abas', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Fluxo de atualização automatizado é Chromium.');
  const fs = await import('node:fs/promises');
  const file = new URL('../../../dist/sw.js', import.meta.url);
  const original = await fs.readFile(file, 'utf8');
  await open(page); await readyWorker(page);
  const second = await context.newPage();
  await second.route('**/api/v1/status', route => route.fulfill({ json: { status: 'ok', checks: { application: 'ok', database: 'ok' } } }));
  await second.route('**/api/v1/push/**', route => route.fulfill({ status: 401, json: {} }));
  await open(second); await readyWorker(second);
  await page.locator('#demo-email').fill('aba-a@example.test');
  await second.locator('#demo-email').fill('aba-b@example.test');
  let secondNavigations = 0;
  second.on('framenavigated', frame => { if (frame === second.mainFrame()) secondNavigations++; });
  try {
    // Change only the generated worker for the test; source and user data are untouched.
    await fs.writeFile(file, original + '\n// e2e worker revision ' + Date.now() + '\n');
    await page.getByRole('button', { name: 'Verificar atualização' }).click();
    await expect(page.getByRole('button', { name: 'Atualizar aplicativo' })).toBeVisible();
    await page.getByRole('button', { name: 'Atualizar aplicativo' }).click();
    const firstReload = page.waitForEvent('framenavigated', frame => frame === page.mainFrame());
    await page.locator('.dialog.modal-in .dialog-button').last().click();
    await firstReload;
    await expect(page.locator('#demo-email')).toHaveValue('aba-a@example.test');
    await expect(second.locator('#demo-email')).toHaveValue('aba-b@example.test');
    await expect(second.getByText('Nova versão ativa. Seus campos continuam nesta aba; atualize quando estiver pronto.', { exact: true })).toBeVisible();
    expect(secondNavigations).toBe(0);
    await expect(second.getByRole('button', { name: 'Atualizar aplicativo' })).toBeVisible();
    await second.getByRole('button', { name: 'Atualizar aplicativo' }).click();
    const secondReload = second.waitForEvent('framenavigated', frame => frame === second.mainFrame());
    await second.locator('.dialog.modal-in .dialog-button').last().click();
    await secondReload;
    await expect(second.locator('#demo-email')).toHaveValue('aba-b@example.test');
  } finally { await fs.writeFile(file, original); }
});
