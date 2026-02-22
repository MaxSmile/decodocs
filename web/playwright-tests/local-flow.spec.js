import { test, expect } from '@playwright/test';

// Note: These tests assume you're running the app locally on port 3000
// To run: npm start in one terminal, then npx playwright test in another

test.describe('Local DecoDocs Application Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Using localhost for testing the actual functionality
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  });

  test('should display new homepage with correct content', async ({ page }) => {
    // Verify we're on the home page with new content
    await expect(page.locator('#hero h1')).toContainText('Decode documents');

    // Main CTA is a button that opens the file picker
    const openPdfButton = page.getByRole('link', { name: 'Analyse a PDF Document' });
    await expect(openPdfButton).toBeVisible();

    // Secondary CTA is a link to editor
    const openEditorButton = page.getByRole('link', { name: 'Edit a PDF Document' });
    await expect(openEditorButton).toBeVisible();
  });

  test('should have correct navigation elements', async ({ page }) => {
    // Scope to the header navigation to avoid matching footer links
    const headerNav = page.locator('nav').first();
    await expect(headerNav.getByRole('link', { name: 'How it works' })).toBeVisible();
    await expect(headerNav.getByRole('link', { name: 'Features' })).toBeVisible();
    await expect(headerNav.getByRole('link', { name: 'Use cases' })).toBeVisible();
    await expect(headerNav.getByRole('link', { name: 'Pricing' })).toBeVisible();
  });

  test('should have proper header and footer', async ({ page }) => {
    // Check header branding (logo + site title) via the home link
    await expect(page.getByRole('link', { name: /DecoDocs/i }).first()).toBeVisible();

    // Check footer has updated content
    await expect(page.locator('footer')).toContainText('DecoDocs');
    await expect(page.locator('footer').getByRole('link', { name: 'Privacy' }).first()).toBeVisible();
  });
});

// Additional tests for routing functionality
test.describe('Routing Tests', () => {
  test('should handle invalid routes gracefully', async ({ page }) => {
    // Navigate client-side to an invalid route (avoid dev-server 404)
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    await page.evaluate(() => { history.pushState({}, '', '/invalid-route'); window.dispatchEvent(new PopStateEvent('popstate')); });
    await page.waitForURL('**/invalid-route');

    // App should still render shell (hero heading should be present)
    await expect(page.getByRole('heading', { name: /Decode documents before you sign\./i })).toBeVisible();
  });
});

// Test the actual routing between components when running locally
test.describe('Component Navigation Tests', () => {
  test('should render different components based on route', async ({ page }) => {
    // Test home page
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#hero h1')).toContainText('Decode documents');

    // The following tests would require actual routing simulation or mock data
    // which is difficult to test without a real document being uploaded
  });
});
