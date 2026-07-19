import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "output/playwright-tests",
  reporter: [["line"]],
  use: { baseURL: "http://127.0.0.1:5174", trace: "retain-on-failure", screenshot: "only-on-failure" },
  webServer: { command: "npm run dev:preview -- --host 127.0.0.1 --port 5174", url: "http://127.0.0.1:5174", reuseExistingServer: true },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
  ],
});
