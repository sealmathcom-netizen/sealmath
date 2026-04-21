import { test, expect } from '@playwright/test';
import { generateBypassToken, BYPASS_COOKIE_NAME } from './utils/bypass';

test.describe('Algebra Regression: State Clearing', () => {
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

  test('should clear solution/inputs when moving to next exercise in Simple Equations (FixedStepWindow)', async ({ page }) => {
    // Navigate to Simple Equations
    await page.click('#tab-twostep', { force: true });

    // 1. Show Solution to fill the fields
    await page.locator('button:has-text("Show Solution"), button:has-text("הצג פתרון"), button:has-text("Toon Oplossing")').click({ force: true });
    
    // Verify fields are filled
    const mathFields = page.getByTestId('algebra-input');
    await expect(async () => {
      const val = await mathFields.first().evaluate((el: any) => el.value);
      expect(val).not.toBe('');
    }).toPass();

    // 2. Click Next Exercise
    await page.click('button:has-text("Next Exercise"), button:has-text("תרגיל הבא"), button:has-text("Volgende Oefening")', { force: true });

    // 3. Verify fields are empty
    await expect(async () => {
      const fieldValues = await mathFields.all();
      for (const field of fieldValues) {
        const val = await field.evaluate((el: any) => el.value);
        expect(val).toBe('');
      }
    }).toPass();
  });

  test('should clear solution/inputs when moving to next exercise in Combining Like Terms (AdvancedAlgebraWindow)', async ({ page }) => {
    await page.click('#tab-combinelike', { force: true });

    // 1. Show Solution
    await page.locator('button:has-text("Show Solution"), button:has-text("הצג פתרון"), button:has-text("Toon Oplossing")').click({ force: true });
    
    // Verify fields are filled
    const mathFields = page.getByTestId('algebra-input');
    await expect(async () => {
      const val = await mathFields.first().evaluate((el: any) => el.value);
      expect(val).not.toBe('');
    }).toPass();

    // 2. Click Next Exercise
    await page.click('button:has-text("Next Exercise"), button:has-text("תרגיל הבא"), button:has-text("Volgende Oefening")', { force: true });

    // 3. Verify fields are empty (it should reset to a single empty row)
    await expect(async () => {
      const currentFields = await page.getByTestId('algebra-input').all();
      expect(currentFields.length).toBe(1);
      const val = await currentFields[0].evaluate((el: any) => el.value);
      expect(val).toBe('');
    }).toPass();
  });

  test('should clear solution/inputs when moving to next exercise in Complex Equations (AdvancedAlgebraWindow)', async ({ page }) => {
    await page.click('#tab-complex', { force: true });

    // 1. Show Solution
    await page.locator('button:has-text("Show Solution"), button:has-text("הצג פתרון"), button:has-text("Toon Oplossing")').click({ force: true });
    
    // Verify fields are filled
    const mathFields = page.getByTestId('algebra-input');
    await expect(async () => {
      const val = await mathFields.first().evaluate((el: any) => el.value);
      expect(val).not.toBe('');
    }).toPass();

    // 2. Click Next Exercise
    await page.click('button:has-text("Next Exercise"), button:has-text("תרגיל הבא"), button:has-text("Volgende Oefening")', { force: true });

    // 3. Verify fields are empty
    await expect(async () => {
      const currentFields = await page.getByTestId('algebra-input').all();
      expect(currentFields.length).toBe(1);
      const val = await currentFields[0].evaluate((el: any) => el.value);
      expect(val).toBe('');
    }).toPass();
  });
});
