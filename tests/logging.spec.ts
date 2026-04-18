import { test, expect } from '@playwright/test';
import { generateBypassToken, BYPASS_COOKIE_NAME } from './utils/bypass';

test.describe('Algebra Exercise Logging', () => {
  let logs: any[] = [];

  test.beforeEach(async ({ context, page }) => {
    logs = []; // Reset logs for each test
    const baseURL = test.info().project.use.baseURL || 'http://localhost:3000';
    const hostname = new URL(baseURL).hostname;
    const token = await generateBypassToken();
    
    // 1. Set Auth Bypass Cookies
    await context.addCookies([
      {
        name: BYPASS_COOKIE_NAME,
        value: token,
        domain: hostname,
        path: '/',
        secure: baseURL.startsWith('https'),
        sameSite: 'Lax'
      },
      {
        name: 'test-bypass-active',
        value: 'true',
        domain: hostname,
        path: '/',
        secure: baseURL.startsWith('https'),
        sameSite: 'Lax'
      }
    ]);

    // 2. Set up Axiom Interception BEFORE any navigation
    await page.route('**/api/axiom', async (route) => {
      const postData = route.request().postDataJSON();
      logs.push(postData);
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'ok' }) });
    });

    // 3. Navigate and Enable Capture
    await page.goto('/en/algebra');
    await page.evaluate(() => localStorage.setItem('capture-logs', 'true'));
    await page.reload(); 
  });

  test('should log exercise lifecycle events to Axiom', async ({ page }) => {
    // Explicitly click the addsub tab
    await page.click('#tab-addsub');

    // 1. Verify 'exercise_created' on load
    await expect(async () => {
      const creations = logs.filter(l => l.event === 'exercise_created' && l.type === 'addsub');
      expect(creations.length).toBeGreaterThan(0);
    }).toPass({ timeout: 15000 });

    // Robust matching: pick the LATEST creation event of this type
    const relevantCreations = logs.filter(l => l.event === 'exercise_created' && l.type === 'addsub');
    const initialExerciseId = relevantCreations[relevantCreations.length - 1].exercise_id;
    console.log('[Test Debug] Active Exercise ID:', initialExerciseId);

    // 2. Perform an attempt
    const input = page.locator('.rules-box input[type="number"]').first();
    await input.waitFor({ state: 'visible' });
    await input.fill('999'); 
    
    // Explicitly target the button within the active rules-box
    const btnCheck = page.locator('#btn-check-addsub');
    await btnCheck.click();

    await expect(async () => {
      const capturedEvents = logs.map(l => `${l.event}(${l.exercise_id})`);
      console.log('[Test Debug] Captured events:', capturedEvents);
      const attemptEvent = logs.find(l => l.event === 'exercise_attempt' && l.exercise_id === initialExerciseId);
      expect(attemptEvent).toBeDefined();
      expect(attemptEvent.is_correct).toBe(false);
    }).toPass({ timeout: 15000 });

    // 3. Show solution
    const btnShowSol = page.getByRole('button', { name: /Show Solution/i }).first();
    await btnShowSol.click();

    await expect(async () => {
      const solutionEvent = logs.find(l => l.event === 'exercise_show_solution' && l.exercise_id === initialExerciseId);
      expect(solutionEvent).toBeDefined();
    }).toPass({ timeout: 10000 });
  });

  test('should log events for multi-step complex equations', async ({ page }) => {
    await page.click('#tab-complex');

    await expect(async () => {
      const creations = logs.filter(l => l.event === 'exercise_created' && l.type === 'complex');
      expect(creations.length).toBeGreaterThan(0);
    }).toPass({ timeout: 15000 });

    const relevantCreations = logs.filter(l => l.event === 'exercise_created' && l.type === 'complex');
    const complexId = relevantCreations[relevantCreations.length - 1].exercise_id;

    await page.click('#btn-add-row-0');
    const inputs = page.locator('.rules-box input, .rules-box [contenteditable="true"]');
    await inputs.first().fill('x=1');

    await page.getByRole('button', { name: /Check Answer/i }).first().click();

    await expect(async () => {
      const attempt = logs.find(l => l.event === 'exercise_attempt' && l.exercise_id === complexId);
      expect(attempt).toBeDefined();
    }).toPass({ timeout: 15000 });
  });
});
