import { test, expect } from '@playwright/test';
import { generateBypassToken, BYPASS_COOKIE_NAME } from './utils/bypass';

test.describe('Navigation', () => {
  test.beforeEach(async ({ context, page }) => {
    const baseURL = test.info().project.use.baseURL || 'http://localhost:3000';
    const hostname = new URL(baseURL).hostname;
    const token = await generateBypassToken();
    
    // console.log(`[Test Debug] Setting bypass cookie for hostname: ${hostname}`);
    
    await context.addCookies([
      {
        name: BYPASS_COOKIE_NAME,
        value: token,
        domain: hostname,
        path: '/',
        secure: baseURL.startsWith('https'),
        sameSite: 'Lax'
      },
      {
        name: 'test-bypass-active',
        value: 'true',
        domain: hostname,
        path: '/',
        secure: baseURL.startsWith('https'),
        sameSite: 'Lax'
      }
    ]);
    await page.goto('/?lang=en');
  });

  test('should load homepage with hero section', async ({ page }) => {
    await expect(page.locator('.home-hero-title')).toBeVisible();
    await expect(page.locator('.home-hero-title')).toContainText('Master Math');
  });

  test('should navigate to all core pages', async ({ page }) => {
    // Start on homepage
    await expect(page.locator('.home-hero-title')).toBeVisible();

    // Navigate to 24 Challenge
    await page.click('nav >> text=24 Challenge');
    await expect(page.locator('h1')).toContainText('24 Challenge');

    // Navigate to Fraction Capture
    await page.click('nav >> text=Fraction Capture');
    await expect(page.locator('h1')).toContainText('Fraction Capture');

    // Navigate to Algebra Basics
    await page.click('nav >> text=Algebra Basics');
    await expect(page.locator('h1')).toContainText('Algebra Basics');

    // Navigate to Feedback
    await page.click('nav >> text=Feedback');
    await expect(page.locator('h1')).toContainText('Feedback');

    // Navigate back to Home
    await page.click('nav >> text=Home');
    await expect(page.locator('.home-hero-title')).toBeVisible();
  });
});
