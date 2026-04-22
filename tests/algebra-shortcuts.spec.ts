import { test, expect } from '@playwright/test';
import { generateBypassToken, BYPASS_COOKIE_NAME } from './utils/bypass';

test.describe('Algebra Keyboard Shortcuts', () => {
  test.beforeEach(async ({ context }) => {
    const baseURL = test.info().project.use.baseURL || 'http://localhost:3000';
    const hostname = new URL(baseURL).hostname;
    const token = await generateBypassToken();
    await context.addCookies([{ name: BYPASS_COOKIE_NAME, value: token, domain: hostname, path: '/' }]);
  });

  test('should support Cmd+F12 to add row and Cmd+F11 to remove row in Word Problems', async ({ page }) => {
    await page.goto('/en/algebra?tab=wordproblem');
    await page.waitForSelector('[data-testid="algebra-page"]');

    const modifier = 'Control';

    // 1. Initial state: 1 row
    const rows = page.getByTestId('algebra-input');
    await expect(rows).toHaveCount(1);

    // 2. Add row via Ctrl+F12
    await page.waitForTimeout(500); // Wait for listener to attach
    await page.keyboard.press(`${modifier}+F12`);
    await expect(rows).toHaveCount(2);

    // 3. Add another row
    await page.keyboard.press(`${modifier}+F12`);
    await expect(rows).toHaveCount(3);

    // 4. Remove row via Ctrl+F11
    await page.keyboard.press(`${modifier}+F11`);
    await expect(rows).toHaveCount(2);

    // 5. Remove another row
    await page.keyboard.press(`${modifier}+F11`);
    await expect(rows).toHaveCount(1);
  });

  test('should support Ctrl+F12 to add row in Advanced Algebra (sanity check)', async ({ page }) => {
    await page.goto('/en/algebra?tab=complex');
    await page.waitForSelector('[data-testid="algebra-page"]');

    const modifier = 'Control';

    const rows = page.getByTestId('algebra-input');
    await expect(rows).toHaveCount(1);

    await page.waitForTimeout(500);
    await page.keyboard.press(`${modifier}+F12`);
    await expect(rows).toHaveCount(2);
  });
});
