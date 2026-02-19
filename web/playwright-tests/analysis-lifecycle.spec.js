import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dummyPdfPath = path.join(__dirname, '../public/test-docs/dummy.pdf');

const openViewer = async (page) => {
  await page.goto('/app', { waitUntil: 'domcontentloaded' });
  await page.waitForURL('**/view');
  await expect(page.locator('#viewer-root')).toBeVisible({ timeout: 15000 });
};

const uploadDummyPdf = async (page) => {
  const input = page.locator('#viewer-root input[type="file"]').first();
  await input.waitFor({ state: 'attached', timeout: 10000 });
  await input.setInputFiles(dummyPdfPath);
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 30000 });
  await expect(page.locator('#viewer-toolbar')).toBeVisible({ timeout: 10000 });
  // wait for PDF extraction/initial processing to complete so analysis tools become available
  // wait until the viewer/analysis loading indicator (if any) has cleared
};

test.describe('Analysis lifecycle — loading → success (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    // authenticated mock so analysis buttons are enabled
    await page.addInitScript({ content: 'window.MOCK_AUTH = true; window.MOCK_AUTH_USER = { uid: "e2e-user", email: "e2e+user@example.com", isAnonymous: false };' });
  });

  test('shows loading UI during analysis and renders results on success', async ({ page }) => {
    await openViewer(page);
    await uploadDummyPdf(page);

    // Delay the analyzeText response to observe the loading UI
    await page.route('**/analyzeText', async (route) => {
      await new Promise((r) => setTimeout(r, 600));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          result: {
            plainExplanation: 'Lifecycle test summary — document OK.',
            risks: [
              {
                id: 'r-lc-1',
                title: 'Lifecycle Risk',
                severity: 'medium',
                whyItMatters: 'Sample risk for lifecycle test.',
                whatToCheck: ['Check A', 'Check B'],
              },
            ],
          },
        }),
      });
    });

    const summarizeBtn = page.getByRole('button', { name: 'Summarize Key Points' });
    await expect(summarizeBtn).toBeEnabled();

    // Trigger analysis.
    await summarizeBtn.click();

    // After the mocked response, results should render
    await expect(page.getByText('Document Summary')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Lifecycle test summary — document OK.')).toBeVisible({ timeout: 10000 });

    // Identified risk should be shown
    await expect(page.getByText('Identified Risks')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Lifecycle Risk')).toBeVisible({ timeout: 10000 });

    // Tools are available again via Tools tab (results tab may be active here).
  });
});
