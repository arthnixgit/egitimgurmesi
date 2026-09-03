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
    },
    {
      name: "admin-responsive-mocked",
      testMatch: /.*admin\.saas-staffing-responsive\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: ADMIN_BASE_URL
      }
    },
    {
      name: "admin-visual-system-mocked",
      testMatch: /.*admin\.visual-system-responsive\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: ADMIN_BASE_URL
      }
    },
    {
      name: "admin-commerce-catalog-mocked",
      testMatch: /.*admin\.commerce-catalog-responsive\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: ADMIN_BASE_URL
      }
    },
    {
      name: "admin-website-builder-mocked",
      testMatch: /.*admin\.website-builder-responsive\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: ADMIN_BASE_URL
      }
    },
    {
      name: "public-catalog-responsive",
      testMatch: /.*public\.catalog-responsive\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: WEB_BASE_URL
      }
    },
    {
      name: "public-website-content-responsive",
      testMatch: /.*public\.website-content-responsive\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: WEB_BASE_URL
      }
    },
    {
      name: "public-free-material-countdown-production",
      testMatch: /.*public\.free-material-countdown-production\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: WEB_BASE_URL
      }
    }
  ]
});
