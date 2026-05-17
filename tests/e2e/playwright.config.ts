import { defineConfig, devices } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../..')
const e2eReady = process.env.E2E_READY === '1'

export default defineConfig({
  testDir: __dirname,
  timeout: 60_000,
  expect: {
    timeout: 5_000
  },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { outputFolder: path.join(repoRoot, 'playwright-report'), open: 'never' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:3008',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: e2eReady
    ? [
        {
          command: 'npm run dev',
          cwd: path.join(repoRoot, 'backend'),
          url: 'http://127.0.0.1:8005/api/health',
          timeout: 120_000,
          reuseExistingServer: true
        },
        {
          command: 'npm run dev -- --host 127.0.0.1 --port 3008',
          cwd: path.join(repoRoot, 'ai-xsread-vue3'),
          url: 'http://127.0.0.1:3008',
          timeout: 120_000,
          reuseExistingServer: true
        }
      ]
    : undefined
})
