import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('DOCX Rendering Test', () => {
  test.beforeEach(async ({ page }) => {
    // Open React app shell; /app redirects to /view in-client
    await page.goto('/app', { waitUntil: 'domcontentloaded' });
    await page.waitForURL('**/view');
    await expect(page.locator('#viewer-root')).toBeVisible({ timeout: 15000 });
  });

  test('should render DOCX properly', async ({ page }) => {
    // Upload the dummy DOCX via the hidden file input
    const fileInput = page.locator('#viewer-root input[type="file"]').first();
    await fileInput.waitFor({ state: 'attached', timeout: 10000 });

    const docxPath = path.join(__dirname, '../public/test-docs/dummy.docx');
    await fileInput.setInputFiles(docxPath);

    // Wait for the main viewer content container to verify basic stability
    await page.waitForTimeout(5000);
    await expect(page.locator('#viewer-content')).toBeVisible({ timeout: 10000 });
  });
});
