import { test, expect } from '@playwright/test';
import { generateBypassToken, BYPASS_COOKIE_NAME } from './utils/bypass';

test.describe('Algebra UX & Persistence Stability', () => {
  test.beforeEach(async ({ context, page }) => {
    const baseURL = test.info().project.use.baseURL || 'http://localhost:3000';
    const hostname = new URL(baseURL).hostname;
    const token = await generateBypassToken();
    
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
  });

  test('should persevere tab selection across page reloads (Cookie/Session Sync)', async ({ page }) => {
    await page.goto('/en/algebra');
    await page.waitForSelector('[data-testid="algebra-page"]');

    // 1. Select 'Complex' tab
    await page.click('#tab-complex');
    await expect(page.locator('#tab-complex')).toHaveCSS('background-color', /rgb\(142, 68, 173\)|rgb\(231, 76, 60\)|var\(--accent\)/);

    // 2. Reload the page
    await page.reload();
    await page.waitForSelector('[data-testid="algebra-page"]');

    // 3. Verify 'Complex' is still active (via persistence layer)
    await expect(page.locator('#tab-complex')).toHaveCSS('background-color', /rgb\(142, 68, 173\)|rgb\(231, 76, 60\)|var\(--accent\)/);
    await expect(page.locator('h2')).toContainText(/First-degree equation/i);
  });

  test('should persevere exercise progress across language switches (Session Persistence)', async ({ page }) => {
    await page.goto('/en/algebra');
    await page.waitForSelector('[data-testid="algebra-page"]');

    // 1. Input something in the current exercise
    const input = page.locator('input[type="number"]').first();
    await input.fill('12345');

    // 2. Switch to Hebrew
    await page.goto('/he/algebra');
    await page.waitForSelector('[data-testid="algebra-page"]');

    // 3. Verify the number is still there
    const inputHe = page.locator('input[type="number"]').first();
    await expect(inputHe).toHaveValue('12345');
  });

  test('should enforce LTR directionality for mathematical expressions in Hebrew', async ({ page }) => {
    await page.goto('/he/algebra');
    await page.waitForSelector('[data-testid="algebra-page"]');

    // Check Question Display
    const question = page.locator('.question').first();
    const direction = await question.evaluate((el) => window.getComputedStyle(el).direction);
    const display = await question.evaluate((el) => window.getComputedStyle(el).display);

    // Assert defense against RTL flipping
    expect(direction).toBe('ltr');
    expect(['inline-block', 'block', 'flex']).toContain(display);
  });

  test('should suppress flicker by using the hydration shield', async ({ page }) => {
    // Navigate directly to a sub-tab
    await page.goto('/en/algebra?tab=rounding');
    
    // The "Addition" section should NOT be visible during the initial moment
    // because the shield's state is 'null' and 'isHydrated' is false initially.
    const addSubQuestion = page.locator('#tab-addsub-content');
    await expect(addSubQuestion).not.toBeVisible();

    // Eventually, Rounding should appear
    await expect(page.locator('h2')).toContainText(/Rounding/i, { timeout: 10000 });
  });
});
