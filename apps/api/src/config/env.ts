import { existsSync } from "node:fs";
import path from "node:path";
import { config as loadDotenv } from "dotenv";

const envCandidatePaths = Array.from(
  new Set([
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../../.env"),
    path.resolve(__dirname, "../../../../.env")
  ])
);

for (const envPath of envCandidatePaths) {
  if (!existsSync(envPath)) {
    continue;
  }

  loadDotenv({ path: envPath, override: false });
  break;
}

const ACCESS_TOKEN_TTL_SECONDS = 60 * 15;
const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const appEnv = {
  authSecret: () => getRequiredEnv("AUTH_SECRET"),
  bootstrapAdminSecret: () => getRequiredEnv("BOOTSTRAP_ADMIN_SECRET"),
  accessTokenTtlSeconds: ACCESS_TOKEN_TTL_SECONDS,
  refreshTokenTtlSeconds: REFRESH_TOKEN_TTL_SECONDS
} as const;
