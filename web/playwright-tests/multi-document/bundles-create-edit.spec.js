import { test, expect } from '@playwright/test';

// Skeleton for multi-document bundle UI tests. Marked skipped until bundle UI exists.
test.describe.skip('Multi-document bundles — create / edit / persist', () => {
  test('create bundle from drive files, reorder and persist metadata', async ({ page }) => {
    // TODO: flow:
    // - Open Drive picker -> select multiple files
    // - Create a bundle, reorder pages/docs, pin one
    // - Save bundle metadata and re-open to confirm persisted order/selection

    test.skip();
  });
});
