import { test as base, expect } from '@playwright/test';
export const healthy = { status: 'ok', checks: { application: 'ok', database: 'ok' } };
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route('**/api/v1/status', route => route.fulfill({ json: healthy, headers: { 'cache-control': 'no-store' } }));
    await page.route('**/api/v1/push/**', route => route.fulfill({ status: 401, json: { message: 'Autenticação necessária.' }, headers: { 'cache-control': 'no-store' } }));
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await use(page);
    expect(errors, 'Erros JavaScript não tratados').toEqual([]);
  },
});
export { expect };
export async function open(page) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Hello', exact: true })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}
export async function readyWorker(page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
  });
}
