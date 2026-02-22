import { test, expect } from '@playwright/test';

test('AI workflow uses real Firebase (no emulators): extract PDF text + call analysis APIs', async ({ page }) => {
  // This test intentionally does NOT set window.MOCK_AUTH.
  // It exercises the production-like path:
  // - Firebase Auth anonymous sign-in (real Firebase)
  // - client-side PDF.js text extraction
  // - callable functions preflight + analysis (real deployed Functions)

  await page.goto('/view/test-docs/offer.pdf', { waitUntil: 'networkidle' });

  // Wait until the AI sidebar tool buttons are enabled (auth ready + PDF opened).
  const summarize = page.getByRole('button', { name: 'Summarize Key Points' });
  await expect(summarize).toBeVisible();
  await expect(summarize).toBeEnabled({ timeout: 60000 });

  await summarize.click();

  // Results render in the analysis sidebar.
  const results = page.getByTestId('analysis-results');
  await expect(results).toBeVisible();

  // Wait for completion state. If Gemini is misconfigured, the UI will show an error card instead.
  await expect(results.getByText('AI decode complete')).toBeVisible({ timeout: 120000 });

  // Ensure we got a non-trivial summary (plainExplanation mapped to `analysis.summary`).
  const summaryText = await results.locator('p.text-slate-700').first().textContent();
  expect((summaryText || '').trim().length).toBeGreaterThan(40);
});

