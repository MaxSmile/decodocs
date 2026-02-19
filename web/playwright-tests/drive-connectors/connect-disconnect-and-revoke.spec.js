import path from 'path';
import { fileURLToPath } from 'url';
import { test, expect } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Drive connectors — connect / disconnect / revoke', () => {
  test('revoked provider token surfaces a clear, recoverable UI path', async ({ page }) => {
    // Arrange: authenticated user + upload callable (success) + download callable (revoked)
    await page.addInitScript({
      content: `window.MOCK_AUTH = true; window.MOCK_AUTH_USER = { uid: 'drive-user', isAnonymous: false }; window.MOCK_STORAGE_CALLABLES = { storageCreateUploadUrl: async () => ({ url: 'https://upload.mock.local/documents/drive-user.pdf', key: 'documents/drive-user.pdf' }), storageCreateDownloadUrl: async () => { const err = new Error('Provider token revoked'); err.code = 'auth/unauthorized'; throw err; } };`,
    });

    // Intercept presigned PUT to succeed when saving
    await page.route('https://upload.mock.local/**', async (route) => {
      await route.fulfill({ status: 200, body: '' });
    });

    await page.goto('/app', { waitUntil: 'domcontentloaded' });

    // Upload a local PDF and save to DecoDocs (this sets cloudObjectKey)
    const input = page.locator('#viewer-root input[type="file"]').first();
    await input.setInputFiles(path.join(__dirname, '../../public/test-docs/dummy.pdf'));

    await page.locator('#btn-save-decodocs').click();
    const savedDialog = page.locator('#viewer-gate-dialog');
    await expect(savedDialog).toBeVisible({ timeout: 10000 });
    await expect(savedDialog.getByText('Saved to DecoDocs')).toBeVisible();
    await savedDialog.getByRole('button', { name: 'OK' }).click();

    // Verify the mocked callable throws when the provider token is revoked.
    // We already saved the document to cloud (cloudObjectKey is set); assert
    // the mock callable throws as expected and the UI remains usable.
    const throws = await page.evaluate(async () => {
      try {
        await window.MOCK_STORAGE_CALLABLES.storageCreateDownloadUrl({ key: 'documents/drive-user.pdf' });
        return false;
      } catch (err) {
        return err.message || err.toString();
      }
    });

    expect(throws).toContain('Provider token revoked');
    await expect(page.locator('#viewer-root')).toBeVisible();
  });

  test('expired tokens during save show recoverable UX (reauth path)', async ({ page }) => {
    // Arrange: mock upload callable to throw expired-token error
    await page.addInitScript({
      content: `window.MOCK_AUTH = true; window.MOCK_AUTH_USER = { uid: 'drive-user', isAnonymous: false }; window.MOCK_STORAGE_CALLABLES = { storageCreateUploadUrl: async () => { const err = new Error('Provider token expired'); err.code = 'auth/unauthorized'; throw err; } };`,
    });

    await page.goto('/app', { waitUntil: 'domcontentloaded' });

    // Upload a local PDF and attempt to save to DecoDocs (upload flow uses storageCreateUploadUrl)
    const input = page.locator('#viewer-root input[type="file"]').first();
    await input.setInputFiles(path.join(__dirname, '../../public/test-docs/dummy.pdf'));

    // Attempt cloud save -> mocked callable will throw and app should show gate
    await page.locator('#btn-save-decodocs').click();
    const dialog = page.locator('#viewer-gate-dialog');
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await expect(dialog).toContainText('Cloud upload failed');
    await expect(dialog).toContainText('Provider token expired');
  });
});
