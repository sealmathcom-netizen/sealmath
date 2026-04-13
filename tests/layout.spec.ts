import { test, expect } from '@playwright/test';
import { generateBypassToken, BYPASS_COOKIE_NAME } from './utils/bypass';

test.describe('Layout & Window Placement', () => {
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

  test('Pages are horizontally centered', async ({ page }) => {
    // Navigate to a page with a container (24 Challenge)
    await page.goto('/24-challenge');
    
    // Wait for the container to be visible
    const container = page.locator('.container');
    await expect(container).toBeVisible();

    const viewportSize = page.viewportSize();
    expect(viewportSize).toBeDefined();

    // Check bounds
    const box = await container.boundingBox();
    expect(box).not.toBeNull();

    if (box && viewportSize) {
      // Calculate how much space is on left vs right
      const leftSpace = box.x;
      const rightSpace = viewportSize.width - (box.x + box.width);
      
      // Because flex alignment can sometimes deal with half pixels or scrollbars, we allow a small tolerance delta
      // The spaces should be roughly equal if the item is centered
      expect(Math.abs(leftSpace - rightSpace)).toBeLessThan(10);
    }
  });

});
