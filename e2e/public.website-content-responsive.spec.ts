import { expect, test, type Page, type Route } from "@playwright/test";

const publicViewports = [1440, 1024, 390];

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
