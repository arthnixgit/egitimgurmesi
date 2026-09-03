import { expect, test, type Page } from "@playwright/test";
import http, { type Server } from "node:http";

const knownCountdownRoutes = [
  { slug: "ayt-kac-gun-kaldi", title: /AYT/i, screenshot: "countdown-ayt-desktop.png" },
  { slug: "tyt-kac-gun-kaldi", title: /TYT/i, screenshot: "countdown-tyt-desktop.png" },
  { slug: "ydt-kac-gun-kaldi", title: /YDT/i, screenshot: "countdown-ydt-desktop.png" },
  { slug: "2026-lgs-kac-gun-kaldi", title: /LGS/i, screenshot: "countdown-lgs-desktop.png" }
];

let apiServer: Server | null = null;
let countdownMode: "not-found" | "unavailable" | "api" = "not-found";
let requestCounts = createRequestCounts();

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  apiServer = await startPublicApiServer();
});

test.afterAll(async () => {
  if (!apiServer) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    apiServer?.close((error) => (error ? reject(error) : resolve()));
  });
});

test.beforeEach(() => {
  countdownMode = "not-found";
  requestCounts = createRequestCounts();
});

test("known bundled countdown routes stay 200 for 20 consecutive production requests each", async ({ page }) => {
  for (const route of knownCountdownRoutes) {
    for (let index = 0; index < 20; index += 1) {
      const response = await page.request.get(`/ucretsiz-materyaller/${route.slug}`);
      const body = await response.text();

      expect(response.status(), `${route.slug} request ${index + 1}`).toBe(200);
      expect(body).toMatch(route.title);
      expect(body).not.toContain("Internal Server Error");
      expect(body).not.toContain("Page changed from static to dynamic");
    }
  }
});

test("known countdown routes render bundled content responsively when API returns 404", async ({ page }) => {
  const consoleErrors = collectRenderingErrors(page);

  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 1024, height: 900 },
    { width: 390, height: 844 }
  ]) {
    for (const route of knownCountdownRoutes) {
      await openCountdownRoute(page, `/ucretsiz-materyaller/${route.slug}`, viewport);
      await expect(page.getByRole("heading", { name: route.title }).first()).toBeVisible();
      await expect(page.locator(".ega-header")).toBeVisible();
      await expect(page.locator(".ega-footer")).toBeVisible();
      await expect(page.getByText("Internal Server Error")).toHaveCount(0);
      await assertNoHorizontalOverflow(page);

      if (viewport.width === 1440) {
        await page.screenshot({
          path: `test-results/public-countdown-production/${route.screenshot}`,
          fullPage: true
        });
      }

      if (route.slug === "ayt-kac-gun-kaldi" && viewport.width === 390) {
        await page.screenshot({
          path: "test-results/public-countdown-production/countdown-ayt-mobile.png",
          fullPage: true
        });
      }
    }
  }

  expect(consoleErrors).toEqual([]);
});

test("unknown countdown slug renders the localized not-found page", async ({ page }) => {
  const response = await openCountdownRoute(page, "/ucretsiz-materyaller/bilinmeyen-sayac", {
    width: 1440,
    height: 1000
  });

  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: /materyal bulunamad/i })).toBeVisible();
  await expect(page.locator(".ega-header")).toBeVisible();
  await expect(page.locator(".ega-footer")).toBeVisible();
  await expect(page.getByText("Internal Server Error")).toHaveCount(0);
  await assertNoHorizontalOverflow(page);
  await page.screenshot({
    path: "test-results/public-countdown-production/countdown-unknown-404.png",
    fullPage: true
  });
});

test("temporary countdown API failure renders controlled unavailable UI", async ({ page }) => {
  countdownMode = "unavailable";

  const response = await openCountdownRoute(page, "/ucretsiz-materyaller/ayt-kac-gun-kaldi", {
    width: 1024,
    height: 900
  });

  expect(response?.status()).toBe(200);
  await expect(page.getByText(/yüklenemiyor|yuklenemiyor/i)).toBeVisible();
  await expect(page.getByText("Internal Server Error")).toHaveCount(0);
  await assertNoHorizontalOverflow(page);
});

test("valid API countdown data overrides bundled fallback and drives metadata", async ({ page }) => {
  countdownMode = "api";

  const response = await openCountdownRoute(page, "/ucretsiz-materyaller/ayt-kac-gun-kaldi", {
    width: 1440,
    height: 1000
  });

  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "API AYT sayacı" })).toBeVisible();
  await expect(page).toHaveTitle(/API AYT sayacı/);
  await assertNoHorizontalOverflow(page);
});

test("bundled fallback metadata and request counts remain bounded", async ({ page }) => {
  await openCountdownRoute(page, "/ucretsiz-materyaller/ayt-kac-gun-kaldi", {
    width: 1440,
    height: 1000
  });

  await expect(page).toHaveTitle(/AYT/i);
  expect(requestCounts.freeMaterials).toBeLessThanOrEqual(1);
  expect(requestCounts.countdownPages.get("ayt-kac-gun-kaldi") ?? 0).toBeLessThanOrEqual(1);
});

async function openCountdownRoute(page: Page, routePath: string, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport);
  const response = await page.goto(routePath, { waitUntil: "domcontentloaded" });
  await hideNextDevOverlay(page);
  await page.waitForLoadState("networkidle");
  return response;
}

async function hideNextDevOverlay(page: Page) {
  await page.addStyleTag({
    content: "nextjs-portal, [data-nextjs-toast], [data-nextjs-devtools-button] { display: none !important; }"
  }).catch(() => undefined);
}

async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(2);
}

function collectRenderingErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (message) => {
    const text = message.text();
    if (/Page changed from static to dynamic|Internal Server Error|hydration|server rendered/i.test(text)) {
      errors.push(text);
    }
  });
  return errors;
}

async function startPublicApiServer() {
  const server = http.createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://localhost:4000");

    if (url.pathname === "/v1/public/site-settings") {
      sendJson(response, 200, createPublicSiteSettings());
      return;
    }

    if (url.pathname === "/v1/public/navigation") {
      sendJson(response, 200, createNavigationResponse());
      return;
    }

    if (url.pathname === "/v1/public/free-materials") {
      requestCounts.freeMaterials += 1;
      sendJson(response, 200, []);
      return;
    }

    if (url.pathname.startsWith("/v1/public/countdown-pages/")) {
      const slug = decodeURIComponent(url.pathname.split("/").pop() ?? "");
      requestCounts.countdownPages.set(slug, (requestCounts.countdownPages.get(slug) ?? 0) + 1);

      if (countdownMode === "api" && slug === "ayt-kac-gun-kaldi") {
        sendJson(response, 200, createApiCountdownPage(slug));
        return;
      }

      if (countdownMode === "unavailable") {
        sendJson(response, 503, { message: "countdown unavailable" });
        return;
      }

      sendJson(response, 404, { message: "countdown missing" });
      return;
    }

    if (url.pathname === "/v1/public/academic-staff" || url.pathname === "/v1/public/success-stories") {
      sendJson(response, 200, []);
      return;
    }

    if (url.pathname === "/v1/public-commerce/catalog") {
      sendJson(response, 200, { categories: [], products: [] });
      return;
    }

    if (url.pathname.startsWith("/v1/public/pages/")) {
      sendJson(response, 404, { message: "page missing" });
      return;
    }

    sendJson(response, 404, { message: "not found" });
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(4000, () => {
      server.off("error", reject);
      resolve();
    });
  });

  return server;
}

function sendJson(response: http.ServerResponse, status: number, payload: unknown) {
  response.writeHead(status, {
    "Content-Type": "application/json"
  });
  response.end(JSON.stringify(payload));
}

function createRequestCounts() {
  return {
    freeMaterials: 0,
    countdownPages: new Map<string, number>()
  };
}

function createApiCountdownPage(slug: string) {
  return {
    id: "countdown_api_ayt",
    slug,
    eyebrow: "API AYT",
    title: "API AYT sayacı",
    description: "API verisiyle gelen AYT geri sayımı.",
    updatedLabel: "API tarafından güncellendi.",
    videoTitle: "API video alanı",
    videoNote: "API içerik notu.",
    targets: [
      {
        id: "target_api_ayt",
        label: "AYT API",
        targetAt: "2026-06-21T10:15:00+03:00",
        dateLabel: "21 Haziran 2026 Pazar, 10:15",
        note: "API hedefi"
      }
    ],
    officialLinks: [],
    articleSections: []
  };
}

function createNavigationResponse() {
  return {
    id: "menu_public",
    key: "primary",
    name: "Ana Menü",
    location: "PRIMARY",
    enabled: true,
    version: 1,
    generatedAt: "2026-09-03T00:00:00.000Z",
    source: "database",
    catalogStatus: "ready",
    items: [
      {
        id: "free-materials",
        itemKey: "free-materials",
        label: "Ücretsiz Materyaller",
        href: "/ucretsiz-materyaller",
        description: null,
        target: null,
        children: []
      }
    ]
  };
}

function createPublicSiteSettings() {
  return {
    id: "site_default",
    key: "default",
    siteName: "Eğitim Gurmesi Akademi",
    siteTitle: "Eğitim Gurmesi Akademi",
    tagline: "Sınav hazırlık platformu",
    supportEmail: "bilgi@egitimgurmesi.com",
    supportPhone: "+90 531 855 38 27",
    supportWhatsappNumber: "905318553827",
    logoPrimaryUrl: "/branding/ega-logo-official.png",
    logoCompactUrl: "/branding/ega-mark-transparent.png",
    logoMarkUrl: "/branding/ega-mark-transparent.png",
    logoFooterUrl: "/branding/ega-logo-official.png",
    logoDarkUrl: "/branding/ega-logo-official.png",
    logoLightUrl: "/branding/ega-logo-official.png",
    faviconUrl: "/icon.png",
    defaultSocialImageUrl: "/branding/ega-logo-official.png",
    logoAltText: "Eğitim Gurmesi Akademi",
    displayPhone: "+90 531 855 38 27",
    canonicalPhone: "+905318553827",
    telHref: "tel:+905318553827",
    whatsappMessage: "Merhaba",
    whatsappHref: "https://wa.me/905318553827?text=Merhaba",
    address: "Ankara",
    publicContactEmail: "bilgi@egitimgurmesi.com",
    footerBrandDescription: "Eğitim Gurmesi Akademi.",
    footerQuickLinks: [{ label: "Ücretsiz Materyaller", href: "/ucretsiz-materyaller" }],
    footerContactTitle: "İletişim",
    socialLinks: [],
    copyrightText: "© Eğitim Gurmesi Akademi",
    footerNotice: "",
    defaultSeoTitle: "Eğitim Gurmesi Akademi",
    defaultSeoDescription: "Sınav hazırlık platformu",
    version: 1
  };
}
