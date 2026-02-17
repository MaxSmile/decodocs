import { test, expect } from '@playwright/test';

// Note: These tests assume you're running the app locally on port 3000
// To run: npm start in one terminal, then npx playwright test in another

test.describe('Local DecoDocs Application Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Using localhost for testing the actual functionality
    await page.goto('http://localhost:3000');
  });

  test('should display new homepage with correct content', async ({ page }) => {
    // Verify we're on the home page with new content
    await expect(page.locator('h1')).toContainText('Decode documents before you sign.');

    // Verify the main CTA button exists
    const openPdfButton = page.locator('button', { hasText: 'Analyze a Document' });
    await expect(openPdfButton).toBeVisible();

    // Verify secondary CTA exists
    const viewDemoButton = page.locator('a', { hasText: 'View Demo' });
    await expect(viewDemoButton).toBeVisible();
  });

  test('should have correct navigation elements', async ({ page }) => {
    // Check navigation links
    await expect(page.locator('a', { hasText: 'Product' })).toBeVisible();
    await expect(page.locator('a', { hasText: 'Pricing' })).toBeVisible();
    await expect(page.locator('a', { hasText: 'Roadmap' })).toBeVisible();
    await expect(page.locator('a', { hasText: 'About' })).toBeVisible();
  });

  test('should have proper header and footer', async ({ page }) => {
    // Check header branding
    await expect(page.locator('span', { hasText: 'DecoDocs' }).first()).toBeVisible();

    // Check footer has updated content
    await expect(page.locator('footer')).toContainText('Snap Sign Pty Ltd');
    await expect(page.locator('footer')).toContainText('ABN 72 679 570 757');
  });
});

// Additional tests for routing functionality
test.describe('Routing Tests', () => {
  test('should handle invalid routes gracefully', async ({ page }) => {
    // Test an invalid route
    await page.goto('http://localhost:3000/invalid-route');

    // Should still show the app structure
    await expect(page.locator('h1')).toContainText('DecoDocs');
  });
});

// Test the actual routing between components when running locally
test.describe('Component Navigation Tests', () => {
  test('should render different components based on route', async ({ page }) => {
    // Test home page
    await page.goto('http://localhost:3000/');
    await expect(page.locator('h1')).toContainText('Decode documents. Sign with clarity.');

    // The following tests would require actual routing simulation or mock data
    // which is difficult to test without a real document being uploaded
  });
});
