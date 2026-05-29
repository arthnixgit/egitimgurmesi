import { expect, test } from "@playwright/test";

test.describe("public web smoke", () => {
  test("homepage loads key navigation and quick actions", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(page.locator('a[href="/paketlerimiz"]').first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Mini Quiz/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Ücretsiz|On Görüşme|Ön Görüşme/i })).toBeVisible();
  });

  test("packages page exposes filters and comparison section", async ({ page }) => {
    await page.goto("/paketlerimiz", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("button", { name: /Online Koçluk|Online Kocluk/i }).first()).toBeVisible();
    await expect(page.getByText(/Neden .*Gurmesi/i).first()).toBeVisible();
  });

  test("auth page exposes login and quick registration tabs", async ({ page }) => {
    await page.goto("/giris", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("button", { name: /Giriş Yap|Giris Yap/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Hızlı Kayıt|Hizli Kayit/i }).first()).toBeVisible();
  });
});
