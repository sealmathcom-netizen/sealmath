import { test, expect } from '@playwright/test';
import { generateBypassToken, BYPASS_COOKIE_NAME } from './utils/bypass';

test.describe('SEO & Metadata', () => {
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

  test('robots.txt exists and contains sitemap link', async ({ request }) => {
    // Retry a few times if the server is still restarting/clearing conflict
    let response;
    for (let i = 0; i < 3; i++) {
        response = await request.get('/robots.txt');
        if (response.status() === 200) break;
        await new Promise(r => setTimeout(r, 1000));
    }
    expect(response?.status()).toBe(200);
    const text = await response?.text() || '';
    expect(text).toContain('User-Agent: *'); // Matching Next.js default casing
    expect(text).toContain('Sitemap: https://sealmath.com/sitemap.xml');
  });

  
  test('sitemap.xml natively resolves perfectly and returns valid XML', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    
    // Check successful resolution bypassing Middleware language blocks
    expect(response.status()).toBe(200);
    
    // Check that it's genuinely outputting the expected XML sitemap format
    const xml = await response.text();
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain('<loc>https://sealmath.com/algebra</loc>');
  });

  test('Home page has correct OpenGraph and Twitter metadata', async ({ page }) => {
    await page.goto('/');

    // Ensure the page has loaded by checking for the hero title first
    await expect(page.locator('.home-hero-title')).toBeAttached({ timeout: 10000 });

    // Basic Metadata
    // Note: We use toContain/toMatch to avoid exact string mismatches with special characters like &
    const title = await page.title();
    expect(title).toContain('SealMath');
    expect(title).toContain('Free Online Math Learning');

    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toContain('Learn math the fun way');

    // OpenGraph
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /SealMath/);
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', /Learn math the fun way/);
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website');
    
    // Check if og:image exists
    const ogImage = page.locator('meta[property="og:image"]');
    await expect(ogImage).toBeAttached();

    // Twitter
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  });

  test('Home page has correct localized hreflang tags', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.home-hero-title')).toBeAttached();

    // Canonical - handle both with and without trailing slash
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical?.replace(/\/$/, '')).toBe('https://sealmath.com');

    // hreflang
    const languages = ['en', 'he', 'nl', 'x-default'];
    for (const lang of languages) {
      const hreflang = page.locator(`link[rel="alternate"][hreflang="${lang}"]`);
      await expect(hreflang).toBeAttached();
      const href = await hreflang.getAttribute('href');
      
      const cleanHref = href?.replace(/\/$/, '');
      if (lang === 'en' || lang === 'x-default') {
        expect(cleanHref).toBe('https://sealmath.com');
      } else {
        expect(cleanHref).toBe(`https://sealmath.com/${lang}`);
      }
    }
  });

  test('Algebra page has correct localized metadata and alternates', async ({ page }) => {
    // Navigate to Hebrew version of Algebra
    await page.goto('/he/algebra');
    
    // Check Title (Hebrew)
    await expect(page).toHaveTitle(/יסודות האלגברה/);
    
    // Check Description (Hebrew)
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toContain('למדו איך לפתור');

    // Canonical for Hebrew Algebra
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toBe('https://sealmath.com/he/algebra');
    
    // Alternates for Algebra page
    const heAlternate = page.locator('link[rel="alternate"][hreflang="he"]');
    expect(await heAlternate.getAttribute('href')).toBe('https://sealmath.com/he/algebra');
    
    const enAlternate = page.locator('link[rel="alternate"][hreflang="en"]');
    expect(await enAlternate.getAttribute('href')).toBe('https://sealmath.com/algebra');
  });
});
