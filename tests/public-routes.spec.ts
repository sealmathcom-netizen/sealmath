import { test, expect } from '@playwright/test';

const LANGUAGES = ['en', 'nl', 'he'];

test.describe('Public Routes', () => {
  // Deliberately NOT setting the test-bypass-token cookie
  // This simulates a completely unauthenticated user

  for (const lang of LANGUAGES) {
    test(`should allow access to home page without login in ${lang}`, async ({ page }) => {
      const response = await page.goto(`/?lang=${lang}`);
      expect(response?.ok()).toBeTruthy();
      
      // Ensure we are not redirected to login
      await expect(page).not.toHaveURL(/.*\/login/);
      await expect(page.locator('.home-hero-title')).toBeVisible();
    });

    test(`should allow access to terms page without login in ${lang}`, async ({ page }) => {
      const response = await page.goto(`/terms?lang=${lang}`);
      expect(response?.ok()).toBeTruthy();
      
      // Ensure we are not redirected to login
      await expect(page).not.toHaveURL(/.*\/login/);
      await expect(page).toHaveURL(/.*\/terms/);
    });

    test(`should allow access to privacy page without login in ${lang}`, async ({ page }) => {
      const response = await page.goto(`/privacy?lang=${lang}`);
      expect(response?.ok()).toBeTruthy();
      
      // Ensure we are not redirected to login
      await expect(page).not.toHaveURL(/.*\/login/);
      await expect(page).toHaveURL(/.*\/privacy/);
    });

    test(`should show auth wall on protected routes when unauthenticated in ${lang}`, async ({ page }) => {
      await page.goto(`/algebra?lang=${lang}`);
      
      // We should NOT be redirected away (for SEO purposes)
      await expect(page).not.toHaveURL(/.*\/login/);
      
      // Instead, the "Auth Wall" (login card) must be visible
      await expect(page.locator('.login-card')).toBeVisible();
    });
  }
});
