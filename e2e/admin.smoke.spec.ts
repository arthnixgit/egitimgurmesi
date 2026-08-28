import { expect, test } from "@playwright/test";

test.describe("admin core smoke", () => {
  test("admin dashboard loads", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/localhost:3001\/?$/);
    await expect(page.locator('a[href="/web-sitesi"]').first()).toBeVisible();
    await expect(page.locator('a[href="/ticaret"]').first()).toBeVisible();
  });

  test("website management loads", async ({ page }) => {
    await page.goto("/web-sitesi", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/web-sitesi/);
    await expect(page.getByText(/Web Sitesi Yönetimi|Web Sitesi Yonetimi/i).first()).toBeVisible();
  });

  test("commerce center and lead center load", async ({ page }) => {
    await page.goto("/ticaret", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/ticaret$/);
    await expect(page.getByText(/Ticaret ve Sipariş Merkezi|Ticaret ve Siparis Merkezi/i).first()).toBeVisible();

    await page.goto("/leadler", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/leadler$/);
    await expect(page.getByText(/Ücretsiz Ön Görüşme Talepleri|Ucretsiz On Gorusme Talepleri/i).first()).toBeVisible();
  });

  test("legacy content route redirects to website management", async ({ page }) => {
    await page.goto("/icerik", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/web-sitesi/);
  });
});
