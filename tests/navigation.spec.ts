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
    await page.goto('/');
  });

  test('should load homepage with hero section', async ({ page }) => {
    await expect(page.locator('.home-hero-title')).toBeVisible();
    // Use a localized match for "Master Math" if needed, but home-hero-title class is usually enough
    await expect(page.locator('.home-hero-title')).toContainText(/Master Math|לימדו מתמטיקה|Leer Wiskunde/);
  });

  test('should navigate to all core pages', async ({ page }) => {
    // Start on homepage
    await expect(page.locator('.home-hero-title')).toBeVisible();

    // Navigate to 24 Challenge
    await page.getByTestId('nav-link-24-challenge').click();
    await expect(page.locator('h1')).toContainText(/24 Challenge|אתגר ה-24|24 Uitdaging/i);

    // Navigate to Fraction Capture
    await page.getByTestId('nav-link-capture').click();
    await expect(page.locator('h1')).toContainText(/Fraction Capture|לכידת שברים|Breuken Vangen/i);

    // Navigate to Algebra Basics
    await page.getByTestId('nav-link-algebra').click();
    await expect(page.locator('h1')).toContainText(/Algebra/i);

    // Navigate to Feedback
    await page.getByTestId('nav-link-contact').click();
    await expect(page.locator('h1')).toContainText(/Feedback|משוב/i);

    // Navigate back to Home
    await page.getByTestId('nav-link-home').click();
    await expect(page.locator('.home-hero-title')).toBeVisible();
  });
});
