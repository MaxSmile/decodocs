import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Document Text Selection', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript({
            content: 'window.MOCK_AUTH = true; window.MOCK_AUTH_USER = { uid: "e2e-text-selection", email: "e2e+text@example.com", isAnonymous: false };',
        });
        await page.goto('/app', { waitUntil: 'domcontentloaded' });
        await page.waitForURL('**/view');
        await expect(page.locator('#viewer-root')).toBeVisible({ timeout: 15000 });
    });

    test('user can select text and trigger Explain action on PDF', async ({ page }) => {
        test.setTimeout(45000);
        const fileInput = page.locator('#viewer-root input[type="file"]').first();
        await fileInput.waitFor({ state: 'attached', timeout: 10000 });

        const pdfPath = path.join(__dirname, '../public/test-docs/dummy.pdf');
        await fileInput.setInputFiles(pdfPath);

        await expect(page.locator('canvas').first()).toBeVisible({ timeout: 30000 });
        const firstTextSpan = page.locator('.page-wrapper span').first();
        
        await expect(firstTextSpan).toBeVisible({ timeout: 15000 });

        // Select the text using a drag
        const box = await firstTextSpan.boundingBox();
        expect(box).not.toBeNull();
        await page.mouse.move(box.x, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width, box.y + box.height / 2);
        await page.mouse.up();

        await firstTextSpan.evaluate((el) => {
            const range = document.createRange();
            range.selectNodeContents(el);
            const selection = window.getSelection();
            if (!selection) return;
            selection.removeAllRanges();
            selection.addRange(range);
            document.dispatchEvent(new Event('selectionchange'));
        });
        
        const explainBtn = page.getByRole('button', { name: /Explain Selection/i });
        await expect(explainBtn).toBeEnabled({ timeout: 20000 });
    });
    
    test('user can select text and trigger Explain action on DOCX', async ({ page }) => {
        test.setTimeout(45000);
        const fileInput = page.locator('#viewer-root input[type="file"]').first();
        await fileInput.waitFor({ state: 'attached', timeout: 10000 });

        const docxPath = path.join(__dirname, '../public/test-docs/dummy.docx');
        await fileInput.setInputFiles(docxPath);

        await expect(page.locator('.docx-viewer-container')).toBeVisible({ timeout: 30000 });
        
        const contentContainer = page.locator('.docx-viewer-container');
        await expect(contentContainer).toBeVisible({ timeout: 10000 });

        const firstParagraph = page.locator('.docx-viewer-container section p').first();
        await expect(firstParagraph).toBeVisible({ timeout: 10000 });
        await firstParagraph.scrollIntoViewIfNeeded();

        // Select the text using a drag over the paragraph
        const box = await firstParagraph.boundingBox();
        expect(box).not.toBeNull();
        await page.mouse.move(box.x, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width - 2, box.y + box.height / 2);
        await page.mouse.up();
        
        const explainBtn = page.getByRole('button', { name: /Explain Selection/i });
        await expect(explainBtn).toBeEnabled({ timeout: 20000 });
    });
});
