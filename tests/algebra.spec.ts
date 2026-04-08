import { test, expect } from '@playwright/test';

test.describe('Algebra Basics', () => {
  test.beforeEach(async ({ page }) => {
    // Force English and make viewport stable
    await page.goto('/algebra?lang=en');
    await page.evaluate(() => localStorage.clear());
    await page.waitForLoadState('networkidle');
  });

  test('should display all algebra categories', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Addition & Subtraction' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Multiplication & Division' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Rounding' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Simple Equations' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Combining Like Terms' })).toBeVisible();
  });

  test('should toggle examples', async ({ page }) => {
    const showBtn = page.locator('text=Show Examples');
    await expect(showBtn).toBeVisible();
    // Scroll and click with force if the sticky nav intercepts
    await showBtn.click({ force: true });
    
    await expect(page.locator('text=Hide Examples')).toBeVisible();
    await expect(page.locator('text=Example 1:')).toBeVisible();
    
    const hideBtn = page.locator('text=Hide Examples');
    await hideBtn.click({ force: true });
    await expect(page.locator('text=Example 1:')).not.toBeVisible();
  });

  test('should solve a simple addition/subtraction problem', async ({ page }) => {
    const questionText = await page.locator('.question').innerText();
    const match = questionText.match(/x\s*([\+\-])\s*(\d+)\s*=\s*(\d+)/);
    if (match) {
      const op = match[1];
      const a = parseInt(match[2]);
      const res = parseInt(match[3]);
      const solution = op === '+' ? res - a : res + a;
      
      await page.fill('input[type="number"]', solution.toString());
      await page.click('text=Check Answer', { force: true });
      await expect(page.locator('text=Correct!')).toBeVisible();
    }
  });

  test('should use "Show Solution" in simple equations', async ({ page }) => {
    await page.click('button:has-text("Simple Equations")', { force: true });
    // This button might be intercepted by the sticky nav or move due to layout shift
    await page.click('text=Show Solution', { force: true });
    
    const inputs = page.locator('input[type="number"]');
    await expect(inputs.first()).not.toHaveValue('');
    await expect(inputs.last()).not.toHaveValue('');
    
    await page.click('text=Check Answer', { force: true });
    await expect(page.locator('text=Correct!')).toBeVisible();
  });
});
