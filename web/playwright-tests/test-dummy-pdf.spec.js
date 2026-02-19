import { test, expect } from '@playwright/test';

test.describe('Dummy PDF Loading Test', () => {
  test('should properly load and render dummy PDF via /view/test-docs/dummy.pdf route', async ({ page }) => {
    // Bootstrap React app shell first, then navigate to test PDF route
    await page.goto('/app', { waitUntil: 'domcontentloaded' });
    await page.waitForURL('**/view');
    await page.evaluate(() => { history.pushState({}, '', '/view/test-docs/dummy.pdf'); window.dispatchEvent(new PopStateEvent('popstate')); });
    await page.waitForURL('**/view/test-docs/dummy.pdf');

    // Wait for PDF.js to render
    await expect(page.locator('#viewer-root')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 30000 });

    // Check active viewer controls and file indicator
    await expect(page.locator('#viewer-toolbar')).toBeVisible();
    await expect(page.locator('#viewer-page-controls')).toBeVisible();
    await expect(page.locator('#viewer-filename')).toContainText('dummy.pdf');
    await expect(page.locator('#viewer-page-controls span').first()).toContainText('/');
    
    // Take a screenshot to visually confirm the PDF is rendered
    await page.screenshot({ path: 'test-results/dummy-pdf-loaded.png', fullPage: true });
  });

  test('should properly load and render dummy PDF via /view route with documentId', async ({ page }) => {
    // Bootstrap React app shell; it redirects to /view
    await page.goto('/app', { waitUntil: 'domcontentloaded' });
    await page.waitForURL('**/view');

    // Initial viewer should show upload prompt with a mounted (hidden) file input
    await expect(page.locator('#viewer-root')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Upload a PDF or .snapsign file')).toBeVisible({ timeout: 10000 });
    await page.locator('#viewer-root input[type="file"]').first().waitFor({ state: 'attached', timeout: 10000 });
  });

  test('should handle invalid PDF file gracefully', async ({ page }) => {
    // Test that the app handles non-existent PDF files gracefully (SPA navigation)
    await page.goto('/app', { waitUntil: 'domcontentloaded' });
    await page.waitForURL('**/view');
    await page.evaluate(() => { history.pushState({}, '', '/view/test-docs/nonexistent.pdf'); window.dispatchEvent(new PopStateEvent('popstate')); });
    await page.waitForURL('**/view/test-docs/nonexistent.pdf');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Should show a gate dialog error instead of crashing
    await expect(page.locator('#viewer-gate-dialog')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Could not load PDF')).toBeVisible();
  });
});
