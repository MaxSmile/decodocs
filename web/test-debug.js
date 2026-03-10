const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('ERR:', err.message));
  await page.goto('http://localhost:5173/app', { waitUntil: 'networkidle' });
  await page.waitForURL('**/view');
  
  const fileInput = page.locator('#viewer-root input[type="file"]').first();
  await fileInput.waitFor({ state: 'attached', timeout: 10000 });
  await fileInput.setInputFiles(path.join(__dirname, 'public/test-docs/dummy.docx'));
  
  await page.waitForTimeout(5000);
  const html = await page.content();
  console.log('HTML SNIPPET:', html.substring(html.indexOf('viewer-canvas-area'), html.indexOf('viewer-canvas-area') + 1000));
  await browser.close();
})();
