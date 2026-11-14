import { test, expect, open } from './fixtures.js';
test('grid e formulário com fonte e animações estáveis', async ({ page }) => {
  await open(page);
  await expect(page.getByTestId('responsive-grid')).toHaveScreenshot('grid.png', { animations: 'disabled' });
  await expect(page.locator('form')).toHaveScreenshot('form.png', { animations: 'disabled' });
});
