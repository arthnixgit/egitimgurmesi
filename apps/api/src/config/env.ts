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
  accessTokenTtlSeconds: ACCESS_TOKEN_TTL_SECONDS,
  refreshTokenTtlSeconds: REFRESH_TOKEN_TTL_SECONDS
} as const;
