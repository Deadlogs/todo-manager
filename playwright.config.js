const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests-frontend',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { outputFolder: 'coverage/frontend/playwright-report' }], ['list']],
  use: {
    baseURL: 'http://localhost:5050',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' }
    }
  ],
  webServer: {
    command: 'node index.js',
    url: 'http://localhost:5050',
    reuseExistingServer: !process.env.CI,
    timeout: 30000
  }
});
