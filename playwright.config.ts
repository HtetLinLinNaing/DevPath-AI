import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  use: { baseURL: "http://127.0.0.1:3000", trace: "retain-on-failure" },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true,
    timeout: 120_000,
    env: { APP_ORIGIN: "http://127.0.0.1:3000", OPENAI_API_KEY: "e2e-placeholder" },
  },
  projects: [
    { name: "Desktop Chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "Mobile Safari 320", use: { ...devices["iPhone 13"], viewport: { width: 320, height: 800 } } },
  ],
});
