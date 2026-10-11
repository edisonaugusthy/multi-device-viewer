import { defineConfig, devices } from "@playwright/test";

const previewOrigin = process.env.MDV_PREVIEW_ORIGIN ?? "http://127.0.0.1:5174";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "output/playwright-tests",
  reporter: [["line"]],
  use: { baseURL: previewOrigin, trace: "retain-on-failure", screenshot: "only-on-failure" },
  webServer: { command: `npm run dev:preview -- --host 127.0.0.1 --port ${new URL(previewOrigin).port}`, url: previewOrigin, reuseExistingServer: true },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
