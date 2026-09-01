import { expect, test, type Page } from "@playwright/test";

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
  await page.locator(".ega-mobile-nav-toggle").click();
  await page.locator(".ega-mobile-nav__group-toggle").first().click();
  await expect(page.locator(".ega-mobile-nav__submenu-title", { hasText: "Katalog Online" })).toBeVisible();
  await expect(page.locator(".ega-mobile-nav__submenu-link", { hasText: "Katalog YKS" })).toBeVisible();
  await expect(page.locator(".ega-mobile-nav__submenu-title", { hasText: "Mentorluk" })).toBeVisible();
  const mobileRoots = normalizeTexts(await page.locator(".ega-mobile-nav__submenu-title").allTextContents());

  expect(mobileRoots).toEqual(desktopRoots);
  await page.waitForTimeout(400);
  expect(navigationRequests).toBeGreaterThan(0);
  expect(navigationRequests).toBeLessThanOrEqual(4);
  await assertNoHorizontalOverflow(page);
  await page.screenshot({
    path: "test-results/public-website/catalog-navbar-mobile.png",
    fullPage: true
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

function normalizeTexts(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean);
}
