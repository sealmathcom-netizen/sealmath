import { test, expect } from '@playwright/test';

test.describe('Internationalization (i18n)', () => {
  test('should switch languages correctly', async ({ page }) => {
    await page.goto('/?lang=en');

    // 1. Initial English check
    await expect(page.locator('h1')).toContainText('24 Challenge');

    // 2. Switch to Hebrew
    await page.selectOption('#lang-switcher', 'he');
    await expect(page.locator('h1')).toContainText('אתגר ה-24');

    // 3. Switch to Dutch
    await page.selectOption('#lang-switcher', 'nl');
    await expect(page.locator('h1')).toContainText('De 24 Uitdaging');

    // 4. Persistence check after reload (lang is in URL and localStorage)
    await page.reload();
    await expect(page.locator('h1')).toContainText('De 24 Uitdaging');

    // 5. Switch back to English
    await page.selectOption('#lang-switcher', 'en');
    await expect(page.locator('h1')).toContainText('24 Challenge');
  });
});
