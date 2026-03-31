import { test, expect } from '@playwright/test';

const footerInternalDestinations = [
  {
    href: '/view',
    assert: async (page) => {
      await expect(page.locator('#viewer-root')).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(/Upload a PDF/i)).toBeVisible();
    },
  },
  {
    href: '/how-it-works',
    assert: async (page) => {
      await expect(page.getByRole('heading', { name: 'From first PDF to clear next action' })).toBeVisible();
    },
  },
  {
    href: '/uses-cases',
    assert: async (page) => {
      await expect(page.getByRole('heading', { name: 'Understand before you commit' })).toBeVisible();
    },
  },
  {
    href: '/pricing',
    assert: async (page) => {
      await expect(page.getByRole('heading', { name: 'Plans for clear document decisions' })).toBeVisible();
    },
  },
  {
    href: '/about',
    assert: async (page) => {
      await expect(page.getByRole('heading', { name: 'About DecoDocs' })).toBeVisible();
    },
  },
  {
    href: '/contact',
    assert: async (page) => {
      await expect(page.getByRole('heading', { name: 'Contact' })).toBeVisible();
    },
  },
  {
    href: '/privacy',
    assert: async (page) => {
      await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();
    },
  },
  {
    href: '/terms',
    assert: async (page) => {
      await expect(page.getByRole('heading', { name: 'Terms of Service' })).toBeVisible();
    },
  },
];

const footerExternalDestinations = [
  'https://docs.decodocs.com/',
  'https://docs.decodocs.com/#getting-started',
];

test.describe('Marketing navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript({
      content: 'window.MOCK_AUTH = true; window.MOCK_AUTH_USER = null;',
    });
  });

  test('header navigation reaches the dedicated how-it-works page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.locator('header').getByRole('link', { name: 'How it works' }).click();
    await page.waitForURL('**/how-it-works');

    await expect(page.getByRole('heading', { name: 'From first PDF to clear next action' })).toBeVisible();
  });

  test('homepage step tiles deep-link to the matching how-it-works anchor', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.getByRole('link', { name: /Decode with AI/i }).click();
    await page.waitForURL('**/how-it-works#decode-with-ai');

    const stepSection = page.locator('#decode-with-ai');
    await expect(stepSection).toBeVisible();
    await expect(stepSection.getByRole('heading', { name: 'Decode with AI' })).toBeVisible();
  });

  test('footer internal links resolve to working destinations', async ({ page }) => {
    for (const destination of footerInternalDestinations) {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      const footer = page.locator('footer');
      await expect(footer.locator(`a[href="${destination.href}"]`).first()).toBeVisible();
      await footer.locator(`a[href="${destination.href}"]`).first().click();
      await destination.assert(page);
    }
  });

  test('footer external docs links respond successfully', async ({ page, request }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const footer = page.locator('footer');

    for (const href of footerExternalDestinations) {
      await expect(footer.locator(`a[href="${href}"]`).first()).toBeVisible();
      const response = await request.get(href, { timeout: 20000 });
      expect(response.ok(), `Expected ${href} to return a successful response`).toBeTruthy();
    }
  });
});
