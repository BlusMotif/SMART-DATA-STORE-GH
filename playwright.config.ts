import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'playwright/tests',
  timeout: 30_000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    headless: true,
    actionTimeout: 5000,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'iphone',
      use: {
        ...devices['iPhone 13'],
      },
    },
  ],
});
