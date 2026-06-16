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
  apiAppUrl: () => process.env.API_APP_URL?.trim().replace(/\/+$/, "") || "http://localhost:4000",
  emailProvider: () => process.env.EMAIL_PROVIDER?.trim().toLowerCase() ?? "preview",
  emailFrom: () => getRequiredEnv("EMAIL_FROM"),
  emailFromName: () => process.env.EMAIL_FROM_NAME?.trim() || "Eğitim Gurmesi Akademi",
  emailReplyTo: () => process.env.EMAIL_REPLY_TO?.trim() || "",
  smtpHost: () => getRequiredEnv("SMTP_HOST"),
  smtpPort: () => Number(process.env.SMTP_PORT ?? "1025"),
  smtpSecure: () => ["1", "true", "yes"].includes((process.env.SMTP_SECURE ?? "").toLowerCase()),
  smtpUser: () => process.env.SMTP_USER?.trim() || "",
  smtpPassword: () => process.env.SMTP_PASSWORD?.trim() || "",
  paymentProvider: () => process.env.PAYMENT_PROVIDER ?? "manual",
  paymentMerchantId: () => process.env.PAYMENT_MERCHANT_ID ?? "",
  paymentApiKey: () => process.env.PAYMENT_API_KEY ?? "",
  paymentSecretKey: () => process.env.PAYMENT_SECRET_KEY ?? "",
  paymentBaseUrl: () => process.env.PAYMENT_BASE_URL ?? "",
  paymentTestMode: () =>
    ["1", "true", "yes", "on"].includes((process.env.PAYMENT_TEST_MODE ?? "").trim().toLowerCase()),
  mediaStorageDir: () => process.env.MEDIA_STORAGE_DIR?.trim() || "../../storage/media",
  mediaPublicBaseUrl: () =>
    process.env.MEDIA_PUBLIC_BASE_URL?.trim().replace(/\/+$/, "") || `${appEnv.apiAppUrl()}/v1`,
  mediaMaxUploadBytes: () => Number(process.env.MEDIA_MAX_UPLOAD_BYTES ?? "52428800"),
  unikazanBaseUrl: () => getRequiredEnv("UNIKAZAN_API_BASE_URL"),
  unikazanApiKey: () => getRequiredEnv("UNIKAZAN_API_KEY"),
  unikazanProjectKey: () => getRequiredEnv("UNIKAZAN_PROJECT_KEY"),
  unikazanAdminKey: () => process.env.UNIKAZAN_ADMIN_KEY ?? "",
  accessTokenTtlSeconds: ACCESS_TOKEN_TTL_SECONDS,
  refreshTokenTtlSeconds: REFRESH_TOKEN_TTL_SECONDS
} as const;
