import { test, expect } from '@playwright/test';
import { generateBypassToken, BYPASS_COOKIE_NAME } from './utils/bypass';

test.describe('Algebra Translation Stability', () => {
  test.beforeEach(async ({ context }) => {
    const baseURL = test.info().project.use.baseURL || 'http://localhost:3000';
    const hostname = new URL(baseURL).hostname;
    const token = await generateBypassToken();
    await context.addCookies([{ name: BYPASS_COOKIE_NAME, value: token, domain: hostname, path: '/' }]);
  });

  test('should translate word problem question when switching language without refreshing', async ({ page }) => {
    await page.goto('/en/algebra');
    await page.click('#tab-wordproblem');
    
    // 1. Get the English question
    const questionEn = await page.locator('.question').innerText();
    expect(questionEn).toMatch(/[a-zA-Z]/); // Should contain English letters
    
    // 2. Switch to Hebrew via URL
    await page.goto('/he/algebra');
    
    // 3. Wait for the page to load
    await page.waitForSelector('[data-testid="algebra-page"]');
    
    // 4. Verify the question is now in Hebrew but SAME numbers
    const questionHe = await page.locator('.question').innerText();
    expect(questionHe).toMatch(/[\u0590-\u05FF]/); // Should contain Hebrew letters
    
    const numbersEn = questionEn.match(/\d+/g);
    const numbersHe = questionHe.match(/\d+/g);
    expect(numbersHe).toEqual(numbersEn);
  });

  test('should translate rounding prompt when language changes', async ({ page }) => {
    // 1. Go to rounding tab in English
    await page.goto('/en/algebra');
    await page.click('button:has-text("Rounding")');
    
    // 2. Wait for question and verify English
    const questionEn = page.locator('.question');
    await expect(questionEn).toContainText('Round');
    
    // 3. Switch to Hebrew
    await page.goto('/he/algebra');
    await page.click('button:has-text("עיגול מספרים")');
    
    // 4. Verify translation
    const questionHe = page.locator('.question');
    await expect(questionHe).toContainText('עגלו את');
    // Ensure params are replaced (not showing {num})
    const text = await questionHe.innerText();
    expect(text).not.toContain('{num}');
    expect(text).not.toContain('{count}');
  });
});
