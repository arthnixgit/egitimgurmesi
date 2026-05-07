export * from "@prisma/client";
export * from "./rbac";

export const databaseEnvironmentKeys = {
  databaseUrl: "DATABASE_URL",
  directUrl: "DIRECT_URL"
} as const;
