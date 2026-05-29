import { expect, test } from "@playwright/test";

test.describe("student panel smoke", () => {
  test("authenticated student can open dashboard", async ({ page }) => {
    await page.goto("/hesabim", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/hesabim$/);
    await expect(page.getByText(/Panel yükleniyor|Öğrenci bilgileri|Ogrenci bilgileri/i).first()).toBeVisible();
  });

  test("authenticated student can open LMS landing", async ({ page }) => {
    await page.goto("/derslerim", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/derslerim$/);
    await expect(page.getByText(/Ders arşivin ve modül akışın burada|Ders arsivin ve modul akisin burada/i).first()).toBeVisible();
  });

  test("authenticated student can initiate local checkout", async ({ page }) => {
    await page.goto("/checkout/yazili-kampi-icerik-paketi", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("button", { name: /Siparişi Oluştur ve Devam Et|Siparisi Olustur ve Devam Et/i })).toBeVisible();
    await page.getByRole("button", { name: /Siparişi Oluştur ve Devam Et|Siparisi Olustur ve Devam Et/i }).click();

    await expect(page.getByText("Local payment gateway foundation is ready").first()).toBeVisible();
    await expect(page.locator("body")).toContainText("EGA-");
  });
});
