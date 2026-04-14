import { test, expect } from '@playwright/test';

test.describe('Auth Alignment', () => {
  test('LoginCard should be right-aligned in Hebrew AuthWall', async ({ page }) => {
    await page.goto('/algebra?lang=he');
    await page.waitForSelector('.login-card');

    const card = page.locator('.login-card');
    const box = await card.boundingBox();
    const viewport = page.viewportSize();

    if (box && viewport) {
      // In Hebrew (RTL), the card should be closer to the right edge than the left.
      const leftMargin = box.x;
      const rightMargin = viewport.width - (box.x + box.width);
      
      // With 10vw padding on the right, rightMargin should be small, leftMargin large.
      expect(rightMargin).toBeLessThan(leftMargin);
    }
  });

  test('LoginCard should be left-aligned in English AuthWall', async ({ page }) => {
    await page.goto('/algebra?lang=en');
    await page.waitForSelector('.login-card');

    const card = page.locator('.login-card');
    const box = await card.boundingBox();
    const viewport = page.viewportSize();

    if (box && viewport) {
      // In English (LTR), the card should be closer to the left edge than the right.
      const leftMargin = box.x;
      const rightMargin = viewport.width - (box.x + box.width);
      
      expect(leftMargin).toBeLessThan(rightMargin);
    }
  });

  test('Login page should be centered', async ({ page }) => {
    await page.goto('/login?lang=en');
    const container = page.locator('.container').first();
    const box = await container.boundingBox();
    const viewport = page.viewportSize();

    if (box && viewport) {
      const centerX = box.x + box.width / 2;
      const viewportHalf = viewport.width / 2;
      // Allow some margin for centering
      expect(Math.abs(centerX - viewportHalf)).toBeLessThan(50);
    }
  });
});
