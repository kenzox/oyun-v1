import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './test/browser',
  use: { baseURL: 'http://127.0.0.1:3100', headless: true, browserName: 'chromium', ...(process.env.CHROME_PATH ? { launchOptions: { executablePath: process.env.CHROME_PATH } } : {}) },
  webServer: { command: 'npm start', env: { PORT: '3100' }, url: 'http://127.0.0.1:3100/api/config', reuseExistingServer: false, timeout: 10000 },
});
