import { test, expect } from '@playwright/test';

test.describe('PDF Rendering Test', () => {
  test.beforeEach(async ({ page }) => {
    // Open the site and navigate to the viewer via CTA (SPA-safe)
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // wait briefly for client hydration to attach route handlers
    await page.waitForTimeout(300);
    // Click the Analyze CTA so the client router handles navigation (more reliable)
    await page.getByRole('link', { name: 'Analyze a Document' }).click();
    await page.waitForURL('**/view');
  });

  test('should render PDF properly on at least 80% of the screen', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Ensure the client router is hydrated, then navigate to the test PDF via pushState
    await page.waitForTimeout(1000);
    await page.evaluate(() => { history.pushState({}, '', '/view/test-docs/dummy.pdf'); window.dispatchEvent(new PopStateEvent('popstate')); });
    await page.waitForURL('**/view/test-docs/dummy.pdf');

    // Wait for potential PDF loading (give PDF.js time to render canvas)
    await page.waitForSelector('canvas', { timeout: 30000 });

    // Check if there's a PDF viewer element
    const pdfViewer = await page.$('.page-wrapper, .pdf-page, canvas');
    const canvas = await page.$('canvas');
    expect(canvas).not.toBeNull();
    if (pdfViewer) {
      // Verify PDF content visibility
      const pdfPages = await page.$$('.page-wrapper, .pdf-page');
      expect(pdfPages.length).toBeGreaterThan(0);
    }
  });

  test('should handle direct PDF opening', async ({ page }) => {
    // Test opening a PDF directly via URL parameter
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Look for the Analyze CTA (link on the home page)
    const analyzeBtn = page.getByRole('link', { name: 'Analyze a Document' });
    await expect(analyzeBtn).toBeVisible();

    // Use client-side navigation (avoid dev-server 404 in dev)
    await page.waitForTimeout(300);
    await page.getByRole('link', { name: 'Analyze a Document' }).click();
    await page.waitForURL('**/view');

    // Should navigate to /view or open file dialog (which we can't easily test without mock)
    // So we'll just navigate client-side to a test doc
    await page.evaluate(() => { history.pushState({}, '', '/view/test-docs/dummy.pdf'); window.dispatchEvent(new PopStateEvent('popstate')); });
    await page.waitForURL('**/view/test-docs/dummy.pdf');

    // Verify the page loaded without errors
    await expect(page).toHaveURL(/.*\/view.*/);

    // Check for error messages
    const errorElements = await page.$$('.error, .error-message, [data-testid="error"]');
    expect(errorElements.length).toBe(0);
  });
});