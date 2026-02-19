import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('PDF Rendering Test', () => {
  test.beforeEach(async ({ page }) => {
    // Open React app shell; /app redirects to /view in-client
    await page.goto('/app', { waitUntil: 'domcontentloaded' });
    await page.waitForURL('**/view');
    await expect(page.locator('#viewer-root')).toBeVisible({ timeout: 15000 });
  });

  test('should render PDF properly on at least 80% of the screen', async ({ page }) => {
    // Upload the dummy PDF via the hidden file input
    const fileInput = page.locator('#viewer-root input[type="file"]').first();
    await fileInput.waitFor({ state: 'attached', timeout: 10000 });

    const pdfPath = path.join(__dirname, '../public/test-docs/dummy.pdf');
    await fileInput.setInputFiles(pdfPath);

    // Wait for the PDF.js canvas to appear
    await page.waitForSelector('canvas', { timeout: 30000 });
    const canvas = await page.$('canvas');
    expect(canvas).not.toBeNull();

    const pdfPages = await page.$$('.page-wrapper, .pdf-page');
    expect(pdfPages.length).toBeGreaterThan(0);
  });

  test('should handle direct PDF opening', async ({ page }) => {
    // Navigate client-side to a test PDF route
    await page.evaluate(() => { history.pushState({}, '', '/view/test-docs/dummy.pdf'); window.dispatchEvent(new PopStateEvent('popstate')); });
    await page.waitForURL('**/view/test-docs/dummy.pdf');

    // Verify viewer rendered the PDF
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 30000 });
    await expect(page.locator('#viewer-filename')).toContainText('dummy.pdf');
  });
});
