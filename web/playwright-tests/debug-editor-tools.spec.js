import { test } from '@playwright/test';

test('debug: list editor toolbar buttons', async ({ page }) => {
  await page.goto('/app');
  await page.evaluate(() => { history.pushState({}, '', '/edit/test-docs/dummy.pdf'); window.dispatchEvent(new PopStateEvent('popstate')); });
  await page.waitForURL('**/edit/test-docs/dummy.pdf');
  // wait for editor toolbar to appear
  await page.locator('[data-testid="editor-tool-select"]').waitFor({ state: 'visible', timeout: 10000 });
  const ids = await page.evaluate(() => Array.from(document.querySelectorAll('[data-testid^="editor-tool-"]')).map((el) => el.getAttribute('data-testid')));
  console.log('editor tool ids =>', ids);
});