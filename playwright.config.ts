import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from '@playwright/test';

const TEST_PORT = 4399;
const TEST_DATA_DIR = join(__dirname, 'tests', '.data');
rmSync(TEST_DATA_DIR, { recursive: true, force: true });

/**
 * E2E runs against the real production export served by the real launcher
 * server — the same path the desktop shortcut uses. Testing `next dev` would
 * miss the static-export and disk-persistence behaviour that actually ships.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // the suite shares one server and one data file
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'tests/report' }]],
  use: {
    baseURL: `http://127.0.0.1:${TEST_PORT}`,
    // Lets a machine that already has Chromium point at it instead of
    // downloading another copy: PLAYWRIGHT_CHROMIUM_PATH=/path/to/chrome
    ...(process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } }
      : {}),
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      // The service worker caches pages aggressively, which makes state leak
      // between tests. Blocked here so each test sees exactly what it set up.
      name: 'app',
      testIgnore: /hors-ligne/,
      use: { serviceWorkers: 'block' },
    },
    {
      // Offline support IS the service worker, so this one keeps it enabled.
      name: 'offline',
      testMatch: /hors-ligne/,
      use: { serviceWorkers: 'allow' },
    },
  ],

  // The suite wipes and rewrites the data file on every test. It must never
  // touch the real project: its own port (so an open RenovApp window is never
  // reused) and its own data folder, emptied before each run.
  webServer: {
    command: 'node scripts/serve.mjs',
    url: `http://127.0.0.1:${TEST_PORT}`,
    reuseExistingServer: false,
    timeout: 30_000,
    env: { PORT: String(TEST_PORT), RENOVAPP_DATA_DIR: TEST_DATA_DIR },
  },
});
