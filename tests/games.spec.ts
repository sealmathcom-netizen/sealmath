import { test, expect } from '@playwright/test';

test.describe('Games', () => {
  test.describe('24 Challenge', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/?lang=en');
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
    test.beforeEach(async ({ page }) => {
      await page.goto('/capture?lang=en');
    });

    test('should load and display target and ingredients', async ({ page }) => {
      await expect(page.locator('#pot-display')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('#fraction-board')).toBeVisible();
      const ingredients = page.locator('.cork-tile');
      await expect(ingredients).toHaveCount(4);
    });

    test('should show solution', async ({ page }) => {
      await page.click('text=Show Solution', { force: true });
      await expect(page.locator('text=Solution:')).toBeVisible();
    });
  });
});
