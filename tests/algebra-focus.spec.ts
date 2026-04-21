import { test, expect } from '@playwright/test';
import { generateBypassToken, BYPASS_COOKIE_NAME } from './utils/bypass';

test.describe('Algebra Focus Test', () => {
  test.beforeEach(async ({ context, page }) => {
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

    await page.goto('/algebra');
    await page.waitForSelector('[data-testid="algebra-page"]', { timeout: 15000 });
  });

  test('should restore input focus after correct answer or next exercise in AdvancedAlgebraWindow', async ({ page }) => {
    await page.click('#tab-complex', { force: true });
    
    // Wait for the solution steps to appear
    await expect(page.getByTestId('solution-steps')).toBeVisible({ timeout: 10000 });
    
    // Check initial focus
    await page.waitForTimeout(500);
    const initialFocused = await page.evaluate(() => document.activeElement?.tagName);
    console.log('Advanced: Initial Focused Element:', initialFocused);

    // Click Show Solution to enable Next Exercise
    await page.locator('button:has-text("Show Solution")').first().click();
    
    // Click Next Exercise
    await page.locator('button:has-text("Next Exercise")').first().click();
    
    // Wait a bit for React to render and focus
    await page.waitForTimeout(500);
    const nextFocused = await page.evaluate(() => document.activeElement?.tagName);
    console.log('Advanced: Next Focused Element:', nextFocused);
    
    expect(nextFocused).toBe('MATH-FIELD');
  });

  test('should NOT revert "Next Exercise" button due to autofocus after clicking "Show Solution"', async ({ page }) => {
    await page.click('#tab-complex', { force: true });
    
    // 1. Click Show Solution
    await page.locator('button:has-text("Show Solution")').first().click();
    
    // 2. Wait for potential autofocus (the 100ms timeout in the component)
    await page.waitForTimeout(500);
    
    // 3. Verify the button is STILL "Next Exercise"
    const nextBtn = page.locator('button:has-text("Next Exercise")');
    await expect(nextBtn).toBeVisible();
    
    // 4. Verify the check button is NOT visible
    const checkBtn = page.locator('button:has-text("Check Answer")');
    await expect(checkBtn).not.toBeVisible();
  });
});
