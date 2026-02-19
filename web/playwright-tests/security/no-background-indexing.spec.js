import { test, expect } from '@playwright/test';

// Ensures connected drives do not trigger background indexing or automatic uploads
test.describe.skip('Drive connectors — no background indexing', () => {
  test('connected drive should not auto-sync or index files in background', async ({ page }) => {
    // TODO:
    // - Connect provider (mock)
    // - Simulate provider-side file change / push notification
    // - Assert app does NOT automatically pull content or create uploads
    // - Assert explicit user action is required for open/save
    test.skip();
  });
});
