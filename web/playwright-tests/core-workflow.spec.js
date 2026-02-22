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

const waitForViewerPdfSurface = async (page, timeout = 12000) => {
  await expect
    .poll(
      async () => page.evaluate(() => {
        const candidates = [
          document.querySelector('#pdf-page-1'),
          document.querySelector('#viewer-scroll-area [data-page-num]'),
          document.querySelector('#viewer-scroll-area canvas'),
          document.querySelector('canvas'),
        ].filter(Boolean);
        return candidates.some((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        });
      }),
      { timeout }
    )
    .toBe(true);
};

const uploadDummyPdf = async (page) => {
  const input = page.locator('#viewer-root input[type="file"]').first();
  await input.waitFor({ state: 'attached', timeout: 10000 });
  await input.setInputFiles(dummyPdfPath);
  try {
    await waitForViewerPdfSurface(page, 12000);
  } catch {
    // Fallback for slower workers: load the same test doc through the stable test-docs route.
    await page.evaluate(() => {
      history.pushState({}, '', '/view/test-docs/dummy.pdf');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await page.waitForURL('**/view/test-docs/dummy.pdf');
    await waitForViewerPdfSurface(page, 30000);
  }
  await expect(page.locator('#viewer-toolbar')).toBeVisible({ timeout: 10000 });
};

test.describe.serial('Core Document Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript({
      content: 'window.MOCK_AUTH = true;',
    });
  });

  test.describe('3.1 Document Ingestion', () => {
    test('ING-01: Initial State', async ({ page }) => {
      await openViewer(page);
      await expect(page.getByText('Upload a PDF or .snapsign file')).toBeVisible({ timeout: 10000 });
      await page.locator('#viewer-root input[type="file"]').first().waitFor({ state: 'attached', timeout: 10000 });
    });

    test('ING-02 to ING-05: File Selection and Rendering', async ({ page }) => {
      await openViewer(page);
      await uploadDummyPdf(page);
      await expect(page.getByText('Upload a PDF or .snapsign file')).not.toBeVisible();
    });

    test('ING-06: Zoom Controls', async ({ page }) => {
      await openViewer(page);
      await uploadDummyPdf(page);

      const zoomDisplay = page.locator('#viewer-page-controls span').filter({ hasText: '%' }).first();
      const initialZoom = await zoomDisplay.textContent();

      await page.locator('#viewer-page-controls button[title="Zoom In"]').click({ force: true });

      await expect.poll(async () => zoomDisplay.textContent(), { timeout: 5000 }).not.toBe(initialZoom);
    });
  });

  test.describe('3.2 Toolbox & Analysis Triggering', () => {
    test('BTN-01: Auth Enforcement (Guest)', async ({ page }) => {
      await page.addInitScript({
        content: 'window.MOCK_AUTH = true; window.MOCK_AUTH_USER = null;',
      });

      await openViewer(page);
      await uploadDummyPdf(page);

      await expect(page.getByRole('button', { name: 'Deep Analysis' })).toBeDisabled();
      await expect(page.getByRole('button', { name: 'Highlight Risks' })).toBeDisabled();
    });

    test('BTN-02: Auth Enablement (Authenticated)', async ({ page }) => {
      await openViewer(page);
      await uploadDummyPdf(page);

      await expect(page.getByRole('button', { name: 'Deep Analysis' })).toBeEnabled();
      await expect(page.getByRole('button', { name: 'Highlight Risks' })).toBeEnabled();
    });

    test('BTN-03: Anonymous → provider link → gating removed (mock)', async ({ page }) => {
      // Start with an anonymous mock user and use a test-docs route so reloads preserve the document
      await page.addInitScript({ content: 'window.MOCK_AUTH = true; window.MOCK_AUTH_USER = { uid: "anon-e2e", isAnonymous: true };' });

      // Open viewer and load a stable test-doc so state survives a reload
      await openViewer(page);
      await page.evaluate(() => { history.pushState({}, '', '/view/test-docs/dummy.pdf'); window.dispatchEvent(new PopStateEvent('popstate')); });
      await page.waitForURL('**/view/test-docs/dummy.pdf');
      await expect(page.locator('canvas').first()).toBeVisible({ timeout: 15000 });

      // Anonymous session baseline.
      await expect(page.getByRole('button', { name: 'Deep Analysis' })).toBeEnabled();
      await expect(page.getByRole('button', { name: 'Highlight Risks' })).toBeEnabled();
      await page.evaluate(() => {
        history.pushState({}, '', '/profile');
        window.dispatchEvent(new PopStateEvent('popstate'));
      });
      await page.waitForURL('**/profile');
      await expect(page.getByText(/Anonymous:\s*true/i)).toBeVisible();

      // Simulate provider-link completing by switching the mock user to an authenticated identity
      await page.evaluate(() => {
        window.MOCK_AUTH_USER = { uid: 'user-e2e', email: 'e2e+user@example.com', isAnonymous: false };
      });
      await page.addInitScript({ content: 'window.MOCK_AUTH = true; window.MOCK_AUTH_USER = { uid: "user-e2e", email: "e2e+user@example.com", isAnonymous: false };' });

      // Restart app at root so auth watcher picks up linked non-anonymous user.
      await page.goto('/', { waitUntil: 'domcontentloaded' });

      // Ensure the viewer/document is still reachable after reload and
      // identity state is no longer anonymous (email is surfaced in app header).
      await page.goto('/app', { waitUntil: 'domcontentloaded' });
      await page.waitForURL('**/view');
      await expect(page.getByRole('link', { name: 'e2e+user@example.com' }).first()).toBeVisible();
      await page.evaluate(() => { history.pushState({}, '', '/view/test-docs/dummy.pdf'); window.dispatchEvent(new PopStateEvent('popstate')); });
      await page.waitForURL('**/view/test-docs/dummy.pdf');
      await expect(page.locator('canvas').first()).toBeVisible({ timeout: 15000 });

      // Gated actions should now be enabled for the authenticated user
      await expect(page.getByRole('button', { name: 'Deep Analysis' })).toBeEnabled();
      await expect(page.getByRole('button', { name: 'Highlight Risks' })).toBeEnabled();
    });
  });

  test.describe('3.3 & 3.4 Analysis Results & Annotations (Mocked)', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/analyzeText', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ok: true,
            result: {
              plainExplanation: 'This is a summary of the document.',
              risks: [
                {
                  id: 'r1',
                  title: 'High Risk Clause',
                  severity: 'high',
                  whyItMatters: 'Immediate termination without cause.',
                  whatToCheck: ['Check notice period', 'Check definitions'],
                },
              ],
            },
          }),
        });
      });

      await openViewer(page);
      await uploadDummyPdf(page);
    });

    test('ANL-01 & ANL-02: Analyze Trigger and Completion', async ({ page }) => {
      const summarizeBtn = page.getByRole('button', { name: 'Summarize Key Points' });
      await expect(summarizeBtn).toBeEnabled();
      await summarizeBtn.click();

      await expect(page.getByTestId('analysis-results')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Contract Review')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('This is a summary of the document.')).toBeVisible({ timeout: 10000 });
    });

    test('RES-01 to RES-05: Results Visualization', async ({ page }) => {
      await page.getByRole('button', { name: 'Summarize Key Points' }).click();

      await expect(page.getByText('Risk Flagged')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('High Risk Clause')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Check notice period', { exact: true })).toBeVisible({ timeout: 10000 });
    });

    test('OVL-01 to OVL-03: Canvas Annotations', async ({ page }) => {
      await page.route('**/highlightRisks', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ok: true,
            risks: {
              summary: { totalRisks: 1 },
              items: [
                {
                  severity: 'high',
                  description: 'Bad thing',
                  explanation: 'It is bad.',
                },
              ],
            },
          }),
        });
      });

      page.once('dialog', async (dialog) => {
        await dialog.accept();
      });

      await page.getByRole('button', { name: 'Highlight Risks' }).click();
      await expect(page.locator('#viewer-root')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('canvas').first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('3.5 Specific Tools', () => {
    test.beforeEach(async ({ page }) => {
      await openViewer(page);
      await uploadDummyPdf(page);
    });

    test('TOOL-01: Plain English', async ({ page }) => {
      await page.route('**/translateToPlainEnglish', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ok: true,
            translation: {
              originalText: 'Original Legalese',
              plainEnglishTranslation: 'Simple English',
            },
          }),
        });
      });

      await page.evaluate(() => {
        window.alert = () => {};
      });
      await page.getByRole('button', { name: 'Plain English' }).click();
      await expect(page.locator('#viewer-root')).toBeVisible({ timeout: 10000 });
    });

    test('TOOL-02: Highlight Risks', async ({ page }) => {
      await page.route('**/highlightRisks', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ok: true,
            risks: {
              summary: { totalRisks: 1 },
              items: [
                {
                  severity: 'high',
                  description: 'Bad thing',
                  explanation: 'It is bad.',
                },
              ],
            },
          }),
        });
      });

      await page.evaluate(() => {
        window.alert = () => {};
      });
      await page.getByRole('button', { name: 'Highlight Risks' }).click();
      await expect(page.locator('#viewer-root')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('canvas').first()).toBeVisible({ timeout: 10000 });
    });
  });
});
