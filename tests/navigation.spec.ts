import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?lang=en');
  });

  test('should navigate to all core pages', async ({ page }) => {
    // Wait for initial load
    await expect(page.locator('h1')).toBeVisible();
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
  });
});
