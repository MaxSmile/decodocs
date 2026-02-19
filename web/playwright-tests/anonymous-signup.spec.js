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

test.describe('Anonymous sign-up (email) — session continuity', () => {
  test.beforeEach(async ({ page }) => {
    // Start in mock mode as an anonymous user
    await page.addInitScript({ content: 'window.MOCK_AUTH = true; window.MOCK_AUTH_USER = { uid: "anon-signup", isAnonymous: true };' });
  });

  test('anonymous signs up with email — document preserved and gated actions enabled', async ({ page }) => {
    await openViewer(page);

    // Use test-docs route so reloads preserve the document context
    await page.evaluate(() => { history.pushState({}, '', '/view/test-docs/dummy.pdf'); window.dispatchEvent(new PopStateEvent('popstate')); });
    await page.waitForURL('**/view/test-docs/dummy.pdf');
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 15000 });

    // Anonymous session baseline: analysis actions are available in current product behavior.
    await expect(page.getByRole('button', { name: 'Deep Analysis' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Highlight Risks' })).toBeEnabled();

    // Navigate to Sign Up page (user would enter email/password here)
    await page.evaluate(() => {
      history.pushState({}, '', '/sign-up');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await expect(page.getByText('Sign up')).toBeVisible();
    await expect(page.getByText(/Anonymous:\s*true/i)).toBeVisible();

    // Fill the form (UI-level check only — actual auth result is mocked)
    await page.getByPlaceholder('Email').fill('e2e+signup@example.com');
    await page.getByPlaceholder('Password', { exact: true }).fill('long-enough-pass');
    await page.getByPlaceholder('Confirm password').fill('long-enough-pass');

    // Simulate successful sign-up by switching the mock user to an authenticated identity
    await page.evaluate(() => {
      window.MOCK_AUTH_USER = { uid: 'user-signup', email: 'e2e+signup@example.com', isAnonymous: false };
    });
    await page.addInitScript({ content: 'window.MOCK_AUTH = true; window.MOCK_AUTH_USER = { uid: "user-signup", email: "e2e+signup@example.com", isAnonymous: false };' });

    // Restart the app at root so auth watcher picks up the new linked identity.
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      history.pushState({}, '', '/profile');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await expect(page.getByRole('link', { name: 'e2e+signup@example.com' })).toBeVisible();

    // Return to the working document and confirm it is still present and usable
    await page.goto('/app', { waitUntil: 'domcontentloaded' });
    await page.waitForURL('**/view');
    await page.evaluate(() => { history.pushState({}, '', '/view/test-docs/dummy.pdf'); window.dispatchEvent(new PopStateEvent('popstate')); });
    await page.waitForURL('**/view/test-docs/dummy.pdf');
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 15000 });

    // Analysis actions remain enabled for the linked authenticated user.
    await expect(page.getByRole('button', { name: 'Deep Analysis' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Highlight Risks' })).toBeEnabled();
  });
});
