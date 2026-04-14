import { test, expect } from '@playwright/test';

const LANGUAGES = ['en', 'nl', 'he'];

test.describe('Public Routes', () => {
  // Deliberately NOT setting the test-bypass-token cookie
  // This simulates a completely unauthenticated user

  for (const lang of LANGUAGES) {
    test(`should allow access to home page without login in ${lang}`, async ({ page }) => {
      const path = lang === 'en' ? '/' : `/${lang}`;
      const response = await page.goto(path);
      expect(response?.ok()).toBeTruthy();
      
      // Ensure we are not redirected to login
      await expect(page).not.toHaveURL(/.*\/login/);
      await expect(page.locator('.home-hero-title')).toBeVisible();
    });

    test(`should allow access to terms page without login in ${lang}`, async ({ page }) => {
      const path = lang === 'en' ? '/terms' : `/${lang}/terms`;
      const response = await page.goto(path);
      expect(response?.ok()).toBeTruthy();
      
      // Ensure we are not redirected to login
      await expect(page).not.toHaveURL(/.*\/login/);
      await expect(page).toHaveURL(new RegExp(`.*${path}`));
    });

    test(`should allow access to privacy page without login in ${lang}`, async ({ page }) => {
      const path = lang === 'en' ? '/privacy' : `/${lang}/privacy`;
      const response = await page.goto(path);
      expect(response?.ok()).toBeTruthy();
      
      // Ensure we are not redirected to login
      await expect(page).not.toHaveURL(/.*\/login/);
      await expect(page).toHaveURL(new RegExp(`.*${path}`));
    });

    test(`should show auth wall on protected routes when unauthenticated in ${lang}`, async ({ page }) => {
      const path = lang === 'en' ? '/algebra' : `/${lang}/algebra`;
      await page.goto(path);
      
      // We should NOT be redirected away (for SEO purposes)
      await expect(page).not.toHaveURL(/.*\/login/);
      
      // Instead, the "Auth Wall" (login card) must be visible
      await expect(page.locator('.login-card')).toBeVisible();
    });
  }
});
