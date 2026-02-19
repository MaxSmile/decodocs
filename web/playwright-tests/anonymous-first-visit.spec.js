import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dummyPdfPath = path.join(__dirname, '../public/test-docs/dummy.pdf');

test.describe('Auth — Anonymous first-visit happy path', () => {
  test.beforeEach(async ({ page }) => {
    // Use mock auth in signed-out mode to verify auth prompt visibility.
    await page.addInitScript({ content: 'window.MOCK_AUTH = true; window.MOCK_AUTH_USER = null;' });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('landing → app/view entry → auth prompt visible', async ({ page }) => {
    // Landing content
    await expect(page.locator('#hero h1')).toContainText('Decode documents');
    // Enter app via stable route that resolves in preview mode.
    await page.goto('/app', { waitUntil: 'domcontentloaded' });
    await page.waitForURL('**/view');
    await expect(page.locator('#viewer-root')).toBeVisible({ timeout: 15000 });

    // Viewer initial state: upload prompt is visible.
    await expect(page.getByText('Upload a PDF or .snapsign file')).toBeVisible();

    // Upload a known PDF so auth-gating prompt appears in the tools panel.
    const input = page.locator('#viewer-root input[type="file"]').first();
    await input.waitFor({ state: 'attached', timeout: 10000 });
    await input.setInputFiles(dummyPdfPath);
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 15000 });

    const viewerContent = page.locator('#viewer-content');
    await expect(viewerContent.getByText('Why are buttons disabled?')).toBeVisible();
    await expect(viewerContent.getByText('Sign in to enable AI analysis (Free)', { exact: false })).toBeVisible();
    await expect(page.getByRole('link', { name: /sign in/i }).first()).toBeVisible();

    // Protected actions remain disabled for signed-out visitors.
    await expect(page.getByRole('button', { name: 'Deep Analysis' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Highlight Risks' })).toBeDisabled();
  });
});
