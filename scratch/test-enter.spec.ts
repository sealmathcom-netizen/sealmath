import { test, expect } from '@playwright/test';

test('hitting enter vs clicking check answer', async ({ page }) => {
  await page.goto('http://localhost:3000/algebra');
  
  // Enter addition & subtraction
  await page.getByRole('button', { name: /Addition & Subtraction/i }).click();

  // wait
  await page.waitForTimeout(1000);
  
  // Fill something incorrect
  await page.fill('input[type="number"]', '9999');
  
  // Press Enter
  await page.press('input[type="number"]', 'Enter');
  
  // Check what happened
  const msg1 = await page.locator('[data-testid="algebra-result"]').innerText();
  console.log("After Enter: ", msg1);

  // Click Check Answer
  await page.fill('input[type="number"]', '8888');
  await page.click('text=Check Answer');

  const msg2 = await page.locator('[data-testid="algebra-result"]').innerText();
  console.log("After Click: ", msg2);
});
