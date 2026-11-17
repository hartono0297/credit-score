import path from "node:path";
import { defineConfig } from "@playwright/test";

const sourceDir = path.resolve(__dirname, "../../02_source");

export default defineConfig({
  testDir: "./e2e",
  outputDir: path.resolve(__dirname, "test-results"),
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: "list",
  use: {
    baseURL: "http://localhost:3108",
    channel: "chrome",
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- -p 3108",
    cwd: sourceDir,
    url: "http://localhost:3108",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
