import { test, expect } from '@playwright/test';
import { generateBypassToken, BYPASS_COOKIE_NAME } from './utils/bypass';

test.describe('Navigation Localization', () => {
  test.beforeEach(async ({ context }) => {
    const baseURL = test.info().project.use.baseURL || 'http://localhost:3000';
    const hostname = new URL(baseURL).hostname;
    const token = await generateBypassToken();

    await context.addCookies([{
      name: BYPASS_COOKIE_NAME,
      value: token,
      domain: hostname,
      path: '/',
      secure: baseURL.startsWith('https'),
      sameSite: 'Lax'
    }]);
  });

  test('navbar links should include language prefix when in Hebrew', async ({ page }) => {
    // 1. Go to Hebrew homepage
    await page.goto('/he');
    await expect(page.locator('.home-hero-title')).toBeVisible();

    // 2. Log and Verify all links in the nav for future-proofing
    const links = await page.locator('nav >> a').all();
    console.log(`[Test] Found ${links.length} links in nav on /he`);
    for (const link of links) {
        const text = await link.innerText();
        const href = await link.getAttribute('href');
        console.log(`[Test] Nav Link: "${text}" -> href: "${href}"`);
        
        // Verify every internal link starts with /he
        if (href && href.startsWith('/') && href !== '/') {
            expect(href.startsWith('/he'), `Link "${text}" with href "${href}" is missing the /he prefix`).toBeTruthy();
        }
    }

    // 3. Locate the Algebra Basics link in the nav
    const algebraLink = page.locator('nav >> a').filter({ hasText: 'יסודות האלגברה' });
    await expect(algebraLink).toBeVisible();
    
    // 4. Verify the href includes the /he/ prefix
    const href = await algebraLink.getAttribute('href');
    expect(href, 'Hebrew Algebra link should be prefixed with /he').toBe('/he/algebra');

    // 5. Click it and verify we stay in Hebrew
    await algebraLink.click();
    await expect(page).toHaveURL(/\/he\/algebra/);
    await expect(page.locator('h1')).toContainText('אלגברה בסיסית');
  });

  test('navbar links should NOT include language prefix when in English', async ({ page }) => {
    // 1. Go to English homepage
    await page.goto('/');
    await expect(page.locator('.home-hero-title')).toBeVisible();

    // 2. Locate the Algebra Basics link in the nav
    const algebraLink = page.locator('nav >> a').filter({ hasText: 'Algebra Basics' });
    await expect(algebraLink).toBeVisible();
    
    // 3. Verify the href is the clean /algebra path (English default)
    const href = await algebraLink.getAttribute('href');
    expect(href, 'English Algebra link should not have a prefix').toBe('/algebra');

    // 4. Click it and verify we stay in English
    await algebraLink.click();
    await expect(page).toHaveURL(/\/algebra/);
    await expect(page.locator('h1')).toContainText('Algebra Basics');
  });
});
