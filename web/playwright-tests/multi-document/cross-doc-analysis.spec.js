import { test, expect } from '@playwright/test';

// Skeleton: cross-document analysis acceptance tests (UI + metering notice)
test.describe.skip('Cross-document analysis — bundle-level analysis', () => {
  test('run cross-doc analysis and show contradictions + metering notice for heavy compute', async ({ page }) => {
    // TODO:
    // - Create/Load a bundle with 2+ documents
    // - Trigger "Analyze bundle"
    // - Mock backend to return cross-doc findings and ensure UI renders contradictions and references
    // - If response indicates heavy compute / Pro recommendation, assert metering/CTA is shown

    test.skip();
  });
});
