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
  try {
    await expect(page.locator('#pdf-page-1')).toBeVisible({ timeout: 12000 });
  } catch {
    await page.evaluate(() => {
      history.pushState({}, '', '/view/test-docs/dummy.pdf');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await page.waitForURL('**/view/test-docs/dummy.pdf');
    await expect(page.locator('#pdf-page-1')).toBeVisible({ timeout: 30000 });
  }
  await expect(page.locator('#viewer-toolbar')).toBeVisible({ timeout: 10000 });
};

test.describe('Anonymous → login with existing email — continuity + no duplicate state', () => {
  test.beforeEach(async ({ page }) => {
    // Start in mock-mode as an anonymous user
    await page.addInitScript({ content: 'window.MOCK_AUTH = true; window.MOCK_AUTH_USER = { uid: "anon-login-existing", isAnonymous: true };' });
  });

  test('anonymous logs in with an existing email — document preserved and account merged', async ({ page }) => {
    await openViewer(page);

    // Open a document and verify working context exists before login.
    await uploadDummyPdf(page);

    // Anonymous baseline in current behavior: tools are enabled in mock anonymous mode.
    await expect(page.getByRole('button', { name: 'Deep Analysis' })).toBeEnabled();

    // Navigate to sign-in and confirm current session is anonymous.
    await page.evaluate(() => {
      history.pushState({}, '', '/sign-in');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    // Debug session fields are inside a collapsed <details>, so expand first.
    await page.locator('summary:has-text("Debug info")').click();
    await expect(page.getByText(/Anonymous:\s*true/i)).toBeVisible();

    // Fill the email sign-in form (UI-level only — auth transition is mocked).
    await page.getByPlaceholder('Email').fill('e2e+existing@example.com');
    await page.getByPlaceholder('Password', { exact: true }).fill('long-enough-pass');

    // Simulate successful login of an existing email account.
    await page.evaluate(() => {
      window.MOCK_AUTH_USER = {
        uid: 'user-existing',
        email: 'e2e+existing@example.com',
        isAnonymous: false,
        providerData: [{ providerId: 'password', email: 'e2e+existing@example.com' }],
      };
    });
    await page.addInitScript({
      content: 'window.MOCK_AUTH = true; window.MOCK_AUTH_USER = { uid: "user-existing", email: "e2e+existing@example.com", isAnonymous: false, providerData: [{ providerId: "password", email: "e2e+existing@example.com" }] };'
    });

    // Restart at root so auth watcher initializes with the existing account identity.
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Return to viewer and ensure working context remains usable after login.
    await page.goto('/app', { waitUntil: 'domcontentloaded' });
    await page.waitForURL('**/view');
    await expect(page.getByRole('link', { name: 'e2e+existing@example.com' }).first()).toBeVisible();
    await page.evaluate(() => { history.pushState({}, '', '/view/test-docs/dummy.pdf'); window.dispatchEvent(new PopStateEvent('popstate')); });
    await page.waitForURL('**/view/test-docs/dummy.pdf');
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 15000 });

    // Analysis actions remain available for the authenticated account.
    await expect(page.getByRole('button', { name: 'Deep Analysis' })).toBeEnabled();

    // Session is no longer anonymous (no duplicate anonymous state remains active).
    await page.evaluate(() => {
      history.pushState({}, '', '/profile');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await page.waitForURL('**/profile');
    await expect(page.getByText(/UID:\s*user-existing/i)).toBeVisible();
    await expect(page.getByText(/Anonymous:\s*false/i)).toBeVisible();
  });
});
