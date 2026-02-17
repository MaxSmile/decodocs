import { test, expect } from '@playwright/test';

test.describe('DecoDocs Application Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Test on localhost dev server
    await page.goto('/');
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
    // Check for navigation elements in the header
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();
  });

  test('should display pricing tiers', async ({ page }) => {
    // Navigate to pricing page
    await page.goto('/pricing');

    // Check the pricing section exists
    await expect(page.locator('h1', { hasText: 'Pricing' })).toBeVisible();

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
    await expect(footer).toContainText('Snap Sign Pty Ltd');
    await expect(footer.locator('a:has-text("About")')).toBeVisible();

    // Check copyright information
    await expect(footer).toContainText('Snap Sign Pty Ltd');
    await expect(footer).toContainText('ABN 72 679 570 757');
  });
});

test.describe('Document Viewer Tests', () => {
  test('should navigate to document viewer route', async ({ page }) => {
    // Navigate to the document viewer page
    await page.goto('/view');

    // Wait for potential loading
    await page.waitForTimeout(2000);

    // Check if document viewer elements are present (e.g. the dropzone)
    await expect(page.locator('text=Upload a PDF')).toBeVisible();
  });
});

test.describe('Document Editor Tests', () => {
  test('should navigate to document editor route', async ({ page }) => {
    // Navigate to the editor page
    await page.goto('/edit/test-doc');

    // Wait for potential loading
    await page.waitForTimeout(2000);

    // Check if editor elements are present
    const viewPdfBtn = page.locator('button', { hasText: 'View Document' });
    const signModeBtn = page.locator('button', { hasText: /Sign Mode/ });

    // Check if editing tools section exists
    await expect(page.locator('h4', { hasText: 'Editor Controls' })).toBeVisible();
  });
});
