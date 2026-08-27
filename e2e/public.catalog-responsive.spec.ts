import { expect, test, type Page } from "@playwright/test";

const productSlug = "yks-sinava-kadar-full-paket";

for (const width of [1440, 390]) {
  test(`public packages catalog at ${width}px`, async ({ page }) => {
    await openPublicRoute(page, "/paketlerimiz", width);

    await expect(page.getByRole("button", { name: /Online Koçluk/ }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Yüz Yüze Koçluk/ }).first()).toBeVisible();
    await expect(page.locator(".ega-pack-card").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "İncele" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Satın Al" }).first()).toBeVisible();
    await assertNoHorizontalOverflow(page);
    await page.screenshot({
      path: `test-results/public-catalog/packages-${width}.png`,
      fullPage: true
    });
  });
}

test("public package filters preserve root and subcategory behavior", async ({ page }) => {
  await openPublicRoute(page, "/paketlerimiz?kategori=online-coaching", 1440);
  await expect(page.getByRole("button", { name: /YKS/ }).first()).toBeVisible();
  await expect(page.locator(".ega-pack-card").first()).toBeVisible();
  await page.screenshot({
    path: "test-results/public-catalog/active-root-category.png",
    fullPage: true
  });

  await openPublicRoute(page, "/paketlerimiz?kategori=online-coaching&alt=yks", 1440);
  await expect(page.locator(".ega-pack-card").first()).toBeVisible();
  await expect(page.getByText(/YKS/).first()).toBeVisible();
  await page.screenshot({
    path: "test-results/public-catalog/active-subcategory.png",
    fullPage: true
  });
});

test("public product detail and checkout routes resolve the default package", async ({ page }) => {
  await openPublicRoute(page, `/paketlerimiz/${productSlug}`, 1440);
  await expect(page.getByRole("heading", { level: 1 }).first()).toContainText(/YKS/i);
  await expect(page.getByRole("link", { name: "Satın Al" }).first()).toBeVisible();
  await assertNoHorizontalOverflow(page);

  await openPublicRoute(page, `/checkout/${productSlug}`, 1440);
  await expect(page.getByRole("heading", { level: 1 }).first()).toContainText(/YKS/i);
  await expect(page.getByText(/Satın alma adımlarını güvenle başlat/).first()).toBeVisible();
  await assertNoHorizontalOverflow(page);
});

test("public empty filters keep the Turkish empty state", async ({ page }) => {
  await openPublicRoute(page, "/paketlerimiz?kategori=online-coaching&alt=printed-cargo", 390);

  await expect(page.getByText("Bu filtrede henüz görünür kart yok.").first()).toBeVisible();
  await assertNoHorizontalOverflow(page);
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
