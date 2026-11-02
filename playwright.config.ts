import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3123);

// Test-only credentials. The server started below uses them instead of .env.local.
export const TEST_PRESENTER_PASSWORD = "e2e-presenter-password";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Runs against a production build: `npm run build` first.
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    env: {
      PRESENTER_PASSWORD: TEST_PRESENTER_PASSWORD,
      SESSION_SECRET: "e2e-session-secret-not-for-production",
    },
  },
});
