import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dummyPdfPath = path.join(__dirname, '../public/test-docs/dummy.pdf');

test('debug: check click target in PDF page', async ({ page }) => {
  await page.addInitScript({
    content: 'window.MOCK_AUTH = true; window.MOCK_AUTH_USER = { uid: "e2e-debug", email: "e2e@example.com", isAnonymous: false };',
  });
  await page.goto('/app', { waitUntil: 'domcontentloaded' });
  await page.waitForURL('**/view');
  await expect(page.locator('#viewer-root')).toBeVisible({ timeout: 15000 });

  // Upload a PDF file
  const input = page.locator('#viewer-root input[type="file"]').first();
  await input.waitFor({ state: 'attached', timeout: 10000 });
  await input.setInputFiles(dummyPdfPath);

  // Wait for canvas (thumbnail or page)
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 15000 });

  // Wait for REAL page-wrappers (after text extraction finishes)
  console.log('Waiting for page-wrappers...');
  await expect(page.locator('#viewer-scroll-area [data-page-num]').first()).toBeVisible({ timeout: 60000 });
  console.log('Page wrappers found!');

  // Dismiss gate dialog if present
  const gateDialog = page.locator('#viewer-gate-dialog');
  for (let i = 0; i < 5; i++) {
    await page.waitForTimeout(500);
    if (await gateDialog.isVisible().catch(() => false)) {
      console.log('Gate dialog visible (attempt ' + i + '), dismissing...');
      await gateDialog.click();
      await page.waitForTimeout(500);
    }
  }

  // Verify page-wrappers still exist after gate dismissal
  const pwCount = await page.locator('#viewer-scroll-area [data-page-num]').count();
  console.log('Page-wrappers after gate dialog: ' + pwCount);

  // Click date button
  await page.locator('[data-testid="viewer-tool-date"]').click();
  console.log('Date button clicked');

  // Check page-wrappers still there after tool selection
  await page.waitForTimeout(300);
  const pwCount2 = await page.locator('#viewer-scroll-area [data-page-num]').count();
  console.log('Page-wrappers after date click: ' + pwCount2);

  // Check gate dialog again
  const gateVisible = await gateDialog.isVisible().catch(() => false);
  console.log('Gate dialog visible after date click: ' + gateVisible);

  if (pwCount2 === 0) {
    const html = await page.evaluate(() => {
      const sa = document.querySelector('#viewer-scroll-area');
      return sa ? sa.innerHTML.substring(0, 1000) : 'NO SCROLL AREA';
    });
    console.log('Scroll area HTML: ' + html);
  }

  // Get page wrapper box
  const box = await page.evaluate(() => {
    const wrapper = document.querySelector('#viewer-scroll-area [data-page-num]');
    if (!wrapper) return null;
    wrapper.scrollIntoView({ block: 'center' });
    const r = wrapper.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  console.log('Page wrapper box: ' + JSON.stringify(box));

  if (box && box.w > 0) {
    // Install click listener
    await page.evaluate(() => {
      window.__clickLog = [];
      document.querySelector('#viewer-scroll-area').addEventListener('click', (e) => {
        const pw = e.target.closest('[data-page-num]');
        window.__clickLog.push({
          tag: e.target.tagName, id: e.target.id,
          hasPW: !!pw, pageNum: pw ? pw.getAttribute('data-page-num') : null
        });
      }, true);
    });

    await page.waitForTimeout(100);
    const box2 = await page.evaluate(() => {
      const wrapper = document.querySelector('#viewer-scroll-area [data-page-num]');
      const r = wrapper.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    });
    await page.mouse.click(box2.x + box2.w / 2, box2.y + box2.h / 2);
    await page.waitForTimeout(500);

    const log = await page.evaluate(() => window.__clickLog);
    console.log('Click log: ' + JSON.stringify(log));

    const hintVisible = await page.locator('[data-testid="tool-hint-bar"]').isVisible();
    console.log('Hint bar visible after click: ' + hintVisible);

    const annCount = await page.locator('[data-testid^="overlay-annotation-"]').count();
    console.log('Annotations count: ' + annCount);
  }

  expect(true).toBe(true);
});
