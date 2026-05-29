import { defineConfig, devices } from "@playwright/test";
import {
  ADMIN_BASE_URL,
  ADMIN_STORAGE_STATE,
  STUDENT_STORAGE_STATE,
  WEB_BASE_URL
} from "./e2e/support/config";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  workers: 1,
  expect: {
    timeout: 10_000
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/
    },
    {
      name: "public-chromium",
      dependencies: ["setup"],
      testMatch: /.*public\.smoke\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: WEB_BASE_URL
      }
    },
    {
      name: "student-chromium",
      dependencies: ["setup"],
      testMatch: /.*student\.smoke\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: WEB_BASE_URL,
        storageState: STUDENT_STORAGE_STATE
      }
    },
    {
      name: "admin-chromium",
      dependencies: ["setup"],
      testMatch: /.*admin\.smoke\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: ADMIN_BASE_URL,
        storageState: ADMIN_STORAGE_STATE
      }
    }
  ]
});
