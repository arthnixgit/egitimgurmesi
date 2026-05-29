import { expect, test } from "@playwright/test";

test.describe("admin core smoke", () => {
  test("admin dashboard loads", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/localhost:3001\/?$/);
    await expect(page.locator('a[href="/icerik"]').first()).toBeVisible();
    await expect(page.locator('a[href="/ticaret"]').first()).toBeVisible();
  });

  test("content studio loads", async ({ page }) => {
    await page.goto("/icerik", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/icerik$/);
    await expect(page.getByText(/İçerik Stüdyosu|Icerik Studyosu/i).first()).toBeVisible();
  });

  test("commerce center and lead center load", async ({ page }) => {
    await page.goto("/ticaret", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/ticaret$/);
    await expect(page.getByText(/Ticaret ve Sipariş Merkezi|Ticaret ve Siparis Merkezi/i).first()).toBeVisible();

    await page.goto("/leadler", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/leadler$/);
    await expect(page.getByText(/Ücretsiz Ön Görüşme Talepleri|Ucretsiz On Gorusme Talepleri/i).first()).toBeVisible();
  });

  test("packages ribbon content can be saved and reverted", async ({ page }) => {
    await page.goto("/icerik", { waitUntil: "domcontentloaded" });

    await page.getByRole("button", { name: /Pazarlama Sayfaları|Pazarlama Sayfalari/i }).click();
    await page.locator("select").first().selectOption("packages");
    await expect(page.getByText("Paketlerimiz Ribbon").first()).toBeVisible();

    const ribbonInput = page.getByLabel(/Ribbon metni/i);
    const originalValue = (await ribbonInput.inputValue()).trim();
    const updatedValue = `${originalValue} [E2E]`;

    await ribbonInput.fill(updatedValue);
    await page.getByRole("button", { name: /Kaydet/i }).click();
    await expect(page.getByText(/Paketlerimiz sayfası kaydedildi|Paketlerimiz sayfasi kaydedildi/i).first()).toBeVisible();

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /Pazarlama Sayfaları|Pazarlama Sayfalari/i }).click();
    await page.locator("select").first().selectOption("packages");
    await expect(page.getByLabel(/Ribbon metni/i)).toHaveValue(updatedValue);

    await page.getByLabel(/Ribbon metni/i).fill(originalValue);
    await page.getByRole("button", { name: /Kaydet/i }).click();
    await expect(page.getByText(/Paketlerimiz sayfası kaydedildi|Paketlerimiz sayfasi kaydedildi/i).first()).toBeVisible();
    await expect(page.getByLabel(/Ribbon metni/i)).toHaveValue(originalValue);
  });
});
