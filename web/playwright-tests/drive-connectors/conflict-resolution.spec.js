import path from 'path';
import { fileURLToPath } from 'url';
import { test, expect } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Drive connectors — conflict resolution', () => {
  test('cloud upload conflict surfaces error gate (HTTP 409)', async ({ page }) => {
    // Arrange: authenticated user and mocked upload callable returning presigned URL
    await page.addInitScript({
      content: `window.MOCK_AUTH = true; window.MOCK_AUTH_USER = { uid: 'conflict-user', isAnonymous: false }; window.MOCK_STORAGE_CALLABLES = { storageCreateUploadUrl: async () => ({ url: 'https://upload.mock.local/documents/conflict.pdf', key: 'documents/conflict.pdf' }) };`,
    });

    // Intercept presigned PUT and return 409 to simulate remote conflict
    await page.route('https://upload.mock.local/**', async (route) => {
      await route.fulfill({ status: 409, body: 'Conflict' });
    });

    await page.goto('/app', { waitUntil: 'domcontentloaded' });

    // Upload local test PDF
    const input = page.locator('#viewer-root input[type="file"]').first();
    await input.setInputFiles(path.join(__dirname, '../../public/test-docs/dummy.pdf'));
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 30000 });

    // Trigger save to DecoDocs (upload flow should attempt PUT and receive 409)
    await page.locator('#btn-save-decodocs').click();

    const dialog = page.locator('#viewer-gate-dialog');
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await expect(dialog).toContainText('Cloud upload failed');
  });
});
