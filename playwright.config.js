import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './test/browser',
  use: { baseURL: 'http://127.0.0.1:3000', headless: true, browserName: 'chromium', ...(process.env.CHROME_PATH ? { launchOptions: { executablePath: process.env.CHROME_PATH } } : {}) },
  webServer: { command: 'npm start', url: 'http://127.0.0.1:3000/api/config', reuseExistingServer: !process.env.CI },
});
