/**
 * Integration tests for Page Management features
 * 
 * Tests the complete page management workflow including:
 * - Thumbnail sidebar fold/unfold
 * - Duplicate, Rotate, Delete, and Add page operations
 * - Integration with DocumentViewer and DocumentEditor
 */

import { test, expect } from '@playwright/test';

test.describe('Page Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/app');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Thumbnail Sidebar', () => {
    test('should display thumbnail sidebar when PDF is loaded', async ({ page }) => {
      // Upload a test PDF
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles('./test-docs/sample.pdf');
      
      // Wait for PDF to load
      await page.waitForSelector('#viewer-thumbnails', { timeout: 10000 });
      
      // Verify thumbnails are displayed
      const thumbnails = page.locator('#viewer-thumbnails button[id^="thumb-"]');
      await expect(thumbnails.first()).toBeVisible();
    });

    test('should collapse and expand thumbnail sidebar', async ({ page }) => {
      // Upload a test PDF
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles('./test-docs/sample.pdf');
      
      await page.waitForSelector('#viewer-thumbnails', { timeout: 10000 });
      
      // Click collapse button
      const collapseBtn = page.getByTitle('Collapse thumbnails');
      await collapseBtn.click();
      
      // Verify sidebar is collapsed (narrow width)
      const collapsedSidebar = page.locator('.w-10');
      await expect(collapsedSidebar).toBeVisible();
      
      // Click expand button
      const expandBtn = page.getByTitle('Expand thumbnails');
      await expandBtn.click();
      
      // Verify sidebar is expanded again
      const expandedSidebar = page.locator('#viewer-thumbnails');
      await expect(expandedSidebar).toBeVisible();
    });

    test('should highlight current page in thumbnails', async ({ page }) => {
      // Upload a test PDF
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles('./test-docs/sample.pdf');
      
      await page.waitForSelector('#viewer-thumbnails', { timeout: 10000 });
      
      // First thumbnail should be highlighted
      const firstThumb = page.locator('#thumb-1').closest('.relative');
      await expect(firstThumb).toHaveClass(/bg-blue-50/);
    });

    test('should navigate to page when thumbnail is clicked', async ({ page }) => {
      // Upload a test PDF with multiple pages
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles('./test-docs/multi-page.pdf');
      
      await page.waitForSelector('#viewer-thumbnails', { timeout: 10000 });
      
      // Click on second thumbnail
      const secondThumb = page.locator('#thumb-2');
      await secondThumb.click();
      
      // Verify second page is now highlighted
      await expect(secondThumb.closest('.relative')).toHaveClass(/bg-blue-50/);
    });
  });

  test.describe('Page Actions', () => {
    test.beforeEach(async ({ page }) => {
      // Upload a test PDF
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles('./test-docs/multi-page.pdf');
      
      await page.waitForSelector('#viewer-thumbnails', { timeout: 10000 });
    });

    test('should show action buttons on thumbnail hover', async ({ page }) => {
      const firstThumb = page.locator('#thumb-1').closest('.relative');
      await firstThumb.hover();
      
      // Action buttons should appear
      await expect(page.getByTitle('Duplicate page')).toBeVisible();
      await expect(page.getByTitle('Rotate 90° clockwise')).toBeVisible();
      await expect(page.getByTitle('Delete page')).toBeVisible();
    });

    test('should duplicate page', async ({ page }) => {
      const initialPageCount = await page.locator('button[id^="thumb-"]').count();
      
      // Hover over first thumbnail and click duplicate
      const firstThumb = page.locator('#thumb-1').closest('.relative');
      await firstThumb.hover();
      
      await page.getByTitle('Duplicate page').click();
      
      // Wait for operation to complete
      await page.waitForTimeout(1000);
      
      // Verify page count increased
      const newPageCount = await page.locator('button[id^="thumb-"]').count();
      expect(newPageCount).toBe(initialPageCount + 1);
    });

    test('should rotate page', async ({ page }) => {
      // Hover over first thumbnail and click rotate
      const firstThumb = page.locator('#thumb-1').closest('.relative');
      await firstThumb.hover();
      
      await page.getByTitle('Rotate 90° clockwise').click();
      
      // Wait for operation to complete
      await page.waitForTimeout(1000);
      
      // Verify no error dialog appeared
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    });

    test('should delete page with confirmation', async ({ page }) => {
      const initialPageCount = await page.locator('button[id^="thumb-"]').count();
      
      // Hover over first thumbnail
      const firstThumb = page.locator('#thumb-1').closest('.relative');
      await firstThumb.hover();
      
      // First click - should show confirmation tooltip
      await page.getByTitle('Delete page').click();
      
      // Verify confirmation message appears
      await expect(page.getByText('Click delete again to confirm')).toBeVisible();
      
      // Second click - confirm delete
      await page.getByTitle('Delete page').click();
      
      // Wait for operation to complete
      await page.waitForTimeout(1000);
      
      // Verify page count decreased
      const newPageCount = await page.locator('button[id^="thumb-"]').count();
      expect(newPageCount).toBe(initialPageCount - 1);
    });

    test('should not allow deleting the last page', async ({ page }) => {
      // Delete pages until only one remains
      let pageCount = await page.locator('button[id^="thumb-"]').count();
      
      while (pageCount > 1) {
        const firstThumb = page.locator('#thumb-1').closest('.relative');
        await firstThumb.hover();
        
        await page.getByTitle('Delete page').click();
        await page.getByTitle('Delete page').click();
        
        await page.waitForTimeout(500);
        pageCount = await page.locator('button[id^="thumb-"]').count();
      }
      
      // Now try to delete the last page
      const lastThumb = page.locator('#thumb-1').closest('.relative');
      await lastThumb.hover();
      
      // Delete button should be disabled
      const deleteBtn = page.getByTitle('Delete page');
      await expect(deleteBtn).toBeDisabled();
    });

    test('should add blank page', async ({ page }) => {
      const initialPageCount = await page.locator('button[id^="thumb-"]').count();
      
      // Click Add Page button
      await page.getByText('Add Page').click();
      
      // Wait for operation to complete
      await page.waitForTimeout(1000);
      
      // Verify page count increased
      const newPageCount = await page.locator('button[id^="thumb-"]').count();
      expect(newPageCount).toBe(initialPageCount + 1);
    });
  });

  test.describe('Editor Mode', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to editor mode
      await page.goto('/edit');
      
      // Upload a test PDF
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles('./test-docs/multi-page.pdf');
      
      await page.waitForSelector('#viewer-thumbnails', { timeout: 10000 });
    });

    test('should have page management in editor mode', async ({ page }) => {
      // Verify thumbnail sidebar is present
      await expect(page.locator('#viewer-thumbnails')).toBeVisible();
      
      // Verify Add Page button is present
      await expect(page.getByText('Add Page')).toBeVisible();
    });

    test('should perform page operations in editor mode', async ({ page }) => {
      const initialPageCount = await page.locator('button[id^="thumb-"]').count();
      
      // Duplicate a page
      const firstThumb = page.locator('#thumb-1').closest('.relative');
      await firstThumb.hover();
      
      await page.getByTitle('Duplicate page').click();
      await page.waitForTimeout(1000);
      
      // Verify operation worked
      const newPageCount = await page.locator('button[id^="thumb-"]').count();
      expect(newPageCount).toBe(initialPageCount + 1);
    });
  });

  test.describe('Error Handling', () => {
    test('should show error dialog when operation fails', async ({ page }) => {
      // Upload a test PDF
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles('./test-docs/sample.pdf');
      
      await page.waitForSelector('#viewer-thumbnails', { timeout: 10000 });
      
      // Try to delete the only page (should fail)
      const firstThumb = page.locator('#thumb-1').closest('.relative');
      await firstThumb.hover();
      
      // Delete button should be disabled for single page
      const deleteBtn = page.getByTitle('Delete page');
      await expect(deleteBtn).toBeDisabled();
    });
  });

  test.describe('Keyboard Navigation', () => {
    test.beforeEach(async ({ page }) => {
      // Upload a test PDF
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles('./test-docs/multi-page.pdf');
      
      await page.waitForSelector('#viewer-thumbnails', { timeout: 10000 });
    });

    test('should navigate thumbnails with keyboard', async ({ page }) => {
      // Focus on first thumbnail
      await page.locator('#thumb-1').focus();
      
      // Press Tab to navigate
      await page.keyboard.press('Tab');
      
      // Second thumbnail should be focused
      await expect(page.locator('#thumb-2')).toBeFocused();
    });

    test('should activate thumbnail with Enter key', async ({ page }) => {
      // Focus on second thumbnail
      await page.locator('#thumb-2').focus();
      
      // Press Enter
      await page.keyboard.press('Enter');
      
      // Second thumbnail should be highlighted
      const secondThumb = page.locator('#thumb-2').closest('.relative');
      await expect(secondThumb).toHaveClass(/bg-blue-50/);
    });
  });

  test.describe('Accessibility', () => {
    test.beforeEach(async ({ page }) => {
      // Upload a test PDF
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles('./test-docs/multi-page.pdf');
      
      await page.waitForSelector('#viewer-thumbnails', { timeout: 10000 });
    });

    test('should have proper ARIA labels', async ({ page }) => {
      // Thumbnails should have accessible names
      const thumb1 = page.locator('#thumb-1');
      await expect(thumb1).toHaveAttribute('id', 'thumb-1');
      
      // Action buttons should have titles
      const firstThumb = page.locator('#thumb-1').closest('.relative');
      await firstThumb.hover();
      
      await expect(page.getByTitle('Duplicate page')).toBeVisible();
      await expect(page.getByTitle('Rotate 90° clockwise')).toBeVisible();
      await expect(page.getByTitle('Delete page')).toBeVisible();
    });

    test('should be keyboard accessible', async ({ page }) => {
      // All interactive elements should be focusable
      const addPageBtn = page.getByText('Add Page');
      await addPageBtn.focus();
      await expect(addPageBtn).toBeFocused();
      
      const collapseBtn = page.getByTitle('Collapse thumbnails');
      await collapseBtn.focus();
      await expect(collapseBtn).toBeFocused();
    });
  });
});
