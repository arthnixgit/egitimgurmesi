import fs from "node:fs/promises";
import { expect, request, test as setup } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import {
  ADMIN_ACCESS_TOKEN_KEY,
  ADMIN_BASE_URL,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  ADMIN_REFRESH_TOKEN_KEY,
  ADMIN_STORAGE_STATE,
  API_BASE_URL,
  AUTH_DIR,
  BOOTSTRAP_ADMIN_SECRET,
  STUDENT_ACCESS_TOKEN_KEY,
  STUDENT_REFRESH_TOKEN_KEY,
  STUDENT_STORAGE_STATE,
  WEB_BASE_URL
} from "./support/config";

type RegisterResponse = {
  success: true;
  message: string;
  previewUrl?: string;
};

type UserAuthResponse = {
  accessToken: string;
  refreshToken: string;
};

type StaffAuthResponse = {
  accessToken: string;
  refreshToken: string;
};

type BootstrapStatusResponse = {
  requiresBootstrap: boolean;
};

setup("prepare student and admin auth states", async ({ browser }) => {
  const prisma = new PrismaClient();
  await fs.mkdir(AUTH_DIR, { recursive: true });

  const api = await request.newContext({
    baseURL: API_BASE_URL,
    extraHTTPHeaders: {
      "Content-Type": "application/json"
    }
  });

  const healthResponse = await api.get("health");
  expect(healthResponse.ok(), "API health endpoint must be reachable before running E2E smoke tests.").toBeTruthy();

  const localCheckoutProduct = await prisma.product.findUnique({
    where: { slug: "yazili-kampi-icerik-paketi" },
    include: { variants: true }
  });

  expect(localCheckoutProduct, "Local checkout smoke product must exist.").toBeTruthy();

  if ((localCheckoutProduct?.variants.length ?? 0) === 0) {
    await prisma.productVariant.create({
      data: {
        productId: localCheckoutProduct!.id,
        title: "E2E Standart",
        sku: `E2E-${Date.now()}`,
        billingLabel: "2490.00 TRY",
        price: "2490.00",
        currency: "TRY",
        isDefault: true,
        isActive: true,
        sortOrder: 10
      }
    });
  }

  const now = Date.now();
  const studentEmail = `e2e.student.${now}@example.com`;
  const studentPassword = "E2eSmoke1A";
  const studentPhone = `555${String(now).slice(-7)}`;

  const registerResponse = await api.post("auth/register", {
    data: {
      firstName: "E2E",
      lastName: "Student",
      email: studentEmail,
      phone: studentPhone,
      password: studentPassword,
      marketingConsent: false,
      kvkkConsent: true,
      termsAccepted: true,
      distanceSalesAccepted: true
    }
  });
  expect(registerResponse.ok(), "Student registration failed during smoke setup.").toBeTruthy();

  const registerJson = (await registerResponse.json()) as RegisterResponse;
  expect(registerJson.previewUrl, "Local registration should return a preview verification URL.").toBeTruthy();

  const verificationToken = new URL(registerJson.previewUrl as string).searchParams.get("token");
  expect(verificationToken, "Verification token could not be extracted from preview URL.").toBeTruthy();

  const verifyResponse = await api.post("auth/email-verification/confirm", {
    data: {
      token: verificationToken
    }
  });
  expect(verifyResponse.ok(), "Student email verification failed during smoke setup.").toBeTruthy();

  const studentLoginResponse = await api.post("auth/login", {
    data: {
      email: studentEmail,
      password: studentPassword
    }
  });
  expect(studentLoginResponse.ok(), "Student login failed during smoke setup.").toBeTruthy();

  const studentAuth = (await studentLoginResponse.json()) as UserAuthResponse;

  const studentContext = await browser.newContext();
  const studentPage = await studentContext.newPage();
  await studentPage.goto(WEB_BASE_URL, { waitUntil: "domcontentloaded" });
  await studentPage.evaluate(
    ({ accessToken, refreshToken, accessTokenKey, refreshTokenKey }) => {
      window.localStorage.setItem(accessTokenKey, accessToken);
      window.localStorage.setItem(refreshTokenKey, refreshToken);
    },
    {
      accessToken: studentAuth.accessToken,
      refreshToken: studentAuth.refreshToken,
      accessTokenKey: STUDENT_ACCESS_TOKEN_KEY,
      refreshTokenKey: STUDENT_REFRESH_TOKEN_KEY
    }
  );
  await studentContext.storageState({ path: STUDENT_STORAGE_STATE });
  await studentContext.close();

  const bootstrapStatusResponse = await api.get("staff/bootstrap-status");
  expect(bootstrapStatusResponse.ok(), "Admin bootstrap status endpoint failed during smoke setup.").toBeTruthy();

  const bootstrapStatus = (await bootstrapStatusResponse.json()) as BootstrapStatusResponse;

  let adminAuth: StaffAuthResponse | null = null;

  if (bootstrapStatus.requiresBootstrap) {
    expect(
      BOOTSTRAP_ADMIN_SECRET,
      "BOOTSTRAP_ADMIN_SECRET is required to bootstrap an admin account for E2E."
    ).toBeTruthy();

    const bootstrapResponse = await api.post("staff/bootstrap", {
      data: {
        firstName: "Smoke",
        lastName: "Admin",
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        bootstrapSecret: BOOTSTRAP_ADMIN_SECRET
      }
    });
    expect(bootstrapResponse.ok(), "Admin bootstrap failed during smoke setup.").toBeTruthy();
    adminAuth = (await bootstrapResponse.json()) as StaffAuthResponse;
  } else {
    const adminLoginResponse = await api.post("auth/staff/login", {
      data: {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      }
    });
    expect(
      adminLoginResponse.ok(),
      "Admin login failed during smoke setup. Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD if local defaults changed."
    ).toBeTruthy();
    adminAuth = (await adminLoginResponse.json()) as StaffAuthResponse;
  }

  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  await adminPage.goto(`${ADMIN_BASE_URL}/giris`, { waitUntil: "domcontentloaded" });
  await adminPage.evaluate(
    ({ accessToken, refreshToken, accessTokenKey, refreshTokenKey }) => {
      window.localStorage.setItem(accessTokenKey, accessToken);
      window.localStorage.setItem(refreshTokenKey, refreshToken);
    },
    {
      accessToken: adminAuth.accessToken,
      refreshToken: adminAuth.refreshToken,
      accessTokenKey: ADMIN_ACCESS_TOKEN_KEY,
      refreshTokenKey: ADMIN_REFRESH_TOKEN_KEY
    }
  );
  await adminContext.storageState({ path: ADMIN_STORAGE_STATE });
  await adminContext.close();

  await api.dispose();
  await prisma.$disconnect();
});
