import fs from "node:fs";
import path from "node:path";

const rootDir = path.resolve(__dirname, "..", "..");
const dotenvPath = path.join(rootDir, ".env");

let parsedDotEnv: Record<string, string> | null = null;

function readDotEnvFile() {
  if (parsedDotEnv) {
    return parsedDotEnv;
  }

  if (!fs.existsSync(dotenvPath)) {
    parsedDotEnv = {};
    return parsedDotEnv;
  }

  const content = fs.readFileSync(dotenvPath, "utf8");
  const values: Record<string, string> = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  parsedDotEnv = values;
  return parsedDotEnv;
}

function getEnv(name: string, fallback: string) {
  return process.env[name] ?? readDotEnvFile()[name] ?? fallback;
}

export const WEB_BASE_URL = getEnv("E2E_WEB_BASE_URL", "http://localhost:3000");
export const ADMIN_BASE_URL = getEnv("E2E_ADMIN_BASE_URL", "http://localhost:3001");
const rawApiBaseUrl = getEnv("E2E_API_BASE_URL", "http://localhost:4000/v1");
export const API_BASE_URL = rawApiBaseUrl.endsWith("/") ? rawApiBaseUrl : `${rawApiBaseUrl}/`;

export const ADMIN_EMAIL = getEnv("E2E_ADMIN_EMAIL", "superadmin+20260507132143@example.com");
export const ADMIN_PASSWORD = getEnv("E2E_ADMIN_PASSWORD", "Admin1234");
export const BOOTSTRAP_ADMIN_SECRET = getEnv("BOOTSTRAP_ADMIN_SECRET", "");

export const AUTH_DIR = path.join(rootDir, "e2e", ".auth");
export const STUDENT_STORAGE_STATE = path.join(AUTH_DIR, "student.json");
export const ADMIN_STORAGE_STATE = path.join(AUTH_DIR, "admin.json");

export const STUDENT_ACCESS_TOKEN_KEY = "ega_user_access_token";
export const STUDENT_REFRESH_TOKEN_KEY = "ega_user_refresh_token";
export const ADMIN_ACCESS_TOKEN_KEY = "ega_staff_access_token";
export const ADMIN_REFRESH_TOKEN_KEY = "ega_staff_refresh_token";
