import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dummyPdfPath = path.join(__dirname, '../public/test-docs/dummy.pdf');

const openViewer = async (page) => {
  await page.goto('/app', { waitUntil: 'domcontentloaded' });
  await page.waitForURL('**/view');
  await expect(page.locator('#viewer-root')).toBeVisible({ timeout: 15000 });
};

const uploadDummyPdf = async (page) => {
  const input = page.locator('#viewer-root input[type="file"]').first();
  await input.waitFor({ state: 'attached', timeout: 10000 });
  await input.setInputFiles(dummyPdfPath);
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 30000 });
  await expect(page.locator('#viewer-toolbar')).toBeVisible({ timeout: 10000 });
};

test.describe('Scanned / large PDF gating (Pro required) — E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Run in mock auth mode (anonymous) so analyzeText is mocked reliably
    await page.addInitScript({ content: 'window.MOCK_AUTH = true; window.MOCK_AUTH_USER = { uid: "scan-pro", isAnonymous: true };' });
  });

  test('scanned PDF triggers Pro gate with CTA and preserves document context', async ({ page }) => {
    await openViewer(page);
    await uploadDummyPdf(page);

    // Mock analyzeText to return SCAN_DETECTED_PRO_REQUIRED
    await page.route('**/analyzeText', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: false, code: 'SCAN_DETECTED_PRO_REQUIRED', message: 'This PDF appears to be scanned. OCR is available on Pro.' }),
      });
    });

    // Trigger analysis action that calls analyzeText in mock mode
    const summarizeBtn = page.getByRole('button', { name: 'Summarize Key Points' });
    await expect(summarizeBtn).toBeEnabled();
    await summarizeBtn.click();

    // Gate dialog should appear with clear title/message and Upgrade CTA.
    const dialog = page.locator('#viewer-gate-dialog');
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await expect(dialog.getByText('Scanned PDF (OCR requires Pro)', { exact: true })).toBeVisible();
    await expect(dialog.getByText('This PDF appears to be scanned. OCR is available on Pro.', { exact: false })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Upgrade to Pro' })).toBeVisible();

    // Document context must be preserved (viewer + canvas still visible)
    await expect(page.locator('#viewer-root')).toBeVisible();
    await expect(page.locator('canvas').first()).toBeVisible();
    await expect(page.locator('#viewer-toolbar')).toBeVisible();

    // Close gate (Cancel) and confirm document still present and no navigation
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator('#viewer-root')).toBeVisible();
    await expect(page.locator('canvas').first()).toBeVisible();
  });
});
