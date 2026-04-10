import { test, expect } from '@playwright/test';

test.describe('Games', () => {
  test.describe('24 Challenge', () => {
    test.beforeEach(async ({ context, page }) => {
      await context.addCookies([{
        name: 'test-bypass-token',
        value: 'playwright-local-test-secret',
        domain: 'localhost',
        path: '/'
      }]);
      await page.goto('/24-challenge?lang=en');
      await page.evaluate(() => localStorage.clear());
    });

    test('should load and allow generating a new puzzle', async ({ page }) => {
      await page.click('text=New Puzzle', { force: true });
      const inputs = page.locator('.input-row input');
      await expect(inputs).toHaveCount(4);
      // Puzzles are generated on mount if history is empty. 
    });

    test('should show solution for a puzzle', async ({ page }) => {
      await page.click('text=New Puzzle', { force: true });
      await page.click('text=Show Solution', { force: true });
      await expect(page.locator('#result')).toContainText('Solution:');
    });
  });

  test.describe('Fraction Capture', () => {
    test.beforeEach(async ({ context, page }) => {
      await context.addCookies([{
        name: 'test-bypass-token',
        value: 'playwright-local-test-secret',
        domain: 'localhost',
        path: '/'
      }]);
      await page.goto('/capture?lang=en');
      await page.evaluate(() => localStorage.clear());
    });

    test('should load and display target and ingredients', async ({ page }) => {
      await expect(page.locator('#pot-display')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('#fraction-board')).toBeVisible();
      const ingredients = page.locator('.cork-tile');
      await expect(ingredients).toHaveCount(4);
    });

    test('should show solution', async ({ page }) => {
      await page.click('text=Show Solution', { force: true });
      await expect(page.locator('#capture-feedback')).toContainText('Solution:');
    });
  });
});
