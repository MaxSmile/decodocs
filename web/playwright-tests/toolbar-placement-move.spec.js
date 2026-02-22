import { test, expect } from '@playwright/test';

/*
  SMOKE tests for tool placement + move (viewer + editor).
  These are lightweight e2e checks that should run in CI and locally.
*/

const openViewer = async (page) => {
  await page.goto('/app', { waitUntil: 'domcontentloaded' });
  await page.waitForURL('**/view');
  await expect(page.locator('#viewer-root')).toBeVisible({ timeout: 15000 });
};

const uploadDummyPdf = async (page) => {
  const input = page.locator('#viewer-root input[type="file"]').first();
  await input.waitFor({ state: 'attached', timeout: 10000 });
  await input.setInputFiles(new URL('../public/test-docs/dummy.pdf', import.meta.url).pathname);
  await expect(page.locator('#viewer-scroll-area [data-page-num]').first()).toBeVisible({ timeout: 30000 });
  // Dismiss any dialogs that may block the canvas area.
  const gateDialog = page.locator('#viewer-gate-dialog');
  if (await gateDialog.isVisible({ timeout: 750 }).catch(() => false)) {
    const ok = gateDialog.getByRole('button', { name: /^ok$/i });
    if (await ok.isVisible({ timeout: 750 }).catch(() => false)) {
      await ok.click();
    } else {
      await gateDialog.locator('button').first().click();
    }
    await expect(gateDialog).toBeHidden({ timeout: 5000 });
  }
  await expect(page.locator('#viewer-toolbar')).toBeVisible({ timeout: 15000 });
};

test.describe('SMOKE: Tools placement & move', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript({ content: 'window.MOCK_AUTH = true; window.MOCK_AUTH_USER = { uid: "e2e-smoke", email: "e2e+smoke@example.com", isAnonymous: false };' });
  });

  test('SMOKE-01: viewer — place Date and drag to reposition', async ({ page }) => {
    test.fixme(true, 'Dragging overlay annotations is currently flaky in Playwright; tracked separately.');
    await openViewer(page);
    await uploadDummyPdf(page);

    await page.locator('[data-testid="viewer-tool-date"]').click();
    await expect(page.locator('[data-testid="tool-hint-bar"]')).toBeVisible();

    const wrapperBox = await page.evaluate(() => {
      const target =
        document.querySelector('#pdf-page-1 canvas')
        || document.getElementById('pdf-page-1')
        || document.querySelector('#viewer-scroll-area [data-page-num]');
      if (!target) return null;
      target.scrollIntoView({ block: 'center' });
      const r = target.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    });
    if (!wrapperBox) throw new Error('PDF surface not found');

    await page.waitForTimeout(100);
    const wrapperBox2 = await page.evaluate(() => {
      const target =
        document.querySelector('#pdf-page-1 canvas')
        || document.getElementById('pdf-page-1')
        || document.querySelector('#viewer-scroll-area [data-page-num]');
      if (!target) return null;
      const r = target.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    });
    if (!wrapperBox2) throw new Error('PDF surface not found (after scroll)');
    await page.mouse.click(wrapperBox2.x + wrapperBox2.w / 2, wrapperBox2.y + wrapperBox2.h / 2);

    const ann = page.locator('[data-testid^="overlay-annotation-"]').first();
    await expect(ann).toBeVisible({ timeout: 5000 });
    const b1 = await ann.boundingBox();
    await page.mouse.move(b1.x + b1.width / 2, b1.y + b1.height / 2);
    await page.mouse.down();
    await page.mouse.move(b1.x + b1.width / 2 + 60, b1.y + b1.height / 2 + 30, { steps: 6 });
    await page.mouse.up();
    // Poll for React state to flush after mousemove events
    await expect.poll(async () => (await ann.boundingBox()).x, { timeout: 5000 }).toBeGreaterThan(b1.x + 10);
  });

  test('SMOKE-02: editor — place Date and drag to reposition', async ({ page }) => {
    test.fixme(true, 'Dragging overlay annotations is currently flaky in Playwright; tracked separately.');
    await page.addInitScript({ content: 'window.MOCK_AUTH = true; window.MOCK_AUTH_USER = { uid: "e2e-editor-smoke", email: "e2e+editor-smoke@example.com", isAnonymous: false };' });
    await page.goto('/app', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => { history.pushState({}, '', '/edit/test-docs/dummy.pdf'); window.dispatchEvent(new PopStateEvent('popstate')); });
    await page.waitForURL('**/edit/test-docs/dummy.pdf');

    // wait for editor toolbar to render
    await page.locator('[data-testid="editor-tool-select"]').waitFor({ state: 'visible', timeout: 10000 });
    const dateBtn = page.locator('[data-testid="editor-tool-date"]');
    if ((await dateBtn.count()) === 0) test.skip(true, 'Editor toolbar does not expose Date tool in this build');

    await dateBtn.click();
    // wait for PDF page to render and measure its bounding box
    await page.waitForSelector('#pdf-page-1, #viewer-scroll-area [data-page-num], canvas', { timeout: 15000 });
    const wrapperBox = await page.evaluate(() => {
      const target =
        document.querySelector('#pdf-page-1 canvas')
        || document.getElementById('pdf-page-1')
        || document.querySelector('canvas');
      if (!target) return null;
      target.scrollIntoView({ block: 'center' });
      const r = target.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    });
    if (!wrapperBox) throw new Error('PDF page wrapper not found in editor route');

    await page.mouse.click(wrapperBox.x + wrapperBox.w / 2, wrapperBox.y + wrapperBox.h / 2);
    const ann = page.locator('[data-testid^="overlay-annotation-"]').first();
    await expect(ann).toBeVisible({ timeout: 5000 });
    const b1 = await ann.boundingBox();
    await page.mouse.move(b1.x + b1.width / 2, b1.y + b1.height / 2);
    await page.mouse.down();
    await page.mouse.move(b1.x + b1.width / 2 + 50, b1.y + b1.height / 2 + 30, { steps: 6 });
    await page.mouse.up();
    // Poll for React state to flush after mousemove events
    await expect.poll(async () => (await ann.boundingBox()).x, { timeout: 5000 }).toBeGreaterThan(b1.x + 5);
  });
});
