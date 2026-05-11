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
  publicAppUrl: () => getRequiredEnv("PUBLIC_APP_URL"),
  paymentProvider: () => process.env.PAYMENT_PROVIDER ?? "manual",
  paymentApiKey: () => process.env.PAYMENT_API_KEY ?? "",
  paymentSecretKey: () => process.env.PAYMENT_SECRET_KEY ?? "",
  paymentBaseUrl: () => process.env.PAYMENT_BASE_URL ?? "",
  unikazanBaseUrl: () => getRequiredEnv("UNIKAZAN_API_BASE_URL"),
  unikazanApiKey: () => getRequiredEnv("UNIKAZAN_API_KEY"),
  unikazanProjectKey: () => getRequiredEnv("UNIKAZAN_PROJECT_KEY"),
  unikazanAdminKey: () => process.env.UNIKAZAN_ADMIN_KEY ?? "",
  accessTokenTtlSeconds: ACCESS_TOKEN_TTL_SECONDS,
  refreshTokenTtlSeconds: REFRESH_TOKEN_TTL_SECONDS
} as const;
