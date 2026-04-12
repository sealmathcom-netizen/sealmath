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

  test('History window docking depends on language and viewport size', async ({ page }) => {
    // 1. Wide view: History is fixed to the sides
    await page.setViewportSize({ width: 1300, height: 900 });

    // Test English (LTR)
    await page.goto('/?lang=en');
    const historyBoxLTR = page.locator('.global-controls');
    await expect(historyBoxLTR).toBeVisible();
    
    let box = await historyBoxLTR.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      // Should be near the left edge (20px inset-inline-start on LTR)
      expect(box.x).toBeCloseTo(20, -1); // tolerance of 10px just in case
    }

    // Test Hebrew (RTL)
    await page.goto('/?lang=he');
    const historyBoxRTL = page.locator('.global-controls');
    await expect(historyBoxRTL).toBeVisible();

    box = await historyBoxRTL.boundingBox();
    const viewportSize = page.viewportSize();
    expect(box).not.toBeNull();
    if (box && viewportSize) {
      // Should be near the right edge (20px inset-inline-start on RTL)
      const expectedX = viewportSize.width - box.width - 20;
      expect(box.x).toBeCloseTo(expectedX, -1);
    }

    // 2. Narrow view: History is centered
    await page.setViewportSize({ width: 800, height: 900 });
    await page.goto('/?lang=en');
    
    // Wait for repaint/layout after viewport resize
    await page.waitForTimeout(500);
    
    const historyBoxNarrow = page.locator('.global-controls');
    box = await historyBoxNarrow.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      // Should be roughly centered.
      const leftSpace = box.x;
      const rightSpace = 800 - (box.x + box.width);
      expect(Math.abs(leftSpace - rightSpace)).toBeLessThan(10);
    }
  });
});
