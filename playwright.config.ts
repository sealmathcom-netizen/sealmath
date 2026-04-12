import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const isCheckly = !!process.env.CHECKLY;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: isCheckly ? 2 : (process.env.CI ? 2 : 0),
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: isCheckly ? 'https://sealmath.com' : 'http://localhost:3000',
    trace: isCheckly ? 'on' : 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'checkly',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: isCheckly ? 'https://sealmath.com' : 'http://localhost:3000',
      },
    },
  ],
  webServer: isCheckly 
    ? undefined 
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
      },
});
