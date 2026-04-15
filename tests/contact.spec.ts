import { test, expect } from '@playwright/test';
import { generateBypassToken, BYPASS_COOKIE_NAME } from './utils/bypass';
import * as path from 'path';

test.describe('Contact Form', () => {
  test.beforeEach(async ({ context }) => {
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
  });

  test('should submit successfully with an attachment in Hebrew', async ({ page }) => {
    await page.goto('/he/contact');
    
    // 1. Verify UI Labels (using more robust text matching)
    await expect(page.getByText('שם', { exact: true })).toBeVisible();
    await expect(page.getByText('אימייל', { exact: true })).toBeVisible();
    await expect(page.getByText('קובץ מצורף', { exact: false })).toBeVisible();

    // 2. Fill the form
    await page.getByLabel('שם').fill('בודק בדיקה');
    await page.getByLabel('אימייל').fill('test@example.com');
    await page.getByLabel('המשוב שלך').fill('שלום, זו הודעת בדיקה עם קובץ מצורף.');

    // 3. Upload a dummy file
    await page.setInputFiles('input[name="attachment"]', {
      name: 'test-file.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('this is a test file content')
    });

    // 4. Submit
    await page.getByRole('button', { name: 'שלח משוב' }).click();

    // 5. Verify Success Message
    // Note: We check for the status div content
    await expect(page.locator('#status')).toContainText('המשוב נשלח');
    
    // 6. Verify fields are cleared
    await expect(page.getByLabel('שם')).toHaveValue('');
    await expect(page.getByLabel('אימייל')).toHaveValue('');
    await expect(page.getByLabel('המשוב שלך')).toHaveValue('');
    
    // Verify file input is cleared
    const fileInputValue = await page.locator('input[name="attachment"]').inputValue();
    expect(fileInputValue).toBe('');
  });

  test('should handle RTL/LTR direction based on content', async ({ page }) => {
    await page.goto('/contact');
    
    const nameInput = page.getByLabel('Name');
    
    // Type English - should be LTR
    await nameInput.fill('English Name');
    await expect(nameInput).toHaveAttribute('dir', 'ltr');

    // Type Hebrew - should be RTL
    await nameInput.fill('שם בעברית');
    await expect(nameInput).toHaveAttribute('dir', 'rtl');
  });
});
