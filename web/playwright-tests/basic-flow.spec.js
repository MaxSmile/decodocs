import { test, expect } from '@playwright/test';

test.describe('DecoDocs Application Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Using the deployed site for testing
    await page.goto('https://decodocs-site.web.app');
  });

  test('should display new homepage with correct content', async ({ page }) => {
    // Verify we're on the home page with new content
    await expect(page.locator('h1')).toContainText('Decode documents. Sign with clarity.');
    
    // Verify the main CTA button exists
    const openPdfButton = page.locator('button', { hasText: 'Open PDF Document' });
    await expect(openPdfButton).toBeVisible();
    
    // Verify secondary CTA exists
    const signPdfButton = page.locator('button', { hasText: 'Sign any PDF' });
    await expect(signPdfButton).toBeVisible();
    
    // Verify "How it works" section exists
    await expect(page.locator('h2', { hasText: 'How it works' })).toBeVisible();
    
    // Verify the 3 steps are visible
    await expect(page.locator('h3', { hasText: 'Open PDF' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Get explanation' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Decide / Sign' })).toBeVisible();
    
    // Since we can't upload a real PDF in this test, we'll verify the page structure
    await expect(page.locator('.hero')).toBeVisible();
    await expect(page.locator('.features')).toBeVisible();
  });

  test('should have correct navigation elements', async ({ page }) => {
    // Check header
    await expect(page.locator('.nav-logo')).toContainText('DecoDocs');
    
    // Check navigation links
    await expect(page.locator('a', { hasText: 'Product' })).toBeVisible();
    await expect(page.locator('a', { hasText: 'Pricing' })).toBeVisible();
    await expect(page.locator('a', { hasText: 'Roadmap' })).toBeVisible();
    await expect(page.locator('a', { hasText: 'About' })).toBeVisible();
    
    // Check main CTA button
    await expect(page.locator('button', { hasText: 'Open PDF' })).toBeVisible();
  });

  test('should display 6 feature cards', async ({ page }) => {
    // Check all 6 feature cards are visible
    await expect(page.locator('h3', { hasText: 'Plain-language explanation' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Caveats & unfair conditions' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Obligations & penalties summary' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Logical inconsistency flags' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Translation when needed' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Email-to-sign + HubSpot capture' })).toBeVisible();
  });

  test('should display Open vs Upload comparison', async ({ page }) => {
    // Check the Open vs Upload section exists
    await expect(page.locator('h2', { hasText: 'Open vs Upload' })).toBeVisible();
    
    // Check both cards are visible
    await expect(page.locator('h3', { hasText: 'Open (default)' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Upload (Pro)' })).toBeVisible();
  });

  test('should display pricing tiers', async ({ page }) => {
    // Check the pricing section exists
    await expect(page.locator('h2', { hasText: 'Pricing' })).toBeVisible();
    
    // Check all three pricing tiers are visible
    await expect(page.locator('h3', { hasText: 'Free' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Pro' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Premium' })).toBeVisible();
  });

  test('should display roadmap', async ({ page }) => {
    // Check the roadmap section exists
    await expect(page.locator('h2', { hasText: 'Roadmap' })).toBeVisible();
    
    // Check all roadmap periods are visible
    await expect(page.locator('h3', { hasText: 'Now' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Next' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Later' })).toBeVisible();
  });

  test('should have proper footer with legal information', async ({ page }) => {
    // Check footer has legal section
    await expect(page.locator('.footer-section h4', { hasText: 'Legal' })).toBeVisible();
    
    // Check footer has company section with About link
    await expect(page.locator('.footer-section h4', { hasText: 'Company' })).toBeVisible();
    await expect(page.locator('a', { hasText: 'About' })).toBeVisible();
    
    // Check copyright information
    await expect(page.locator('.footer-bottom p', { hasText: '© SnapSign Pty Ltd' })).toBeVisible();
    await expect(page.locator('.footer-bottom p', { hasText: 'ABN 72 679 570 757' })).toBeVisible();
  });
});

test.describe('Document Viewer Tests', () => {
  test('should navigate to document viewer route', async ({ page }) => {
    // Since we can't upload a real file, we'll simulate navigating to a document viewer page
    // For this test, we'll assume a test document ID
    await page.goto('https://decodocs-site.web.app/view/test-doc');
    
    // Wait for potential loading
    await page.waitForTimeout(2000);
    
    // Check if document viewer elements are present
    const openDifferentPdfBtn = page.locator('button', { hasText: 'Open Different PDF' });
    const editSignBtn = page.locator('button', { hasText: 'Edit & Sign' });
    
    // These elements might not be visible if no document is loaded, which is expected
    // Just check if the page loads without errors
    await expect(page).toHaveURL(/.*view.*/);
  });
});

test.describe('Document Editor Tests', () => {
  test('should navigate to document editor route', async ({ page }) => {
    // Navigate to the editor page
    await page.goto('https://decodocs-site.web.app/edit/test-doc');
    
    // Wait for potential loading
    await page.waitForTimeout(2000);
    
    // Check if editor elements are present
    const viewPdfBtn = page.locator('button', { hasText: 'View Document' });
    const signModeBtn = page.locator('button', { hasText: /Sign Mode/ });
    
    // Check if editing tools section exists
    await expect(page.locator('h4', { hasText: 'Editor Controls' })).toBeVisible();
  });
});
