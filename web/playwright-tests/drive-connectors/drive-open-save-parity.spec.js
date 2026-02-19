import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dummyPdfPath = path.join(__dirname, '../public/test-docs/dummy.pdf');

test.describe('Drive connectors — open/save parity', () => {
  test('open from provider -> viewer loads and download (local save) works', async ({ page }) => {
    // Provide authenticated user and a small helper to simulate "Open from Drive"
    await page.addInitScript({
      content: `window.MOCK_AUTH = true; window.MOCK_AUTH_USER = { uid: 'drive-user', isAnonymous: false };`,
    });

    // Spy on URL.createObjectURL so we can assert a download was triggered
    await page.addInitScript({
      content: `window.__createdUrls = []; const _orig = URL.createObjectURL; URL.createObjectURL = function(b){ const u = _orig.call(this,b); window.__createdUrls.push(u); return u; };`,
    });

    // Instead of a DrivePicker (not implemented yet), reuse the file input to
    // simulate the user selecting the provider file (test fixture).
    await page.goto('/app', { waitUntil: 'domcontentloaded' });

    const input = page.locator('#viewer-root input[type="file"]').first();
    await input.setInputFiles(path.join(__dirname, '../../public/test-docs/dummy.pdf'));

    // Viewer should load the PDF
    await expect(page.locator('#viewer-root')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#viewer-filename')).toContainText('dummy.pdf');
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 30000 });

    // Use existing download button as a proxy for "save" behavior
    await page.locator('#btn-download').click();
    const created = await page.evaluate(() => window.__createdUrls || []);
    expect(created.length).toBeGreaterThan(0);

    // Viewer remains usable after the action
    await expect(page.locator('#viewer-root')).toBeVisible();
  });
});
