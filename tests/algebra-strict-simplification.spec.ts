import { test, expect } from '@playwright/test';
import { generateBypassToken, BYPASS_COOKIE_NAME } from './utils/bypass';

test.describe('Algebra Strict Simplification', () => {
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

  test('should reject unsimplified final answers in Complex Equations (e.g. x = 14/2)', async ({ page }) => {
    await page.click('#tab-complex', { force: true });

    // Get the target answer from "Show Solution"
    await page.locator('button:has-text("Show Solution"), button:has-text("הצג פתרון"), button:has-text("Toon Oplossing")').click({ force: true });
    const resultElement = page.getByTestId('solution-steps').locator('div[data-step-value]').last();
    const solutionAnswerRaw = (await resultElement.getAttribute('data-step-value')) || '';
    const solutionValue = solutionAnswerRaw.includes('=')
      ? solutionAnswerRaw.split('=')[1].trim()
      : solutionAnswerRaw.trim();

    const xVal = parseInt(solutionValue);
    if (isNaN(xVal)) return;

    // Type an unsimplified equivalent: x = [2 * xVal] / 2
    const unsimplified = `x=${xVal * 2}/2`;

    // Add row and fill
    await page.locator('.btn-add-row').first().click({ force: true });
    const mathInputs = page.locator('math-field');
    const lastInput = mathInputs.last();
    await lastInput.evaluate((el: any, val: string) => {
      el.value = val;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, unsimplified);

    await page.locator('.btn-check').click({ force: true });

    // Should NOT be correct, should show "Please simplify"
    await expect(page.getByTestId('algebra-result')).toContainText(/Please simplify|נא לפשט|Vereenvoudig/i);
    await expect(page.getByTestId('algebra-result')).not.toContainText(/Correct|נכון|Juist/i);
  });

  test('should reject unsimplified final answers in Combining Like Terms (e.g. 5x + 3x)', async ({ page }) => {
    await page.click('#tab-combinelike', { force: true });

    const question = await page.locator('.question').innerText();
    const variable = question.match(/[a-z]/)?.[0] || 'x';

    // Type the question itself as the answer (numerically correct, but not simplified)
    const mathField = page.locator('math-field').first();
    await mathField.evaluate((el: any, val: string) => {
      el.value = val;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, question);

    await page.locator('.btn-check').click({ force: true });

    // Should show "Please simplify"
    await expect(page.getByTestId('algebra-result')).toContainText(/Please simplify|נא לפשט|Vereenvoudig/i);
  });

  test('should reject using the wrong variable in Fractions + Like Terms', async ({ page }) => {
    await page.click('#tab-fractionlike', { force: true });

    const mathInputs = page.locator('math-field');
    const lastInput = mathInputs.last();
    await lastInput.click();
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
    await page.keyboard.type('q');

    await page.locator('#btn-check-fractionlike').click({ force: true });
    const result = page.getByTestId('algebra-result');
    await expect(result).toBeVisible();
    await expect(result).toContainText(/use only the exercise variable|השתמש רק במשתנה|variabele van de opgave|Incorrect|לא נכון|Onjuist/i);
    await expect(result).not.toContainText(/\bCorrect\b|\bנכון\b|\bJuist\b/i);
  });

  test('should reject complex answer when any step uses a wrong variable', async ({ page }) => {
    await page.click('#tab-complex', { force: true });

    const firstInput = page.locator('math-field').first();
    await firstInput.evaluate((el: any, val: string) => {
      el.value = val;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, 'q=1');

    await page.locator('#btn-check-complex').click({ force: true });
    const result = page.getByTestId('algebra-result');
    await expect(result).toBeVisible();
    await expect(result).toContainText(/use only the exercise variable|השתמש רק במשתנה|variabele van de opgave|Incorrect|לא נכון|Onjuist/i);
    await expect(result).not.toContainText(/\bCorrect\b|\bנכון\b|\bJuist\b/i);
  });
});
