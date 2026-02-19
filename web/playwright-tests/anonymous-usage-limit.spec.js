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

test.describe('Anonymous usage limit (gating) — E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Mock an authenticated anonymous user so isMockMode analysis path runs
    await page.addInitScript({ content: 'window.MOCK_AUTH = true; window.MOCK_AUTH_USER = { uid: "anon-limit", isAnonymous: true };' });
  });

  test('anonymous usage limit reached shows gate + upgrade/sign-in CTA', async ({ page }) => {
    await openViewer(page);
    await uploadDummyPdf(page);

    // Mock analyzeText to return ANON_TOKEN_LIMIT
    await page.route('**/analyzeText', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: false, code: 'ANON_TOKEN_LIMIT', message: 'Anonymous token limit reached. Create a free account to continue.' }),
      });
    });

    // Trigger an analysis action (Summarize Key Points uses analyzeText in mock mode)
    const summarizeBtn = page.getByRole('button', { name: 'Summarize Key Points' });
    await expect(summarizeBtn).toBeEnabled();
    await summarizeBtn.click();

    // Gate dialog should appear with appropriate title/message and CTA.
    const dialog = page.locator('#viewer-gate-dialog');
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await expect(dialog.getByText('Limit reached', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Anonymous token limit reached', { exact: false })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Create free account' })).toBeVisible();
  });
});
