import { test, expect } from '@playwright/test';

const openReactApp = async (page) => {
  await page.goto('/app', { waitUntil: 'domcontentloaded' });
  await page.waitForURL('**/view');
  await expect(page.locator('#viewer-root')).toBeVisible({ timeout: 15000 });
};

test.describe('DecoDocs Application Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Test on localhost dev server
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('should display new homepage with correct content', async ({ page }) => {
    // Verify we're on the home page with new content
    await expect(page.locator('#hero h1')).toContainText('Decode documents');

    // Verify the main CTA link exists (use role-based selector)
    const openPdfButton = page.getByRole('link', { name: 'Analyze a Document' });
    await expect(openPdfButton).toBeVisible();

    // Verify secondary CTA exists
    const openEditorButton = page.locator('a', { hasText: 'Open Editor' });
    await expect(openEditorButton).toBeVisible();
  });

  test('should have correct navigation elements', async ({ page }) => {
    // Check for navigation elements in the header
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();
  });

  test('should display pricing tiers', async ({ page }) => {
    // Open the React app shell first, then route to pricing in-app
    await openReactApp(page);
    await page.evaluate(() => {
      history.pushState({}, '', '/pricing');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await page.waitForURL('**/pricing');

    // Check the pricing section exists
    await expect(page.getByRole('heading', { name: 'Pricing' })).toBeVisible({ timeout: 10000 });

    // Check for current plan tiers
    await expect(page.locator('div', { hasText: 'Free' }).first()).toBeVisible();

    // Check for Pro tier
    await expect(page.locator('div', { hasText: 'Pro' }).first()).toBeVisible();

    // Check for Business tier
    await expect(page.locator('div', { hasText: 'Business' }).first()).toBeVisible();
  });

  test('should have proper footer with legal information', async ({ page }) => {
    // Check footer has company section with About link
    const footer = page.locator('footer');
    await expect(footer).toContainText('DecoDocs');
    await expect(footer.locator('a:has-text("About")')).toBeVisible();

    // Check legal links are present instead of vendor-specific copy
    await expect(footer.getByRole('link', { name: 'Privacy' }).first()).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Terms' }).first()).toBeVisible();
  });
});

test.describe('Document Viewer Tests', () => {
  test('should navigate to document viewer route', async ({ page }) => {
    await openReactApp(page);

    // Wait for viewer shell and hidden file input to mount
    await page.locator('#viewer-root input[type="file"]').first().waitFor({ state: 'attached', timeout: 10000 });
    await expect(page.locator('text=Upload a PDF')).toBeVisible();
  });
});

test.describe('Document Editor Tests', () => {
  test('should navigate to document editor route', async ({ page }) => {
    // Enable mock auth so PrivateRoute allows editor access
    await page.addInitScript({ content: 'window.MOCK_AUTH = true; window.MOCK_AUTH_USER = { email: "test@example.com" };' });

    // Bootstrap React app, then route to editor
    await page.goto('/app', { waitUntil: 'domcontentloaded' });
    await page.waitForURL('**/view');
    // Use a known test-docs editor route so the editor UI is rendered
    await page.evaluate(() => { history.pushState({}, '', '/edit/test-docs/offer.pdf'); window.dispatchEvent(new PopStateEvent('popstate')); });
    await page.waitForURL('**/edit/test-docs/offer.pdf');

    // Wait for potential loading
    await page.waitForTimeout(1000);

    // Check editor shell actions
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Download' })).toBeVisible();

    // Editor should either render PDF canvas or show upload dropzone while loading
    await expect(
      page.locator('canvas').first().or(page.getByText('Upload a PDF or .snapsign file'))
    ).toBeVisible({ timeout: 15000 });
  });
});
