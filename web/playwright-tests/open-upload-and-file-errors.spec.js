import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dummyPdfPath = path.join(__dirname, '../public/test-docs/dummy.pdf');
const unsupportedPath = path.join(__dirname, 'fixtures/unsupported.txt');
const corruptPdfPath = path.join(__dirname, 'fixtures/corrupt.pdf');

const openViewer = async (page) => {
  await page.goto('/app', { waitUntil: 'domcontentloaded' });
  await page.waitForURL('**/view');
  await expect(page.locator('#viewer-root')).toBeVisible({ timeout: 15000 });
};

const fileInput = (page) => page.locator('#viewer-root input[type="file"]').first();

const uploadFile = async (page, absolutePath) => {
  const input = fileInput(page);
  await input.waitFor({ state: 'attached', timeout: 10000 });
  await input.setInputFiles(absolutePath);
};

const uploadDummyPdf = async (page) => {
  await uploadFile(page, dummyPdfPath);
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 30000 });
  await expect(page.locator('#viewer-toolbar')).toBeVisible({ timeout: 10000 });
};

test.describe('Open-only + explicit upload + file error recovery', () => {
  test('anonymous users stay open-only (no automatic cloud upload)', async ({ page }) => {
    await page.addInitScript({
      content: 'window.MOCK_AUTH = true; window.MOCK_AUTH_USER = { uid: "anon-open-only", isAnonymous: true };',
    });

    await openViewer(page);
    await uploadDummyPdf(page);

    await expect(page.locator('#viewer-filename')).toContainText('dummy.pdf');
    await expect(page).toHaveURL(/\/view(?!\/test-docs).*/);

    await page.locator('#btn-save-decodocs').click();

    await expect(page.locator('canvas').first()).toBeVisible();
    await expect(page.locator('#viewer-gate-dialog')).toBeHidden();
    await expect(page.locator('text=Saved to DecoDocs')).not.toBeVisible();
  });

  test('authenticated non-Pro users get explicit upgrade transition when they choose upload', async ({ page }) => {
    await page.addInitScript({
      content: `
        window.MOCK_AUTH = true;
        window.MOCK_AUTH_USER = { uid: "free-upload-user", email: "free@example.com", isAnonymous: false };
        window.MOCK_STORAGE_CALLABLES = {
          storageCreateUploadUrl: async () => {
            const err = new Error("Cloud storage is available for Pro plans. Upgrade to continue.");
            err.code = "functions/permission-denied";
            throw err;
          }
        };
      `,
    });

    await openViewer(page);
    await uploadDummyPdf(page);

    await page.locator('#btn-save-decodocs').click();

    const dialog = page.locator('#viewer-gate-dialog');
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await expect(dialog.getByText('Pro required')).toBeVisible();
    await expect(dialog.getByText('Cloud storage is available for Pro plans. Upgrade to continue.')).toBeVisible();

    await dialog.getByRole('button', { name: 'View plans' }).click();
    await expect(page).toHaveURL(/\/pricing/);
  });

  test('paid users can explicitly choose upload and stay in the viewer context', async ({ page }) => {
    await page.addInitScript({
      content: `
        window.MOCK_AUTH = true;
        window.MOCK_AUTH_USER = { uid: "pro-upload-user", email: "pro@example.com", isAnonymous: false };
        window.MOCK_STORAGE_CALLABLES = {
          storageCreateUploadUrl: async () => ({
            url: "https://upload.mock.local/presigned/documents/pro-upload-user.pdf",
            key: "documents/pro-upload-user.pdf"
          })
        };
      `,
    });

    await page.route('https://upload.mock.local/**', async (route) => {
      await route.fulfill({ status: 200, body: '' });
    });

    await openViewer(page);
    await uploadDummyPdf(page);

    await page.locator('#btn-save-decodocs').click();

    const dialog = page.locator('#viewer-gate-dialog');
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await expect(dialog.getByText('Saved to DecoDocs')).toBeVisible();
    await expect(dialog.getByText('documents/pro-upload-user.pdf')).toBeVisible();

    await dialog.getByRole('button', { name: 'OK' }).click();
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/\/view/);
    await expect(page.locator('canvas').first()).toBeVisible();
  });

  test('unsupported and corrupted files show friendly errors with retry path', async ({ page }) => {
    await page.addInitScript({
      content: 'window.MOCK_AUTH = true; window.MOCK_AUTH_USER = { uid: "anon-file-errors", isAnonymous: true };',
    });

    await openViewer(page);

    await uploadFile(page, unsupportedPath);
    await expect(page.locator('#viewer-gate-dialog')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Unsupported or invalid file')).toBeVisible();
    await expect(page.getByText('Unsupported file type')).toBeVisible();
    await page.getByRole('button', { name: 'OK' }).click();

    await uploadDummyPdf(page);

    await page.locator('#btn-finish').click();

    await uploadFile(page, corruptPdfPath);
    await expect(page.locator('#viewer-gate-dialog')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Could not load PDF')).toBeVisible();
    await page.getByRole('button', { name: 'OK' }).click();

    await uploadDummyPdf(page);
  });
});
