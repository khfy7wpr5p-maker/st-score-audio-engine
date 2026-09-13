import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  timeout: 30_000,
  use: { baseURL: "http://127.0.0.1:4173", ...devices["Desktop Safari"] },
  projects: [{ name: "webkit", use: { browserName: "webkit" } }],
  webServer: {
    command: "npm run browser:serve",
    url: "http://127.0.0.1:4173/tests/browser/index.html",
    reuseExistingServer: false
  }
});
