import { expect, test, type Page, type Route } from "@playwright/test";
import http, { type Server } from "node:http";

const publicViewports = [1920, 1440, 1280, 1024, 768, 390];
let publicApiServer: Server | null = null;
let publicSiteSettingsState = createPublicSiteSettings();
let publicFreeMaterialsState = createPublicFreeMaterials();
let publicFreeMaterialsStatus = 200;

test.beforeAll(async () => {
  publicApiServer = await startPublicApiServer();
});

test.afterAll(async () => {
  if (!publicApiServer) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    publicApiServer?.close((error) => (error ? reject(error) : resolve()));
  });
});

test.beforeEach(() => {
  publicSiteSettingsState = createPublicSiteSettings();
  publicFreeMaterialsState = createPublicFreeMaterials();
  publicFreeMaterialsStatus = 200;
});

for (const width of publicViewports) {
  test(`homepage footer uses shared contact contract at ${width}px`, async ({ page }) => {
    await openPublicRoute(page, "/", width);

    await expect(page.locator(".ega-showcase-hero")).toBeVisible();
    await expect(page.locator(".ega-footer")).toHaveCount(1);
    await expect(page.locator(".ega-footer__brand")).toBeVisible();
    await expect(page.locator(".ega-footer__links")).toBeVisible();
    await expect(page.locator(".ega-footer__contact")).toBeVisible();
    await expect(page.locator(".ega-footer")).toContainText("+90 531 855 38 27");
    await expect(page.locator('.ega-footer a[href="tel:+905318553827"]')).toBeVisible();
    await expect(page.locator('.ega-footer a[href^="https://wa.me/905318553827"]')).toBeVisible();
    await assertNoHorizontalOverflow(page);
    await page.screenshot({
      path: `test-results/public-website/homepage-footer-${width}.png`,
      fullPage: true
    });
    if (width === 1440) {
      await page.screenshot({
        path: "test-results/public-website/homepage-slider-desktop.png",
        fullPage: true
      });
    }
    if (width === 390) {
      await page.screenshot({
        path: "test-results/public-website/homepage-slider-mobile.png",
        fullPage: true
      });
    }
  });
}

test("internal page footer uses the same shared component", async ({ page }) => {
  await openPublicRoute(page, "/hakkimizda", 1440);

  await expect(page.locator(".ega-footer")).toHaveCount(1);
  await expect(page.locator(".ega-footer__links a[href='/paketlerimiz']")).toContainText("Paketlerimiz");
  await expect(page.locator(".ega-footer__links a[href='/ucretsiz-materyaller']")).toContainText("Ücretsiz Materyaller");
  await expect(page.locator(".ega-footer__links a[href='/hakkimizda']")).toContainText("Hakkımızda");
  await expect(page.locator(".ega-footer__links a[href='/giris']")).toContainText("Öğrenci Girişi");
  await assertNoHorizontalOverflow(page);
  await page.screenshot({
    path: "test-results/public-website/internal-page-footer-desktop.png",
    fullPage: true
  });
});

test("public navbar uses the same catalog-driven package hierarchy on desktop and mobile", async ({ page }) => {
  let navigationRequests = 0;
  await page.route("**/v1/public/navigation?key=primary", async (route) => {
    navigationRequests += 1;
    await route.fulfill({
      json: {
        id: "menu_1",
        key: "primary",
        name: "Ana Menü",
        location: "PRIMARY",
        items: [
          {
            id: "packages",
            itemKey: "packages",
            label: "Paketlerimiz",
            href: "/paketlerimiz",
            description: null,
            target: null,
            children: [
              {
                id: "catalog-online",
                itemKey: "packages-online",
                label: "Katalog Online",
                href: "/paketlerimiz?kategori=online",
                description: "Katalogdan gelen kök",
                target: null,
                children: [
                  {
                    id: "catalog-online-yks",
                    itemKey: "packages-online-yks",
                    label: "Katalog YKS",
                    href: "/paketlerimiz?kategori=online&alt=yks",
                    description: null,
                    target: null,
                    children: []
                  }
                ]
              },
              {
                id: "catalog-mentorluk",
                itemKey: "packages-mentorluk",
                label: "Mentorluk",
                href: "/mentorluk",
                description: null,
                target: null,
                children: []
              }
            ]
          },
          {
            id: "about",
            itemKey: "about",
            label: "Hakkımızda",
            href: "/hakkimizda",
            description: null,
            target: null,
            children: []
          }
        ]
      }
    });
  });

  await openPublicRoute(page, "/", 1440);
  await refreshPublicNavigation(page);
  await page.getByRole("link", { name: "Paketlerimiz" }).first().hover();
  const onlinePackageTab = page.getByRole("link", { name: "Katalog Online" });
  await expect(onlinePackageTab).toBeVisible();
  await onlinePackageTab.hover();
  await expect(page.getByRole("link", { name: "Katalog YKS" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Mentorluk" })).toBeVisible();
  await expect(page.getByText("Pasif Eski Kategori")).toHaveCount(0);
  const desktopRoots = normalizeTexts(await page.locator(".ega-nav__mega-tab").allTextContents());
  await page.screenshot({
    path: "test-results/public-website/catalog-navbar-desktop.png"
  });

  await openPublicRoute(page, "/", 390);
  await refreshPublicNavigation(page);
  await page.locator(".ega-mobile-nav-toggle").click();
  await page.locator(".ega-mobile-nav__group-toggle").first().click();
  await expect(page.locator(".ega-mobile-nav__submenu-title", { hasText: "Katalog Online" })).toBeVisible();
  await expect(page.locator(".ega-mobile-nav__submenu-link", { hasText: "Katalog YKS" })).toBeVisible();
  await expect(page.locator(".ega-mobile-nav__submenu-title", { hasText: "Mentorluk" })).toBeVisible();
  const mobileRoots = normalizeTexts(await page.locator(".ega-mobile-nav__submenu-title").allTextContents());

  expect(mobileRoots).toEqual(desktopRoots);
  await page.waitForTimeout(400);
  expect(navigationRequests).toBe(2);
  await assertNoHorizontalOverflow(page);
  await page.screenshot({
    path: "test-results/public-website/catalog-navbar-mobile.png",
    fullPage: true
  });
});

test("public navbar starts from server markup without a mount-time replacement fetch", async ({ page }) => {
  let navigationRequests = 0;
  const hydrationWarnings = collectHydrationWarnings(page);

  await page.route("**/v1/public/navigation?key=primary", async (route) => {
    navigationRequests += 1;
    await route.fulfill({ json: emptyNavigationResponse() });
  });

  const htmlResponse = await page.request.get("/");
  const serverHtml = await htmlResponse.text();
  expect(serverHtml).toContain("Paketlerimiz");

  await openPublicRoute(page, "/", 1440);
  await expectDesktopNavigationVisible(page);
  await expect(page.locator(".ega-nav").getByRole("link", { name: "Paketlerimiz" })).toBeVisible();
  await page.waitForTimeout(350);

  expect(navigationRequests).toBe(0);
  expect(hydrationWarnings).toEqual([]);
  await page.screenshot({
    path: "test-results/public-website/navbar-initial-server-render.png"
  });
});

test("public navbar remains stable during delayed refresh and rejects unexpected empty success responses", async ({ page }) => {
  let mode: "delayed" | "empty" = "delayed";
  const delayedResponse = createDeferred();

  await page.route("**/v1/public/navigation?key=primary", async (route) => {
    if (mode === "delayed") {
      await delayedResponse.promise;
      await safeFulfillJson(route, catalogNavigationResponse());
      return;
    }

    await safeFulfillJson(route, emptyNavigationResponse());
  });

  await openPublicRoute(page, "/", 1440);
  await refreshPublicNavigation(page);
  await page.waitForTimeout(180);
  await expectDesktopNavigationVisible(page);
  await expect(page.locator(".ega-nav").getByRole("link", { name: "Paketlerimiz" })).toBeVisible();
  await page.screenshot({
    path: "test-results/public-website/navbar-delayed-api-response.png"
  });

  delayedResponse.resolve();
  await expect(page.locator(".ega-nav").getByRole("link", { name: "Canli Dersler" })).toBeVisible();

  mode = "empty";
  await refreshPublicNavigationAndWait(page);
  await expect(page.locator(".ega-nav").getByRole("link", { name: "Canli Dersler" })).toBeVisible();
  await expect(page.getByText("Pasif Eski Kategori")).toHaveCount(0);
  await page.screenshot({
    path: "test-results/public-website/navbar-empty-response-protection.png"
  });
});

test("public navbar ignores stale older refresh responses", async ({ page }) => {
  let requestIndex = 0;
  const firstResponse = createDeferred();

  await page.route("**/v1/public/navigation?key=primary", async (route) => {
    requestIndex += 1;

    if (requestIndex === 1) {
      await firstResponse.promise;
      await safeFulfillJson(route, catalogNavigationResponse({ topLabel: "Stale Link" }));
      return;
    }

    await safeFulfillJson(route, catalogNavigationResponse({ topLabel: "Fresh Link" }));
  });

  await openPublicRoute(page, "/", 1440);
  await refreshPublicNavigation(page);
  await page.waitForTimeout(80);
  await refreshPublicNavigationAndWait(page);
  await expect(page.locator(".ega-nav").getByRole("link", { name: "Fresh Link" })).toBeVisible();

  firstResponse.resolve();
  await page.waitForTimeout(250);

  await expect(page.locator(".ega-nav").getByRole("link", { name: "Fresh Link" })).toBeVisible();
  await expect(page.locator(".ega-nav").getByRole("link", { name: "Stale Link" })).toHaveCount(0);
  expect(requestIndex).toBe(2);
});

test("public navbar keeps safe navigation on API 500 and accepts explicit disabled state", async ({ page }) => {
  let mode: "error" | "disabled" = "error";

  await page.route("**/v1/public/navigation?key=primary", async (route) => {
    if (mode === "error") {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ message: "navigation failed" })
      });
      return;
    }

    await route.fulfill({ json: disabledNavigationResponse() });
  });

  await openPublicRoute(page, "/", 1440);
  await refreshPublicNavigationAndWait(page);
  await expectDesktopNavigationVisible(page);
  await expect(page.getByText("Pasif Eski Kategori")).toHaveCount(0);
  await page.screenshot({
    path: "test-results/public-website/navbar-api-error-fallback.png"
  });

  mode = "disabled";
  await refreshPublicNavigationAndWait(page);
  await expect(page.locator(".ega-nav > a.ega-nav__link, .ega-nav > .ega-nav__item")).toHaveCount(0);
  await expect(page.locator(".ega-brand")).toBeVisible();
  await expect(page.locator(".ega-header__actions")).toBeVisible();
});

test("public navbar updates package root and child deactivation without losing unrelated links", async ({ page }) => {
  let response = catalogNavigationResponse();

  await page.route("**/v1/public/navigation?key=primary", async (route) => {
    await route.fulfill({ json: response });
  });

  await openPublicRoute(page, "/", 1440);
  await refreshPublicNavigationAndWait(page);
  await openDesktopPackagesMenu(page);
  await expect(page.getByRole("link", { name: "Katalog Online" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Katalog YKS" })).toBeVisible();
  await expect(page.locator(".ega-nav").getByRole("link", { name: "Canli Dersler" })).toBeVisible();

  response = catalogNavigationResponse({ includeOnlineRoot: false });
  await refreshPublicNavigationAndWait(page);
  await openDesktopPackagesMenu(page);
  await expect(page.getByRole("link", { name: "Katalog Online" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Mentorluk" })).toBeVisible();
  await expect(page.locator(".ega-nav").getByRole("link", { name: "Canli Dersler" })).toBeVisible();

  response = catalogNavigationResponse({ includeYksChild: false });
  await refreshPublicNavigationAndWait(page);
  await openDesktopPackagesMenu(page);
  await expect(page.getByRole("link", { name: "Katalog Online" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Katalog YKS" })).toHaveCount(0);
  await expect(page.locator(".ega-nav").getByRole("link", { name: "Canli Dersler" })).toBeVisible();
});

test("public navbar stays visible through reloads, route changes, resize, scroll, and account loading", async ({ page }) => {
  let navigationRequests = 0;
  const widths = Array.from({ length: 20 }, (_, index) => publicViewports[index % publicViewports.length]);

  await page.route("**/v1/public/navigation?key=primary", async (route) => {
    navigationRequests += 1;
    await route.fulfill({ json: emptyNavigationResponse() });
  });

  for (const width of widths) {
    await openPublicRoute(page, "/", width);

    await expectResponsiveNavigationVisible(page, width);
  }

  await openPublicRoute(page, "/", 1440);
  await page.evaluate(() => window.dispatchEvent(new Event("scroll")));
  await page.setViewportSize({ width: 1024, height: 960 });
  await expectResponsiveNavigationVisible(page, 1024);
  await openPublicRoute(page, "/hakkimizda", 1024);
  await expectResponsiveNavigationVisible(page, 1024);

  expect(navigationRequests).toBe(0);
  await page.screenshot({
    path: "test-results/public-website/navbar-reload-stability.png"
  });
});

for (const width of publicViewports) {
  test(`free-material directory and cards are responsive at ${width}px`, async ({ page }) => {
    await openPublicRoute(page, "/ucretsiz-materyaller", width);

    await expect(page.locator(".ega-free-directory-category").first()).toBeVisible();
    await assertNoHorizontalOverflow(page);
    await page.screenshot({
      path: `test-results/public-website/free-material-directory-${width}.png`,
      fullPage: true
    });
  });
}

test("PDF document page renders card actions instead of visible raw URLs", async ({ page }) => {
  await openPublicRoute(page, "/ucretsiz-materyaller/pdf-dokumanlar", 1440);

  await expect(page.locator(".ega-free-link-card").first()).toBeVisible();
  await expect(page.locator(".ega-free-link-card__icon").first()).toBeVisible();
  await expect(page.locator(".ega-free-link-card a").first()).toBeVisible();
  await expect(page.locator("body")).not.toContainText("https://cdn.example.com");
  await assertNoHorizontalOverflow(page);
  await page.screenshot({
    path: "test-results/public-website/pdf-download-card.png",
    fullPage: true
  });
});

test("public branding uses the published settings snapshot across desktop, mobile, footer and metadata", async ({ page }) => {
  const hydrationWarnings = collectHydrationWarnings(page);
  publicSiteSettingsState = createPublicSiteSettings({
    logoPrimaryUrl: "/branding/ega-logo-official.png?primary=mock",
    logoCompactUrl: "/branding/ega-mark-transparent.png?compact=mock",
    logoFooterUrl: "/branding/ega-logo-official.png?footer=mock",
    logoDarkUrl: "/branding/ega-logo-official.png?dark=mock",
    logoLightUrl: "/branding/ega-logo-official.png?light=mock",
    faviconUrl: "/icon.png?favicon=mock",
    defaultSocialImageUrl: "/branding/ega-logo-official.png?social=mock",
    logoAltText: "Mock yayın logosu"
  });

  await openPublicRoute(page, "/", 1440);
  await expectImageSrcContains(page.locator(".ega-brand__logo--desktop"), "primary=mock");
  await expectImageSrcContains(page.locator(".ega-footer__logo"), "footer=mock");
  await expectImageSrcContains(page.locator(".ega-cta-panel__brand-logo img"), "light=mock");
  await expect(page.locator("link[rel~='icon']").first()).toHaveAttribute("href", /favicon=mock/);
  await expect(page.locator("meta[property='og:image']").first()).toHaveAttribute("content", /social=mock/);
  await assertNoHorizontalOverflow(page);
  await page.screenshot({
    path: "test-results/public-website/branding-header-footer-desktop.png",
    fullPage: true
  });

  await openPublicRoute(page, "/hakkimizda", 1024);
  await expectImageSrcContains(page.locator(".ega-brand__logo--desktop"), "primary=mock");
  await assertNoHorizontalOverflow(page);

  await openPublicRoute(page, "/", 390);
  await expectImageSrcContains(page.locator(".ega-brand__logo--compact"), "compact=mock");
  await expectImageSrcContains(page.locator(".ega-footer__logo"), "footer=mock");
  await assertNoHorizontalOverflow(page);
  await page.screenshot({
    path: "test-results/public-website/branding-compact-mobile.png",
    fullPage: true
  });

  expect(hydrationWarnings).toEqual([]);
});

test("public site-settings refresh keeps last valid branding on malformed or failed responses", async ({ page }) => {
  publicSiteSettingsState = createPublicSiteSettings({
    logoPrimaryUrl: "/branding/ega-logo-official.png?primary=valid",
    logoCompactUrl: "/branding/ega-mark-transparent.png?compact=valid",
    logoFooterUrl: "/branding/ega-logo-official.png?footer=valid"
  });

  await openPublicRoute(page, "/", 1440);
  await expectImageSrcContains(page.locator(".ega-brand__logo--desktop"), "primary=valid");

  let requestCount = 0;
  let mode: "malformed" | "failure" = "malformed";
  await page.route("**/v1/public/site-settings", async (route) => {
    requestCount += 1;
    if (mode === "failure") {
      await route.fulfill({ status: 503, json: { message: "unavailable" } });
      return;
    }

    await route.fulfill({
      json: {
        ...createPublicSiteSettings(),
        logoPrimaryUrl: "",
        logoCompactUrl: "",
        logoFooterUrl: ""
      }
    });
  });

  await refreshPublicSiteSettingsAndWait(page);
  await expectImageSrcContains(page.locator(".ega-brand__logo--desktop"), "primary=valid");

  mode = "failure";
  await refreshPublicSiteSettingsAndWait(page, false);
  await expectImageSrcContains(page.locator(".ega-brand__logo--desktop"), "primary=valid");
  expect(requestCount).toBe(2);
});

test("public free-material routes keep successful empty states authoritative", async ({ page }) => {
  publicFreeMaterialsState = [
    {
      id: "cat_pdf",
      key: "pdf-documents",
      label: "PDF Dokümanlar",
      description: "Planlar",
      items: []
    }
  ];

  await openPublicRoute(page, "/ucretsiz-materyaller/pdf-dokumanlar", 1440);
  await expect(page.getByText("Bu kategoride şu anda yayında materyal bulunmuyor.")).toBeVisible();
  await expect(page.getByText("TYT Çalışma Planı PDF")).toHaveCount(0);
  await assertNoHorizontalOverflow(page);
  await page.screenshot({
    path: "test-results/public-website/free-material-empty-category.png",
    fullPage: true
  });

  publicFreeMaterialsState = [];
  await openPublicRoute(page, "/ucretsiz-materyaller", 390);
  await expect(
    page.getByText("Ücretsiz materyaller hazırlanıyor. Yeni içerikler yakında burada yayınlanacak.")
  ).toBeVisible();
  await expect(page.getByText("TYT Çalışma Planı PDF")).toHaveCount(0);
  await assertNoHorizontalOverflow(page);
});

test("public free-material routes show availability state on API failure", async ({ page }) => {
  publicFreeMaterialsStatus = 503;

  await openPublicRoute(page, "/ucretsiz-materyaller", 1024);
  await expect(
    page.getByText("Ücretsiz materyaller şu anda yüklenemiyor. Lütfen kısa süre sonra tekrar deneyin.")
  ).toBeVisible();
  await expect(page.getByText("TYT Çalışma Planı PDF")).toHaveCount(0);
  await assertNoHorizontalOverflow(page);
  await page.screenshot({
    path: "test-results/public-website/free-material-api-unavailable.png",
    fullPage: true
  });
});

test("managed free-material cards disappear, restore, and stay deleted without fallback resurrection", async ({ page }) => {
  await openPublicRoute(page, "/ucretsiz-materyaller/pdf-dokumanlar", 1440);
  await expect(page.getByText("TYT Çalışma Planı PDF")).toBeVisible();
  await expect(page.getByText("AYT Tekrar Çizelgesi PDF")).toHaveCount(0);
  await expect(page.getByText("Deneme Analiz Formu PDF")).toHaveCount(0);
  await expect(page.getByText("Hedef Takip Sayfası PDF")).toHaveCount(0);

  publicFreeMaterialsState = createPublicFreeMaterials({
    excludeSlugs: ["tyt-calisma-plani-pdf"]
  });
  await openPublicRoute(page, "/ucretsiz-materyaller/pdf-dokumanlar", 1440);
  await expect(page.getByText("TYT Çalışma Planı PDF")).toHaveCount(0);
  await page.screenshot({
    path: "test-results/public-website/free-material-archived-absent.png",
    fullPage: true
  });

  publicFreeMaterialsState = createPublicFreeMaterials();
  await openPublicRoute(page, "/ucretsiz-materyaller/pdf-dokumanlar", 1440);
  await expect(page.getByText("TYT Çalışma Planı PDF")).toBeVisible();
  await page.screenshot({
    path: "test-results/public-website/free-material-restored-card.png",
    fullPage: true
  });

  publicFreeMaterialsState = createPublicFreeMaterials({
    excludeSlugs: ["hedef-takip-sayfasi-pdf"]
  });
  await openPublicRoute(page, "/ucretsiz-materyaller", 390);
  await openPublicRoute(page, "/ucretsiz-materyaller/pdf-dokumanlar", 390);
  await expect(page.getByText("Hedef Takip Sayfası PDF")).toHaveCount(0);
  await assertNoHorizontalOverflow(page);
  await page.screenshot({
    path: "test-results/public-website/free-material-deleted-card-absent.png",
    fullPage: true
  });
});

test("public free-material destination routes avoid generic 500 pages", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    const text = message.text();
    if (/empty string.*src attribute|500.*Internal Server Error/i.test(text)) {
      consoleErrors.push(text);
    }
  });

  for (const routePath of [
    "/ucretsiz-materyaller/ayt-kac-gun-kaldi",
    "/ucretsiz-materyaller/tyt-kac-gun-kaldi",
    "/ucretsiz-materyaller/ydt-kac-gun-kaldi",
    "/ucretsiz-materyaller/2026-lgs-kac-gun-kaldi"
  ]) {
    await openPublicRoute(page, routePath, 1440);
    await expect(page.getByText("Internal Server Error")).toHaveCount(0);
    await assertNoHorizontalOverflow(page);
  }

  expect(consoleErrors).toEqual([]);
  await page.screenshot({
    path: "test-results/public-website/free-material-countdown-route.png",
    fullPage: true
  });
});

test("free-material directory adapts across category and card counts", async ({ page }) => {
  const scenarios = [
    { categories: 0, cards: [0], width: 1920, screenshot: "free-material-counts-zero.png" },
    { categories: 1, cards: [1], width: 1920, screenshot: "free-material-counts-one-category.png" },
    { categories: 2, cards: [1, 2], width: 1440, screenshot: "free-material-counts-two-categories.png" },
    { categories: 4, cards: [0, 1, 4, 12], width: 1280, screenshot: "free-material-counts-four-categories.png" },
    { categories: 9, cards: [1, 2, 4, 12, 1, 2, 4, 1, 0], width: 1024, screenshot: "free-material-counts-nine-categories.png" },
    { categories: 20, cards: Array.from({ length: 20 }, (_, index) => index % 5), width: 390, screenshot: "free-material-counts-twenty-mobile.png" }
  ];

  for (const scenario of scenarios) {
    publicFreeMaterialsState = createPublicFreeMaterialsMatrix(scenario.categories, scenario.cards);
    await openPublicRoute(page, "/ucretsiz-materyaller", scenario.width);
    await assertNoHorizontalOverflow(page);

    if (scenario.categories === 0) {
      await expect(
        page.getByText("Ücretsiz materyaller hazırlanıyor. Yeni içerikler yakında burada yayınlanacak.")
      ).toBeVisible();
    } else {
      await expect(page.locator(".ega-free-directory-category")).toHaveCount(scenario.categories);
      if ((scenario.cards[0] ?? 0) === 0) {
        await expect(page.getByText("Bu kategoride şu anda yayında materyal bulunmuyor.")).toBeVisible();
        const nextPopulatedIndex = scenario.cards.findIndex((count) => count > 0);
        if (nextPopulatedIndex > 0) {
          await page.locator(".ega-free-directory-category").nth(nextPopulatedIndex).click();
          await expect(page.locator(".ega-free-link-card").first()).toBeVisible();
        }
      } else {
        await expect(page.locator(".ega-free-link-card").first()).toBeVisible();
      }
    }

    await page.screenshot({
      path: `test-results/public-website/${scenario.screenshot}`,
      fullPage: true
    });
  }
});

test("public free-material download endpoint remains available for managed download cards", async ({ page }) => {
  await openPublicRoute(page, "/ucretsiz-materyaller/pdf-dokumanlar", 1440);
  const firstDownload = page.locator(".ega-free-link-card a").first();
  await expect(firstDownload).toHaveAttribute("href", /\/v1\/public\/free-materials\/item_1\/download/);

  const response = await page.request.get("http://localhost:4000/v1/public/free-materials/item_1/download");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-disposition"]).toContain("attachment");
});

async function openPublicRoute(page: Page, routePath: string, width: number) {
  await page.setViewportSize({ width, height: width === 390 ? 900 : 960 });
  await page.goto(routePath, { waitUntil: "domcontentloaded" });
  await hideNextDevOverlay(page);
  await expect(page.locator("main").first()).toBeVisible();
  await page.waitForFunction(() => document.documentElement.dataset.publicNavigationReady === "true");
  await page.waitForTimeout(120);
}

async function hideNextDevOverlay(page: Page) {
  await page.addStyleTag({
    content: "nextjs-portal, [data-nextjs-toast], [data-nextjs-devtools-button] { display: none !important; }"
  });
}

async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(2);
}

async function refreshPublicNavigation(page: Page) {
  const request = page.waitForRequest("**/v1/public/navigation?key=primary");
  await page.evaluate(() => window.dispatchEvent(new Event("ega:public-navigation-refresh")));
  await request;
}

async function refreshPublicNavigationAndWait(page: Page) {
  const response = page.waitForResponse("**/v1/public/navigation?key=primary");
  await refreshPublicNavigation(page);
  await response;
}

async function expectDesktopNavigationVisible(page: Page) {
  await expect(page.locator(".ega-nav")).toBeVisible();
  expect(await page.locator(".ega-nav > a.ega-nav__link, .ega-nav > .ega-nav__item").count()).toBeGreaterThan(0);
}

async function expectResponsiveNavigationVisible(page: Page, width: number) {
  if (width <= 1080) {
    await page.locator(".ega-mobile-nav-toggle").click();
    await expect(page.locator(".ega-mobile-nav__body").getByRole("link", { name: "Paketlerimiz" })).toBeVisible();
    await page.locator(".ega-mobile-nav__close").click();
    return;
  }

  await expectDesktopNavigationVisible(page);
}

async function openDesktopPackagesMenu(page: Page) {
  await page.getByRole("link", { name: "Paketlerimiz" }).first().hover();
}

function collectHydrationWarnings(page: Page) {
  const warnings: string[] = [];
  page.on("console", (message) => {
    const text = message.text();
    if (/hydration|hydrated|server rendered|did not match/i.test(text)) {
      warnings.push(text);
    }
  });
  return warnings;
}

function createDeferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });

  return { promise, resolve };
}

async function safeFulfillJson(route: Route, payload: unknown) {
  try {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(payload)
    });
  } catch {
    // The client may abort an obsolete navigation request before the mock responds.
  }
}

function catalogNavigationResponse(
  options: {
    topLabel?: string;
    includeOnlineRoot?: boolean;
    includeYksChild?: boolean;
  } = {}
) {
  const packageChildren = [];

  if (options.includeOnlineRoot !== false) {
    packageChildren.push({
      id: "catalog-online",
      itemKey: "packages-online",
      label: "Katalog Online",
      href: "/paketlerimiz?kategori=online",
      description: "Catalog root",
      target: null,
      children:
        options.includeYksChild === false
          ? []
          : [
              {
                id: "catalog-online-yks",
                itemKey: "packages-online-yks",
                label: "Katalog YKS",
                href: "/paketlerimiz?kategori=online&alt=yks",
                description: null,
                target: null,
                children: []
              }
            ]
    });
  }

  packageChildren.push({
    id: "catalog-mentorluk",
    itemKey: "packages-mentorluk",
    label: "Mentorluk",
    href: "/mentorluk",
    description: null,
    target: null,
    children: []
  });

  return {
    id: "menu_1",
    key: "primary",
    name: "Ana Menu",
    location: "PRIMARY",
    enabled: true,
    version: 4,
    generatedAt: "2026-09-01T00:00:00.000Z",
    source: "database",
    catalogStatus: "ready",
    items: [
      {
        id: "packages",
        itemKey: "packages",
        label: "Paketlerimiz",
        href: "/paketlerimiz",
        description: null,
        target: null,
        children: packageChildren
      },
      {
        id: "live-lessons",
        itemKey: "live-lessons",
        label: options.topLabel ?? "Canli Dersler",
        href: "/canli-dersler",
        description: null,
        target: null,
        children: []
      },
      {
        id: "about",
        itemKey: "about",
        label: "About",
        href: "/hakkimizda",
        description: null,
        target: null,
        children: []
      }
    ]
  };
}

function emptyNavigationResponse() {
  return {
    key: "primary",
    enabled: true,
    version: 4,
    generatedAt: "2026-09-01T00:00:00.000Z",
    items: []
  };
}

function disabledNavigationResponse() {
  return {
    key: "primary",
    enabled: false,
    version: 4,
    generatedAt: "2026-09-01T00:00:00.000Z",
    source: "disabled",
    items: []
  };
}

function normalizeTexts(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean);
}

async function startPublicApiServer() {
  const server = http.createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://localhost:4000");

    if (url.pathname === "/v1/public/free-materials/item_1/download") {
      response.writeHead(200, {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="tyt-plan.pdf"'
      });
      response.end("%PDF-1.4\nmock\n");
      return;
    }

    if (url.pathname === "/v1/public/site-settings") {
      sendJson(response, 200, publicSiteSettingsState);
      return;
    }

    if (url.pathname === "/v1/public/navigation") {
      sendJson(response, 200, catalogNavigationResponse());
      return;
    }

    if (url.pathname === "/v1/public/free-materials") {
      sendJson(response, publicFreeMaterialsStatus, publicFreeMaterialsStatus === 200 ? publicFreeMaterialsState : { message: "unavailable" });
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
      sendJson(response, 404, { message: "fallback page" });
      return;
    }

    if (url.pathname.startsWith("/v1/public/countdown-pages/")) {
      sendJson(response, 404, { message: "fallback countdown" });
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

function createPublicSiteSettings(overrides: Record<string, unknown> = {}) {
  const base = {
    id: "site_default",
    key: "default",
    siteName: "Eğitim Gurmesi Akademi",
    siteTitle: "EĞİTİM GURMESİ AKADEMİ",
    tagline: "Video paketleri",
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
    whatsappMessage: "Merhaba, Eğitim Gurmesi Akademi hakkında bilgi almak istiyorum.",
    whatsappHref:
      "https://wa.me/905318553827?text=Merhaba%2C%20E%C4%9Fitim%20Gurmesi%20Akademi%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum.",
    address: "Alacaatlı Mah. 4834. Sok. No: 10/8-59 Çankaya/Ankara",
    publicContactEmail: "bilgi@egitimgurmesi.com",
    footerBrandDescription: "Eğitim Gurmesi Akademi açıklaması.",
    footerQuickLinks: [
      { label: "Paketlerimiz", href: "/paketlerimiz" },
      { label: "Ücretsiz Materyaller", href: "/ucretsiz-materyaller" },
      { label: "Hakkımızda", href: "/hakkimizda" },
      { label: "Öğrenci Girişi", href: "/giris" }
    ],
    footerContactTitle: "İletişim",
    socialLinks: [],
    copyrightText: "© Eğitim Gurmesi Akademi. Tüm hakları saklıdır.",
    footerNotice: "Not",
    defaultSeoTitle: "Eğitim Gurmesi Akademi",
    defaultSeoDescription: "Video paketleri",
    version: 1
  };

  return {
    ...base,
    ...overrides
  };
}

function createPublicFreeMaterials(options: { excludeSlugs?: string[] } = {}) {
  const excluded = new Set(options.excludeSlugs ?? []);
  const items = [
    {
      id: "item_1",
      slug: "tyt-calisma-plani-pdf",
      title: "TYT Çalışma Planı PDF",
      itemType: "DOWNLOAD",
      badgeLabel: "PDF",
      summary: "Haftalık bloklar ve tekrar zamanlarını planlamak için TYT çalışma şablonu.",
      href: "/v1/public/free-materials/item_1/download",
      downloadHref: "/v1/public/free-materials/item_1/download",
      destinationMode: "DOWNLOAD",
      buttonLabel: "Dosyayı İndir",
      iconKey: "pdf",
      tone: "navy",
      coverImageUrl: null,
      displayFilename: "tyt-plan.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 4096,
      accessibilityLabel: "TYT Çalışma Planı PDF dosyasını indir",
      opensInNewTab: false,
      countdownPage: null
    }
  ].filter((item) => !excluded.has(item.slug));

  return [
    {
      id: "cat_pdf",
      key: "pdf-documents",
      label: "PDF Dokümanlar",
      description: "Planlama ve takip dokümanları.",
      items
    }
  ];
}

function createPublicFreeMaterialsMatrix(categoryCount: number, cardCounts: number[]) {
  return Array.from({ length: categoryCount }, (_, categoryIndex) => {
    const itemCount = cardCounts[categoryIndex] ?? 0;
    return {
      id: `cat_${categoryIndex + 1}`,
      key: categoryIndex === 0 ? "pdf-documents" : `category-${categoryIndex + 1}`,
      label: categoryIndex === 0 ? "PDF Dokümanlar" : `Kategori ${categoryIndex + 1}`,
      description: "Uyarlanabilir dizin testi.",
      items: Array.from({ length: itemCount }, (_, itemIndex) => ({
        id: `matrix_${categoryIndex + 1}_${itemIndex + 1}`,
        slug: `materyal-${categoryIndex + 1}-${itemIndex + 1}`,
        title:
          itemIndex === 0
            ? "Uzun başlıklı ücretsiz materyal kartı satır kırılması testi"
            : `Materyal ${categoryIndex + 1}.${itemIndex + 1}`,
        itemType: itemIndex % 3 === 0 ? "INTERNAL_PAGE" : itemIndex % 3 === 1 ? "EXTERNAL_LINK" : "COUNTDOWN",
        badgeLabel: itemIndex % 3 === 2 ? "Sayaç" : "Rehber",
        summary:
          itemIndex === 0
            ? "Uzun açıklama metni kartların satır yüksekliğini, CTA hizasını ve mobil taşmayı test eder."
            : "Kısa özet.",
        href: itemIndex % 3 === 1 ? "https://example.com/materyal" : "/ucretsiz-materyaller",
        downloadHref: null,
        destinationMode: itemIndex % 3 === 1 ? "EXTERNAL_LINK" : "INTERNAL_PAGE",
        buttonLabel: itemIndex % 3 === 1 ? "Dış Bağlantı" : "Aç",
        iconKey: itemIndex % 3 === 2 ? "timer" : "link",
        tone: itemIndex % 2 === 0 ? "teal" : "navy",
        coverImageUrl: null,
        displayFilename: itemIndex === 0 ? "uzun-dosya-adi-ornek-materyal.pdf" : null,
        mimeType: null,
        fileSizeBytes: null,
        accessibilityLabel: `Materyal ${categoryIndex + 1}.${itemIndex + 1} aç`,
        opensInNewTab: itemIndex % 3 === 1,
        countdownPage: null
      }))
    };
  });
}

async function refreshPublicSiteSettingsAndWait(page: Page, expectOk = true) {
  const responsePromise = page.waitForResponse("**/v1/public/site-settings");
  await page.evaluate(() => window.dispatchEvent(new Event("ega:public-site-settings-refresh")));
  const response = await responsePromise;

  if (expectOk) {
    expect(response.ok()).toBeTruthy();
  }
}

async function expectImageSrcContains(locator: ReturnType<Page["locator"]>, expected: string) {
  await expect
    .poll(async () => decodeURIComponent((await locator.first().getAttribute("src")) ?? ""))
    .toContain(expected);
}
