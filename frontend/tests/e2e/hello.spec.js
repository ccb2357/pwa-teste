import { test, expect, open } from './fixtures.js';

test('status real do cliente não mantém OK após falha ou offline', async ({ page, context }) => {
  await open(page);
  const status = page.getByTestId('backend-status');
  await expect(status).toContainText('Backend: OK');
  await page.route('**/api/v1/status', route => route.fulfill({ status: 503, json: { status: 'error' } }));
  await status.getByRole('button', { name: 'Atualizar status' }).click();
  await expect(status).not.toContainText('Backend: OK');
  await context.setOffline(true);
  await expect(status).toContainText('Sem conexão');
});

test('formulário valida, mascara e preserva campos nos quatro retornos', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Validar formulário' }).click();
  await expect(page.locator('#demo-email')).toHaveAttribute('aria-invalid', 'true');
  await page.getByLabel('E-mail', { exact: true }).fill('teste@example.test');
  await page.getByLabel('Celular', { exact: true }).fill('47912345678');
  await expect(page.locator('#demo-phone')).toHaveValue('(47) 91234-5678');
  await page.getByRole('button', { name: 'Validar formulário' }).click();
  await expect(page.locator('.dialog.modal-in')).toContainText('Formulário validado');
  await page.locator('.dialog.modal-in .dialog-button').last().click();
  for (const transition of ['cover-v', 'dive', 'fade', 'parallax']) {
    await page.getByRole('button', { name: transition, exact: true }).click();
    await expect(page.locator('.page-current')).toContainText(`Transição ${transition}`);
    await page.getByRole('link', { name: 'Voltar para Hello' }).click();
    await expect(page.locator('.page-current #demo-email')).toHaveValue('teste@example.test');
  }
  await expect(page.locator('#demo-email')).toHaveCSS('outline-style', 'none');
});

test('componentes, ícones, FAB e grid funcionam sem overlays duplicados', async ({ page }) => {
  await open(page);
  await expect(page.getByTestId('lucide-grid').locator('svg')).toHaveCount(20);
  await page.getByText('Como funciona esta fundação?', { exact: true }).click();
  await expect(page.locator('.accordion-item-opened')).toHaveCount(1);
  await page.locator('#demo-city').fill('Blume');
  await page.locator('.autocomplete-dropdown').getByText('Blumenau', { exact: true }).click();
  await expect(page.locator('#demo-city')).toHaveValue('Blumenau');
  await page.locator('#demo-date').click();
  await expect(page.locator('.calendar.sheet-modal.modal-in')).toBeVisible();
  await page.locator('.calendar.modal-in').getByText('Fechar', { exact: true }).click();
  const fab = page.getByRole('button', { name: 'Ações de demonstração' });
  await fab.focus(); await page.keyboard.press('Space');
  await expect(fab).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(fab).toHaveAttribute('aria-expanded', 'false');
  await page.getByRole('button', { name: 'Abrir sheet', exact: true }).click();
  await expect(page.locator('.sheet-modal.modal-in')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Abrir toast' }).click();
  await expect(page.locator('.toast.modal-in')).toHaveCount(1);
  const columns = await page.getByTestId('responsive-grid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length);
  expect(columns).toBe(page.viewportSize().width >= 768 ? 2 : 1);
});
