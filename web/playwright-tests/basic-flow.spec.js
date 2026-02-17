import { test, expect } from '@playwright/test';

test.describe('DecoDocs Application Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Test on localhost dev server
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('should display new homepage with correct content', async ({ page }) => {
    // Verify we're on the home page with new content
    await expect(page.locator('h1')).toContainText('Decode documents before you sign.');

    // Verify the main CTA link exists (use role-based selector)
    const openPdfButton = page.getByRole('link', { name: 'Analyze a Document' });
    await expect(openPdfButton).toBeVisible();

    // Verify secondary CTA exists
    const viewDemoButton = page.locator('a', { hasText: 'View Demo' });
    await expect(viewDemoButton).toBeVisible();
  });

  test('should have correct navigation elements', async ({ page }) => {
    // Check for navigation elements in the header
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();
  });

  test('should display pricing tiers', async ({ page }) => {
    // Navigate to pricing via client-side routing (dev server returns 404 for direct /pricing)
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // wait briefly for client hydration to attach route handlers
    await page.waitForTimeout(300);
    // Click the Pricing link in the footer (always visible) so client-side routing is used
    await page.locator('footer').getByRole('link', { name: 'Pricing' }).click();
    await page.waitForURL('**/pricing');

    // Check the pricing section exists
    await expect(page.locator('h1', { hasText: 'Pricing' })).toBeVisible({ timeout: 10000 });

    // Check for Starter tier
    await expect(page.locator('div', { hasText: 'Starter' }).first()).toBeVisible();

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
    await expect(footer.locator('a:has-text("Privacy")')).toBeVisible();
    await expect(footer.locator('a:has-text("Terms")')).toBeVisible();
  });
});

test.describe('Document Viewer Tests', () => {
  test('should navigate to document viewer route', async ({ page }) => {
    // Navigate via the main CTA to ensure SPA routing works in dev
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: 'Analyze a Document' }).click();
    await page.waitForURL('**/view');

    // Wait for file input and check viewer UI
    await page.waitForSelector('input[type="file"]', { timeout: 15000 });
    await expect(page.locator('text=Upload a PDF')).toBeVisible();
  });
});

test.describe('Document Editor Tests', () => {
  test('should navigate to document editor route', async ({ page }) => {
    // Navigate to the editor page via SPA navigation to avoid dev-server 404
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    // Use a known test-docs editor route so the editor UI is rendered
    await page.evaluate(() => { history.pushState({}, '', '/edit/test-docs/offer.pdf'); window.dispatchEvent(new PopStateEvent('popstate')); });
    await page.waitForURL('**/edit/test-docs/offer.pdf');

    // Wait for potential loading
    await page.waitForTimeout(1000);

    // Check if editing tools section exists
    await expect(page.locator('h4', { hasText: 'Editor Controls' })).toBeVisible();
  });
});
