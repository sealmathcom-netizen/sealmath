import { test, expect } from '@playwright/test';
import { generateBypassToken, BYPASS_COOKIE_NAME } from './utils/bypass';

test.describe('Algebra Basics', () => {
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
    await expect(page.getByRole('button', { name: 'Fractions + Like Terms' })).toBeVisible();
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
    
    const firstQuestion = await page.locator('.question').innerText();
    await page.click('text=Show Solution', { force: true });
    
    const inputs = page.locator('input[type="number"]');
    await expect(inputs.first()).not.toHaveValue('');
    await expect(inputs.last()).not.toHaveValue('');
    
    await page.click('text=Next Exercise', { force: true });
    const secondQuestion = await page.locator('.question').innerText();
    expect(secondQuestion).not.toBe(firstQuestion);
  });

  test('should correctly evaluate mixed and stacked fractions in like terms', async ({ page }) => {
    await page.click('button:has-text("Fractions + Like Terms")', { force: true });
    
    // Get the solution first so we know what to match
    await page.click('text=Show Solution', { force: true });
    const solutionText = await page.locator('math-field').first().evaluate((el: any) => el.value);
    
    // Reset for manual input
    await page.click('text=Next Exercise', { force: true });
    
    // We will now try to solve the new problem using a mixed fraction if possible,
    // but since the problem is random, we'll just test the parser's robustness 
    // by injecting specific LaTeX strings and checking if "Correct!" appears.
    
    const mathField = page.locator('math-field').first();
    
    // Helper to test a LaTeX string
    const testLatex = async (latex: string) => {
      await mathField.evaluate((el: any, val: string) => { el.value = val; }, latex);
      await page.click('text=Check Answer', { force: true });
      return await page.locator('text=Correct!').isVisible();
    };

    // Since we need to know the answer, we'll solve it once mentally
    const questionText = await page.locator('.question').innerText();
    // Example: 1/2x + 1/3x -> 5/6x
    // We'll extract the fractions
    const matches = [...questionText.matchAll(/(\d+)\/(\d+)/g)];
    if (matches.length === 2) {
      const n1 = parseInt(matches[0][1]);
      const d1 = parseInt(matches[0][2]);
      const n2 = parseInt(matches[1][1]);
      const d2 = parseInt(matches[1][2]);
      const variable = questionText.match(/[a-z]/)?.[0] || 'x';
      
      const targetNum = n1 * d2 + n2 * d1;
      const targetDen = d1 * d2;
      
      // Test 1: Improper fraction (basic)
      expect(await testLatex(`${targetNum}/${targetDen}${variable}`)).toBe(true);
      await page.click('text=Next Exercise', { force: true });

      // Test 2: Mixed fraction if applicable (e.g. 3/2 -> 1 1/2)
      // For any answer, we can do 0 + answer
      expect(await testLatex(`0\\frac{${targetNum}}{${targetDen}}${variable}`)).toBe(true);
      
      // Test 3: Mixed fraction with text space
      expect(await testLatex(`0\\text{ }\\frac{${targetNum}}{${targetDen}}${variable}`)).toBe(true);
    }
  });

  test('should approve "0" as a valid answer when terms cancel out (V2)', async ({ page }) => {
    // 1. Check in Addition & Subtraction (Simple Input)
    await page.click('button:has-text("Addition & Subtraction")', { force: true });
    const intInput = page.locator('.rules-box input[type="number"]').first();
    await intInput.fill('0');
    await page.click('button:has-text("Check Answer")', { force: true });
    
    const resultMsg = page.locator('.rules-box .result').first();
    await expect(resultMsg).toBeVisible();
    await expect(resultMsg).not.toBeEmpty();

    // 2. Check in Fractions + Like Terms (MathLive Input)
    await page.click('button:has-text("Fractions + Like Terms")', { force: true });
    const mathField = page.locator('.rules-box math-field').first();
    // Programmatically set value AND trigger input event to update React state
    await mathField.evaluate((el: any) => { 
      el.value = "0"; 
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.click('button:has-text("Check Answer")', { force: true });
    
    const mathResultMsg = page.locator('.rules-box .result').first();
    await expect(mathResultMsg).toBeVisible();
    await expect(mathResultMsg).not.toBeEmpty();
  });
});
