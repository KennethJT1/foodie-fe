import { defineConfig, devices } from '@playwright/test';

/**
 * Critical journeys on the mock API (Frontend Guidelines, testing): customer orders and tracks,
 * vendor accepts and marks ready, rider delivers, admin approves a vendor.
 * Each test gets a fresh browser context, so the mock database starts from the seed.
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'retain-on-failure',
    serviceWorkers: 'allow',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] }, testIgnore: /(rider|mobile)\.spec/ },
    // Riders use phones: 360 px wide
    {
      name: 'phone',
      use: { ...devices['Pixel 5'], viewport: { width: 360, height: 740 } },
      testMatch: /(rider|mobile)\.spec/,
    },
  ],
  webServer: {
    command: 'npx vite --port 5174 --strictPort',
    url: 'http://localhost:5174',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { VITE_USE_MOCKS: 'true' },
  },
});
