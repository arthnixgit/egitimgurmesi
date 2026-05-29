import "reflect-metadata";
import express from "express";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

type CorsOriginCallback = (error: Error | null, allow?: boolean) => void;

function normalizeOrigin(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return value.trim().replace(/\/+$/, "");
  }
}

function resolveAllowedOrigins() {
  const configuredOrigins =
    process.env.CORS_ORIGINS?.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean) ?? [];

  const defaultOrigins = [
    process.env.PUBLIC_APP_URL,
    process.env.ADMIN_APP_URL,
    "http://localhost:3000",
    "http://localhost:3001"
  ].filter((origin): origin is string => Boolean(origin));

  return new Set([...configuredOrigins, ...defaultOrigins].map(normalizeOrigin));
}

function createCorsOptions() {
  const allowedOrigins = resolveAllowedOrigins();
  const allowWildcard = process.env.NODE_ENV !== "production" && allowedOrigins.has("*");

  return {
    credentials: true,
    origin(origin: string | undefined, callback: CorsOriginCallback) {
      if (!origin || allowWildcard || allowedOrigins.has(normalizeOrigin(origin))) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed by CORS"), false);
    }
  };
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: createCorsOptions()
  });

  app.setGlobalPrefix("v1");
  app.use(express.urlencoded({ extended: true }));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true
    })
  );

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 4000);
}

void bootstrap();
