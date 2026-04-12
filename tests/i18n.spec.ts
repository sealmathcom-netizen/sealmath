import { test, expect } from '@playwright/test';
import { generateBypassToken, BYPASS_COOKIE_NAME } from './utils/bypass';

test.describe('Internationalization (i18n)', () => {
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

  test('should switch languages correctly', async ({ page }) => {
    await page.goto('/?lang=en');

    // 1. Initial English check (homepage)
    await expect(page.locator('.home-hero-title')).toContainText('Master Math');

    // 2. Switch to Hebrew
    await page.selectOption('#lang-switcher', 'he');
    await expect(page.locator('.home-hero-title')).toContainText('לימדו מתמטיקה');

    // 3. Switch to Dutch
    await page.selectOption('#lang-switcher', 'nl');
    await expect(page.locator('.home-hero-title')).toContainText('Leer Wiskunde');

    // 4. Persistence check after reload (lang is in URL and localStorage)
    await page.reload();
    await expect(page.locator('.home-hero-title')).toContainText('Leer Wiskunde');

    // 5. Switch back to English
    await page.selectOption('#lang-switcher', 'en');
    await expect(page.locator('.home-hero-title')).toContainText('Master Math');
  });
});
