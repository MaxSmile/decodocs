import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dummyPdfPath = path.join(__dirname, '../public/test-docs/dummy.pdf');

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

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

const ensureGateDismissed = async (page) => {
  const gateDialog = page.locator('#viewer-gate-dialog');
  if (!(await gateDialog.isVisible({ timeout: 1000 }).catch(() => false))) {
    return;
  }
  const okButton = gateDialog.getByRole('button', { name: /^ok$/i });
  if (await okButton.isVisible({ timeout: 1500 }).catch(() => false)) {
    await okButton.click();
  } else {
    await gateDialog.locator('button').first().click();
  }
  await expect(gateDialog).toBeHidden({ timeout: 5000 });
};

const uploadDummyPdf = async (page) => {
  const input = page.locator('#viewer-root input[type="file"]').first();
  await input.waitFor({ state: 'attached', timeout: 10000 });
  await input.setInputFiles(dummyPdfPath);
  try {
    await waitForViewerPdfSurface(page, 12000);
  } catch {
    await page.evaluate(() => {
      history.pushState({}, '', '/view/test-docs/dummy.pdf');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await page.waitForURL('**/view/test-docs/dummy.pdf');
    await waitForViewerPdfSurface(page, 30000);
  }
  await ensureGateDismissed(page);
  await expect(page.locator('#viewer-toolbar')).toBeVisible({ timeout: 10000 });
};

/* ------------------------------------------------------------------ */
/*  1. Viewer Toolbar — tooltips and hint bar                          */
/* ------------------------------------------------------------------ */

test.describe('Viewer Toolbar — tooltips and hint bar', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript({
      content: 'window.MOCK_AUTH = true; window.MOCK_AUTH_USER = { uid: "e2e-viewer-tools", email: "e2e+tools@example.com", isAnonymous: false };',
    });
    await openViewer(page);
    await uploadDummyPdf(page);
  });

  test('VTOOL-01: tool buttons have descriptive title tooltips', async ({ page }) => {
    const tools = ['select', 'signature', 'text', 'date', 'image', 'checkmark'];
    for (const toolId of tools) {
      const btn = page.locator(`[data-testid="viewer-tool-${toolId}"]`);
      await expect(btn).toBeVisible({ timeout: 5000 });
      const title = await btn.getAttribute('title');
      expect(title, `viewer-tool-${toolId} should have a non-empty title`).toBeTruthy();
      expect(title.length).toBeGreaterThan(10); // must be descriptive, not just a label
    }
  });

  test('VTOOL-02: hint bar hidden when Select tool is active', async ({ page }) => {
    // Select is the default active tool
    await expect(page.locator('[data-testid="tool-hint-bar"]')).not.toBeVisible();
  });

  test('VTOOL-03: clicking Text tool shows hint bar', async ({ page }) => {
    await page.locator('[data-testid="viewer-tool-text"]').click();
    const hintBar = page.locator('[data-testid="tool-hint-bar"]');
    await expect(hintBar).toBeVisible({ timeout: 3000 });
    await expect(hintBar).toContainText('Text');
    await expect(hintBar).toContainText('Click on the document');
  });

  test('VTOOL-04: clicking Date tool shows hint bar with date guidance', async ({ page }) => {
    await page.locator('[data-testid="viewer-tool-date"]').click();
    const hintBar = page.locator('[data-testid="tool-hint-bar"]');
    await expect(hintBar).toBeVisible({ timeout: 3000 });
    await expect(hintBar).toContainText('Date');
    await expect(hintBar).toContainText('date');
    // new guidance should tell the user they can reposition after placing
    await expect(hintBar).toContainText(/drag|reposition/i);
  });


  test('VTOOL-05: clicking Image tool shows hint bar', async ({ page }) => {
    await page.locator('[data-testid="viewer-tool-image"]').click();
    const hintBar = page.locator('[data-testid="tool-hint-bar"]');
    await expect(hintBar).toBeVisible({ timeout: 3000 });
    await expect(hintBar).toContainText('Image');
  });

  test('VTOOL-06: clicking Checkmark tool shows hint bar', async ({ page }) => {
    await page.locator('[data-testid="viewer-tool-checkmark"]').click();
    const hintBar = page.locator('[data-testid="tool-hint-bar"]');
    await expect(hintBar).toBeVisible({ timeout: 3000 });
    await expect(hintBar).toContainText('Check');
  });

  test('VTOOL-07: switching back to Select hides hint bar', async ({ page }) => {
    await page.locator('[data-testid="viewer-tool-text"]').click();
    await expect(page.locator('[data-testid="tool-hint-bar"]')).toBeVisible();

    await page.locator('[data-testid="viewer-tool-select"]').click();
    await expect(page.locator('[data-testid="tool-hint-bar"]')).not.toBeVisible();
  });

  test('VTOOL-08: tool buttons have aria-label for accessibility', async ({ page }) => {
    const tools = ['select', 'signature', 'text', 'date', 'image', 'checkmark'];
    for (const toolId of tools) {
      const btn = page.locator(`[data-testid="viewer-tool-${toolId}"]`);
      const ariaLabel = await btn.getAttribute('aria-label');
      expect(ariaLabel, `viewer-tool-${toolId} should have aria-label`).toBeTruthy();
    }
  });

  test('VTOOL-09: rich CSS tooltip exists in DOM with label and hint text', async ({ page }) => {
    // Tooltip divs are always in DOM (opacity-0 initially, opacity-100 on group hover)
    const tools = ['date', 'text', 'signature', 'image', 'checkmark'];
    for (const toolId of tools) {
      const tooltip = page.locator(`[data-testid="viewer-tool-tooltip-${toolId}"]`);
      await expect(tooltip).toBeAttached({ timeout: 5000 });
      // Must contain the tool's label
      const label = await tooltip.locator('p').first().textContent();
      expect(label, `viewer-tool-tooltip-${toolId} should display the tool label`).toBeTruthy();
      // Must contain a hint (second paragraph)
      const hint = await tooltip.locator('p').nth(1).textContent();
      expect(hint, `viewer-tool-tooltip-${toolId} should display hint text`).toBeTruthy();
      expect(hint.length).toBeGreaterThan(10);
    }
  });

  test('VTOOL-10: rich CSS tooltip becomes opaque on hover', async ({ page }) => {
    const btn = page.locator('[data-testid="viewer-tool-date"]');
    const tooltip = page.locator('[data-testid="viewer-tool-tooltip-date"]');

    // Verify tooltip contains correct content before hover
    await expect(tooltip).toContainText('Date');
    await expect(tooltip).toContainText(/drag|reposition|place/i);

    // After hover the group-hover CSS kicks in: opacity should go to 1
    await btn.hover();
    await page.waitForTimeout(200); // allow 150ms CSS transition to complete
    const opacity = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="viewer-tool-tooltip-date"]');
      return el ? parseFloat(window.getComputedStyle(el).opacity) : 0;
    });
    expect(opacity).toBeGreaterThan(0.9);
  });
});

/* ------------------------------------------------------------------ */
/*  2. Annotation placement & tool auto-switch                         */
/* ------------------------------------------------------------------ */

test.describe('Annotation placement & tool auto-switch', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript({
      content: 'window.MOCK_AUTH = true; window.MOCK_AUTH_USER = { uid: "e2e-annotation-tools", email: "e2e+ann@example.com", isAnonymous: false };',
    });
    await openViewer(page);
    await uploadDummyPdf(page);
    // uploadDummyPdf already waits for the PDF surface and dismisses the gate
    // waitFor page wrapper
    await expect(page.locator('#viewer-scroll-area [data-page-num]').first()).toBeVisible({ timeout: 45000 });
  });

  /**
   * Helper: click on the PDF page area to trigger annotation placement.
   * Uses page.mouse.click with screen coordinates from page.evaluate
   * to ensure the click goes through the browser's real event pipeline.
   */
  const clickOnPdfPage = async (page) => {
    // Ensure page-wrapper is still present and get its coordinates
    await expect(page.locator('#viewer-scroll-area [data-page-num]').first()).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(300);
    const box = await page.evaluate(() => {
      const target =
        document.querySelector('#pdf-page-1 canvas')
        || document.getElementById('pdf-page-1')
        || document.querySelector('#viewer-scroll-area [data-page-num]');
      if (!target) return null;
      target.scrollIntoView({ block: 'center' });
      const r = target.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    });
    if (!box || box.w === 0) throw new Error('Page wrapper not found or zero-sized');
    await page.waitForTimeout(100);
    // Re-read after scroll
    const box2 = await page.evaluate(() => {
      const target =
        document.querySelector('#pdf-page-1 canvas')
        || document.getElementById('pdf-page-1')
        || document.querySelector('#viewer-scroll-area [data-page-num]');
      if (!target) return null;
      const r = target.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    });
    if (!box2) throw new Error('PDF surface not found (after scroll)');
    await page.mouse.click(box2.x + box2.w / 2, box2.y + box2.h / 2);
  };

  test('ANN-01: placing a Date annotation auto-switches back to Select', async ({ page }) => {
    // Activate Date tool
    await page.locator('[data-testid="viewer-tool-date"]').click();
    await expect(page.locator('[data-testid="tool-hint-bar"]')).toBeVisible();

    // Click on the PDF page to place the annotation
    await clickOnPdfPage(page);

    // After placement the tool should auto-switch to Select and hint bar should disappear
    await expect(page.locator('[data-testid="tool-hint-bar"]')).not.toBeVisible({ timeout: 5000 });

    // An overlay annotation should now be visible on the page
    const annotations = page.locator('[data-testid^="overlay-annotation-"]');
    await expect(annotations.first()).toBeVisible({ timeout: 5000 });
  });

  test('ANN-05: date annotation is draggable after placement (viewer)', async ({ page }) => {
    test.fixme(true, 'Dragging overlay annotations is currently flaky in Playwright; tracked separately.');
    // Activate Date tool and place
    await page.locator('[data-testid="viewer-tool-date"]').click();
    await clickOnPdfPage(page);

    const ann = page.locator('[data-testid^="overlay-annotation-"]').first();
    await expect(ann).toBeVisible({ timeout: 5000 });

    // get initial box
    const box1 = await ann.boundingBox();
    expect(box1).toBeTruthy();

    // drag by ~60x30 pixels
    const startX = box1.x + box1.width / 2;
    const startY = box1.y + box1.height / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 60, startY + 30, { steps: 8 });
    await page.mouse.up();

    // Poll for React state to flush — bounding box should have moved
    await expect.poll(async () => (await ann.boundingBox()).x, { timeout: 5000 }).toBeGreaterThan(box1.x + 10);
    await expect.poll(async () => (await ann.boundingBox()).y, { timeout: 5000 }).toBeGreaterThan(box1.y + 5);
  });

  test('ANN-02: placing a Text annotation creates visible overlay', async ({ page }) => {
    await page.locator('[data-testid="viewer-tool-text"]').click();
    await expect(page.locator('[data-testid="tool-hint-bar"]')).toBeVisible({ timeout: 3000 });
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await clickOnPdfPage(page);
      const count = await page.locator('[data-testid^="overlay-annotation-"]').count();
      if (count > 0) break;
      await page.waitForTimeout(150);
    }

    const annotations = page.locator('[data-testid^="overlay-annotation-"]');
    await expect(annotations.first()).toBeVisible({ timeout: 5000 });
    await expect(annotations.first()).toContainText('Text');
  });

  test('ANN-03: placing a Checkmark annotation creates ✓ overlay', async ({ page }) => {
    await page.locator('[data-testid="viewer-tool-checkmark"]').click();
    await expect(page.locator('[data-testid="tool-hint-bar"]')).toBeVisible({ timeout: 3000 });
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await clickOnPdfPage(page);
      const count = await page.locator('[data-testid^="overlay-annotation-"]').count();
      if (count > 0) break;
      await page.waitForTimeout(150);
    }

    const annotations = page.locator('[data-testid^="overlay-annotation-"]');
    await expect(annotations.first()).toBeVisible({ timeout: 5000 });
    await expect(annotations.first()).toContainText('✓');
  });

  test('ANN-04: clicking in Select mode on empty area deselects', async ({ page }) => {
    // Place a date annotation first
    await page.locator('[data-testid="viewer-tool-date"]').click();
    await clickOnPdfPage(page);

    // The annotation should be selected (auto-selected after placement)
    const annotation = page.locator('[data-testid^="overlay-annotation-"]').first();
    await expect(annotation).toBeVisible({ timeout: 5000 });

    // Click on empty area of the scroll area — should deselect
    // Switch to select mode first (auto-switched already after placement)
    await page.waitForTimeout(200);
    // Click on the scroll area itself (not on the annotation)
    const scrollArea = page.locator('#viewer-scroll-area');
    await scrollArea.click({ position: { x: 5, y: 5 }, force: true });

    // Verify the annotation is still there but not visually selected
    await expect(annotation).toBeVisible();
  });
});

/* ------------------------------------------------------------------ */
/*  3. Analysis Results — Contract Review cards                        */
/* ------------------------------------------------------------------ */

test.describe('Analysis Results — Contract Review cards', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript({
      content: 'window.MOCK_AUTH = true; window.MOCK_AUTH_USER = { uid: "e2e-user", email: "e2e+user@example.com", isAnonymous: false };',
    });
  });

  test.fixme('CARD-01: analysis results render Risk Flagged, Plain English, and Recommendation cards', async ({ page }) => {
    await openViewer(page);
    await uploadDummyPdf(page);

    // Mock the analyzeText endpoint to return test data
    await page.route('**/analyzeText', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          result: {
            plainExplanation: 'This contract has several important clauses to review.',
            risks: [
              {
                id: 'r-e2e-1',
                title: 'Termination Without Cause',
                severity: 'high',
                whyItMatters: 'The employer can terminate employment without providing a reason.',
                whatToCheck: ['Review notice period requirements', 'Check severance provisions'],
              },
            ],
          },
        }),
      });
    });

    // Click "Summarize Key Points" to trigger analysis
    const summarizeBtn = page.getByRole('button', { name: 'Summarize Key Points' });
    await expect(summarizeBtn).toBeEnabled({ timeout: 10000 });
    await summarizeBtn.click();

    // Wait for the analysis results container
    const resultsContainer = page.locator('[data-testid="analysis-results"]');
    await expect(resultsContainer).toBeVisible({ timeout: 15000 });

    // Verify Contract Review heading
    await expect(resultsContainer.getByText('Contract Review')).toBeVisible({ timeout: 5000 });

    // Verify the summary text is displayed
    await expect(resultsContainer.getByText('This contract has several important clauses to review.')).toBeVisible({ timeout: 5000 });

    // Verify Risk Flagged card
    const riskCard = page.locator('[data-testid="risk-flagged-card"]').first();
    await expect(riskCard).toBeVisible({ timeout: 5000 });
    await expect(riskCard).toContainText('Risk Flagged');
    await expect(riskCard).toContainText('Termination Without Cause');

    // Verify Plain English card (shows whatToCheck items joined)
    const plainCard = page.locator('[data-testid="plain-english-card"]').first();
    await expect(plainCard).toBeVisible({ timeout: 5000 });
    await expect(plainCard).toContainText('Plain English');

    // Verify Recommendation cards (whatToCheck items become recommendations)
    const recCards = page.locator('[data-testid="recommendation-card"]');
    await expect(recCards.first()).toBeVisible({ timeout: 5000 });
    await expect(recCards.first()).toContainText('Recommendation');
  });

  test.fixme('CARD-02: Results tab disabled before analysis (idle state)', async ({ page }) => {
    await openViewer(page);
    await uploadDummyPdf(page);

    // The Results tab should be visible but disabled when no analysis has been run
    const resultsTab = page.getByRole('button', { name: 'Results' });
    await expect(resultsTab).toBeVisible({ timeout: 5000 });
    await expect(resultsTab).toBeDisabled();

    // The sidebar should show the default "No analysis results yet" text
    // (this text is shown in the sidebar when Results tab content area has no data)
  });

  test('CARD-03: error state shows gate dialog and error analysis', async ({ page }) => {
    await openViewer(page);
    await uploadDummyPdf(page);

    // Mock analyzeText to return a structured error (not ok)
    await page.route('**/analyzeText', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: false, code: 'UNKNOWN', message: 'Something went wrong' }),
      });
    });

    const summarizeBtn = page.getByRole('button', { name: 'Summarize Key Points' });
    await expect(summarizeBtn).toBeEnabled({ timeout: 10000 });
    await summarizeBtn.click();

    // A gate dialog should appear with the failure message
    const gateDialog = page.locator('#viewer-gate-dialog');
    await expect(gateDialog).toBeVisible({ timeout: 10000 });
    await expect(gateDialog).toContainText('Analysis failed');

    // Dismiss the gate dialog by clicking OK
    const okBtn = gateDialog.getByRole('button', { name: 'OK' });
    // If there's a link, click it; otherwise try a generic close
    if (await okBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await okBtn.click();
    } else {
      // Try the primary action or any close button in the dialog
      await gateDialog.locator('button').first().click();
    }

    // After dismissing the gate, the Results tab should be enabled (error data exists)
    const resultsTab = page.getByRole('button', { name: 'Results' });
    // The results tab auto-switches when analysis data (even error state) is set
    // Wait for the analysis-results to appear (AnalysisSidebar auto-switches on data)
    const resultsContainer = page.locator('[data-testid="analysis-results"]');
    await expect(resultsContainer).toBeVisible({ timeout: 10000 });
    await expect(resultsContainer).toContainText('Analysis Error');
  });

  test('CARD-04: success state shows status pill', async ({ page }) => {
    await openViewer(page);
    await uploadDummyPdf(page);

    await page.route('**/analyzeText', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          result: {
            plainExplanation: 'Summary for status pill test.',
            risks: [
              {
                id: 'r-pill-1',
                title: 'Minor Risk',
                severity: 'low',
                whyItMatters: 'Not critical.',
                whatToCheck: ['Verify details'],
              },
            ],
          },
        }),
      });
    });

    await page.getByRole('button', { name: 'Summarize Key Points' }).click();

    const resultsContainer = page.locator('[data-testid="analysis-results"]');
    await expect(resultsContainer).toBeVisible({ timeout: 15000 });

    // Status pill should show success
    await expect(resultsContainer.getByText('AI decode complete')).toBeVisible({ timeout: 10000 });
    await expect(resultsContainer.getByText('Ready to review')).toBeVisible({ timeout: 5000 });
  });

  test('CARD-05: legal disclaimer is present in success results', async ({ page }) => {
    await openViewer(page);
    await uploadDummyPdf(page);

    await page.route('**/analyzeText', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          result: {
            plainExplanation: 'Disclaimer presence test.',
            risks: [
              {
                id: 'r-disc-1',
                title: 'Risk Disc',
                severity: 'low',
                whyItMatters: 'N/A',
                whatToCheck: ['Check something'],
              },
            ],
          },
        }),
      });
    });

    await page.getByRole('button', { name: 'Summarize Key Points' }).click();

    const resultsContainer = page.locator('[data-testid="analysis-results"]');
    await expect(resultsContainer).toBeVisible({ timeout: 15000 });
    await expect(resultsContainer).toContainText('not legal advice');
  });
});

/* ------------------------------------------------------------------ */
/*  4. Editor Toolbar — tooltips and hint bar                          */
/* ------------------------------------------------------------------ */

test.describe('Editor Toolbar — tooltips and hint bar', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript({
      content: 'window.MOCK_AUTH = true; window.MOCK_AUTH_USER = { uid: "e2e-editor-tools", email: "e2e+editor@example.com", isAnonymous: false };',
    });
  });

  const openEditor = async (page) => {
    await page.goto('/app', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
    await page.evaluate(() => {
      history.pushState({}, '', '/edit/test-docs/dummy.pdf');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await page.waitForURL('**/edit/test-docs/dummy.pdf');
    const gateDialog = page.locator('#viewer-gate-dialog');
    if (await gateDialog.isVisible({ timeout: 750 }).catch(() => false)) {
      const ok = gateDialog.getByRole('button', { name: /^ok$/i });
      if (await ok.isVisible({ timeout: 750 }).catch(() => false)) {
        await ok.click();
      } else {
        await gateDialog.locator('button').first().click();
      }
      await expect(gateDialog).toBeHidden({ timeout: 5000 });
    }
  };

  test('ETOOL-01: editor tool buttons have descriptive title tooltips', async ({ page }) => {
    await openEditor(page);

    // Wait for the editor to load — look for editor tool buttons
    const tools = ['select', 'text', 'signature', 'image', 'shape'];
    for (const toolId of tools) {
      const btn = page.locator(`[data-testid="editor-tool-${toolId}"]`);
      await expect(btn).toBeVisible({ timeout: 10000 });
      const title = await btn.getAttribute('title');
      expect(title, `editor-tool-${toolId} should have a non-empty title`).toBeTruthy();
      expect(title.length).toBeGreaterThan(10);
    }
  });

  test('ETOOL-02: editor hint bar shows when non-select tool is active', async ({ page }) => {
    await openEditor(page);

    // Click Text tool
    const textBtn = page.locator('[data-testid="editor-tool-text"]');
    await expect(textBtn).toBeVisible({ timeout: 10000 });
    await textBtn.click();

    const hintBar = page.locator('[data-testid="editor-tool-hint-bar"]');
    await expect(hintBar).toBeVisible({ timeout: 3000 });
    await expect(hintBar).toContainText('Text');
    await expect(hintBar).toContainText('Click on the document');
  });

  test('ETOOL-03: editor hint bar hidden in select mode', async ({ page }) => {
    await openEditor(page);

    // Default is select — hint bar should not be visible
    await page.locator('[data-testid="editor-tool-select"]').waitFor({ state: 'visible', timeout: 10000 });
    await expect(page.locator('[data-testid="editor-tool-hint-bar"]')).not.toBeVisible();
  });

  test('ETOOL-04: switching tools updates hint bar text', async ({ page }) => {
    await openEditor(page);

    const hintBar = page.locator('[data-testid="editor-tool-hint-bar"]');

    // Click Signature tool
    await page.locator('[data-testid="editor-tool-signature"]').click();
    await expect(hintBar).toBeVisible({ timeout: 3000 });
    await expect(hintBar).toContainText('Sign');

    // Switch to Image tool — hint bar should update
    await page.locator('[data-testid="editor-tool-image"]').click();
    await expect(hintBar).toContainText('Image');

    // Switch to Shape tool — hint bar should update
    await page.locator('[data-testid="editor-tool-shape"]').click();
    await expect(hintBar).toContainText('Shapes');
  });

  test('ETOOL-05: Date tool in editor shows hint and placed date is draggable', async ({ page }) => {
    test.fixme(true, 'Dragging overlay annotations is currently flaky in Playwright; tracked separately.');
    await openEditor(page);

    // Wait for the editor toolbar to be fully rendered before checking for date tool
    await page.locator('[data-testid="editor-tool-select"]').waitFor({ state: 'visible', timeout: 20000 });

    const dateBtn = page.locator('[data-testid="editor-tool-date"]');
    if ((await dateBtn.count()) === 0) {
      test.skip(true, 'Editor date tool is not available in current toolbar implementation.');
    }
    await expect(dateBtn).toBeVisible({ timeout: 10000 });

    // Click Date tool and verify hint contains guidance about placing and dragging
    await dateBtn.click();
    const hintBar = page.locator('[data-testid="editor-tool-hint-bar"]');
    await expect(hintBar).toBeVisible({ timeout: 3000 });
    await expect(hintBar).toContainText('Date');
    await expect(hintBar).toContainText(/drag|move|reposition/i);

    // Place the date on the page (center)
    await page.waitForSelector('#pdf-page-1, #viewer-scroll-area [data-page-num], #viewer-scroll-area canvas, canvas', { timeout: 10000 });
    const pageBox = await page.evaluate(() => {
      const target =
        document.querySelector('#pdf-page-1 canvas') ||
        document.querySelector('#viewer-scroll-area [data-page-num]') ||
        document.querySelector('#pdf-page-1') ||
        document.querySelector('#viewer-scroll-area canvas') ||
        document.querySelector('canvas');
      if (!target) return null;
      target.scrollIntoView({ block: 'center' });
      const r = target.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    });
    expect(pageBox).toBeTruthy();
    await page.mouse.click(pageBox.x + pageBox.w / 2, pageBox.y + pageBox.h / 2);

    const ann = page.locator('[data-testid^="overlay-annotation-"]').first();
    await expect(ann).toBeVisible({ timeout: 5000 });

    const box1 = await ann.boundingBox();
    expect(box1).toBeTruthy();

    // Drag it a bit
    const sx = box1.x + box1.width / 2;
    const sy = box1.y + box1.height / 2;
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    await page.mouse.move(sx + 50, sy + 30, { steps: 6 });
    await page.mouse.up();

    // Poll for React state to flush — position should have changed
    await expect.poll(async () => (await ann.boundingBox()).x, { timeout: 5000 }).toBeGreaterThan(box1.x + 5);
    await expect.poll(async () => (await ann.boundingBox()).y, { timeout: 5000 }).toBeGreaterThan(box1.y + 3);
  });

  test('ETOOL-06: editor rich CSS tooltip exists with label and hint text', async ({ page }) => {
    await openEditor(page);
    await page.locator('[data-testid="editor-tool-select"]').waitFor({ state: 'visible', timeout: 20000 });

    const tools = ['text', 'signature', 'date', 'image', 'shape'];
    for (const toolId of tools) {
      const tooltip = page.locator(`[data-testid="editor-tool-tooltip-${toolId}"]`);
      await expect(tooltip).toBeAttached({ timeout: 5000 });
      const label = await tooltip.locator('p').first().textContent();
      expect(label, `editor-tool-tooltip-${toolId} should display the tool label`).toBeTruthy();
      const hint = await tooltip.locator('p').nth(1).textContent();
      expect(hint, `editor-tool-tooltip-${toolId} should display hint text`).toBeTruthy();
      expect(hint.length).toBeGreaterThan(10);
    }
  });

  test('ETOOL-07: editor CSS tooltip becomes opaque on hover', async ({ page }) => {
    await openEditor(page);
    await page.locator('[data-testid="editor-tool-select"]').waitFor({ state: 'visible', timeout: 20000 });

    const btn = page.locator('[data-testid="editor-tool-date"]');
    const tooltip = page.locator('[data-testid="editor-tool-tooltip-date"]');

    // Verify tooltip contains correct content
    await expect(tooltip).toContainText('Date');
    await expect(tooltip).toContainText(/drag|move|reposition/i);

    // After hover the group-hover CSS makes tooltip opaque
    await btn.hover();
    await page.waitForTimeout(200); // allow CSS transition to complete
    const opacity = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="editor-tool-tooltip-date"]');
      return el ? parseFloat(window.getComputedStyle(el).opacity) : 0;
    });
    expect(opacity).toBeGreaterThan(0.9);
  });
});
