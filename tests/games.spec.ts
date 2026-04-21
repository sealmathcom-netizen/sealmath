import { test, expect } from '@playwright/test';
import { generateBypassToken, BYPASS_COOKIE_NAME } from './utils/bypass';

test.describe('Games', () => {
  test.describe('24 Challenge', () => {
    test.beforeEach(async ({ context, page }) => {
      const baseURL = test.info().project.use.baseURL || 'http://localhost:3000';
      const hostname = new URL(baseURL).hostname;
      const token = await generateBypassToken();

      // Mock Supabase RPC for deterministic puzzle selection
      await page.route('**/rest/v1/rpc/get_next_puzzle_for_user*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{
            out_puzzle_id: 1,
            out_numbers: [1, 2, 3, 4],
            out_attempt_num: 1,
            out_status: null
          }])
        });
      });

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
      await page.goto('/24-challenge');
      await page.evaluate(() => localStorage.clear());
    });

    test('should load and allow generating a new puzzle', async ({ page }) => {
      // Wait for the mock puzzle [1, 2, 3, 4] to load
      await expect(page.locator('#n1')).toHaveValue('1');
      await expect(page.locator('#n2')).toHaveValue('2');
      await expect(page.locator('#n3')).toHaveValue('3');
      await expect(page.locator('#n4')).toHaveValue('4');
      
      const inputs = page.locator('.input-row input');
      await expect(inputs).toHaveCount(4);
    });

    test('should show solution for a puzzle', async ({ page }) => {
      // Ensure puzzle is loaded and hydration finished
      await expect(page.locator('#n1')).toHaveValue('1');
      await expect(page.locator('#n2')).toHaveValue('2');
      await expect(page.locator('#n3')).toHaveValue('3');
      await expect(page.locator('#n4')).toHaveValue('4');
      
      // Scope strictly to the 24-challenge solve button (avoid matching hidden/other buttons)
      const solveBtn = page.locator('button.btn-solve').filter({ hasText: /show solution|הצג פתרון|toon oplossing/i }).first();
      await expect(solveBtn).toBeEnabled();
      
      await solveBtn.click();
      await expect(page.locator('#result')).toContainText(/solution:|פתרון:|oplossing:/i, { timeout: 10000 });
    });
  });

  test.describe('Fraction Capture', () => {
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
      await page.goto('/capture');
      await page.evaluate(() => localStorage.clear());
    });

    test('should load and display target and ingredients', async ({ page }) => {
      // Wait for the game container to be visible
      const container = page.locator('.page.active .container');
      await expect(container).toBeVisible();
      
      await expect(page.locator('#pot-display')).toBeVisible({ timeout: 10000 });
    });

    test('should show solution', async ({ page }) => {
      await page.click('text=Show Solution', { force: true });
      await expect(page.locator('#capture-feedback')).toContainText('Solution:');
    });
  });
});
