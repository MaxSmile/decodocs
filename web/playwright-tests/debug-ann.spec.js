import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dummyPdfPath = path.join(__dirname, '../public/test-docs/dummy.pdf');

test('debug annotation click', async ({ page }) => {
  await page.addInitScript({ content: 'window.MOCK_AUTH = true;' });
  await page.goto('/app', { waitUntil: 'domcontentloaded' });
  await page.waitForURL('**/view');
  await expect(page.locator('#viewer-root')).toBeVisible({ timeout: 15000 });

  const input = page.locator('#viewer-root input[type="file"]').first();
  await input.waitFor({ state: 'attached', timeout: 10000 });
  await input.setInputFiles(dummyPdfPath);
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 30000 });
  await expect(page.locator('#viewer-toolbar')).toBeVisible({ timeout: 10000 });

  // Click Date tool
  await page.locator('[data-testid="viewer-tool-date"]').click();
  await page.waitForTimeout(500);

  // Get canvas info
  const canvas = page.locator('canvas').first();
  const box = await canvas.boundingBox();
  console.log('Canvas bounding box:', JSON.stringify(box));

  // Check what element is at the click position
  const clickX = box.x + 100;
  const clickY = box.y + 100;

  const elementInfo = await page.evaluate(({ x, y }) => {
    const el = document.elementFromPoint(x, y);
    if (!el) return { tag: 'null' };
    const closest = el.closest('[data-page-num]');
    const chain = [];
    let node = el;
    while (node && chain.length < 8) {
      chain.push({
        tag: node.tagName,
        cls: (node.className || '').toString().substring(0, 60),
        id: node.id || undefined,
      });
      node = node.parentElement;
    }
    return {
      tag: el.tagName,
      closestPageNum: closest ? closest.getAttribute('data-page-num') : null,
      parentChain: chain,
    };
  }, { x: clickX, y: clickY });

  console.log('Element at click point:', JSON.stringify(elementInfo, null, 2));

  // Also check total number of page-wrappers and data-page-num elements
  const pageWrapperCount = await page.locator('[data-page-num]').count();
  const canvasCount = await page.locator('canvas').count();
  console.log('Page wrappers:', pageWrapperCount, 'Canvases:', canvasCount);
});
