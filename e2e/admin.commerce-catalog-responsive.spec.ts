import { expect, test, type Page } from "@playwright/test";

const now = "2026-08-27T09:00:00.000Z";
const parentNames: Record<string, string> = {
  "online-kocluk": "Online Koçluk",
  "yuz-yuze-kocluk": "Yüz Yüze Koçluk",
  "yazili-kampi": "Yazılı Kampı (Hazırlık)",
  "ozel-ders": "Özel Ders",
  "deneme-kulubu": "Deneme Kulübü",
  "tekrar-kampi": "Tekrar Kampı"
};

type AccessMode = "super" | "orders";

let accessMode: AccessMode = "super";
let catalogEditorRequestCount = 0;
let lastProductSaveBody: Record<string, unknown> | null = null;
let lastProductDeleteBody: string | null = null;
let deleteMode: "safe" | "history" = "safe";

const adminViewports = [1920, 1440, 1280, 1024, 768, 390];

test.beforeEach(async ({ page }) => {
  accessMode = "super";
  catalogEditorRequestCount = 0;
  lastProductSaveBody = null;
  lastProductDeleteBody = null;
  deleteMode = "safe";

  await page.addInitScript(() => {
    window.localStorage.setItem("ega_staff_access_token", "mock-access-token");
    window.localStorage.setItem("ega_staff_refresh_token", "mock-refresh-token");
  });

  await mockCommerceApi(page);
});

for (const width of adminViewports) {
  test(`commerce category hierarchy at ${width}px`, async ({ page }) => {
    await openCommerce(page, width);

    await expect(page.getByRole("button", { name: /Online Koçluk/ }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Yüz Yüze Koçluk/ }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /YKS/ }).first()).toBeVisible();
    await expect(page.locator(".admin-category-root-card")).toHaveCount(6);
    await expect(page.locator(".admin-category-child-item").first()).toBeVisible();
    await assertNoHorizontalOverflow(page);
    await page.screenshot({
      path: `test-results/admin-commerce/category-hierarchy-${width}.png`,
      fullPage: true
    });
  });
}

for (const width of adminViewports) {
  test(`commerce package editor at ${width}px`, async ({ page }) => {
    await openCommerce(page, width);
    await page.getByRole("button", { name: /Paket Yönetimi/ }).click();

    await expect(page.getByText("Step 1 — Konum ve Temel Bilgiler").first()).toBeVisible();
    await expect(page.getByLabel("Ana Kategori").first()).toBeVisible();
    await expect(page.getByLabel("Alt Kategori").first()).toBeVisible();
    await expect(page.locator(".admin-package-preview .ega-pack-card")).toBeVisible();
    await expect(page.locator(".admin-readiness-list .admin-readiness-item")).toHaveCount(8);
    await assertNoHorizontalOverflow(page);
    await page.screenshot({
      path: `test-results/admin-commerce/package-editor-${width}.png`,
      fullPage: true
    });
  });
}

test("commerce card preview supports desktop and mobile modes without checkout navigation", async ({ page }) => {
  await openCommerce(page, 1440);
  await page.getByRole("button", { name: /Paket Yönetimi/ }).click();

  await expect(page.locator(".admin-package-preview[data-preview-mode='desktop'] .ega-pack-card")).toBeVisible();
  await page.getByRole("button", { name: "Mobile Card" }).click();
  await expect(page.locator(".admin-package-preview[data-preview-mode='mobile'] .ega-pack-card")).toBeVisible();

  const checkoutPreviewLink = page.locator(".admin-package-preview").getByRole("link", { name: "Satın Al" });
  await expect(checkoutPreviewLink).toHaveAttribute("href", "#admin-card-preview");
  await expect(checkoutPreviewLink).toHaveAttribute("aria-disabled", "true");
  await page.screenshot({
    path: "test-results/admin-commerce/mobile-card-preview.png",
    fullPage: true
  });
});

test("package save succeeds without sending response-only metadata", async ({ page }) => {
  await openCommerce(page, 1440);
  await page.getByRole("button", { name: /Paket/ }).first().click();

  await page.getByRole("button", { name: /Tasla/ }).click();
  await expect(page.getByText("Taslak kaydedildi.")).toBeVisible();
  expect(lastProductSaveBody).not.toBeNull();
  expect(lastProductSaveBody).not.toHaveProperty("categoryName");
  expect(lastProductSaveBody).not.toHaveProperty("rootCategorySlug");
  expect(lastProductSaveBody).not.toHaveProperty("rootCategoryName");
  expect(lastProductSaveBody).not.toHaveProperty("categoryIsRoot");
  await assertNoHorizontalOverflow(page);
  await page.screenshot({
    path: "test-results/admin-commerce/package-save-success.png",
    fullPage: true
  });
});

test("package delete with history shows controlled archive recommendation", async ({ page }) => {
  deleteMode = "history";
  await openCommerce(page, 1440);
  await page.getByRole("button", { name: /Paket/ }).first().click();
  page.once("dialog", (dialog) => dialog.accept("SİL"));

  await page.getByRole("button", { name: /^Sil$/ }).last().click();

  await expect(page.getByText(/Paket silinemez/)).toBeVisible();
  expect(lastProductDeleteBody).toBeNull();
  await assertNoHorizontalOverflow(page);
  await page.screenshot({
    path: "test-results/admin-commerce/package-delete-history-message.png",
    fullPage: true
  });
});

test("non-super commerce staff sees order management only and does not fetch catalog editors", async ({ page }) => {
  accessMode = "orders";
  await openCommerce(page, 1440);

  await expect(page.getByRole("button", { name: /Sipariş Yönetimi/ }).first()).toBeVisible();
  await expect(page.getByText("Sipariş Operasyonu").first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Kategori Yönetimi/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Paket Yönetimi/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Yeni Kategori|Yeni Paket|Yayınla|Sil/ })).toHaveCount(0);
  expect(catalogEditorRequestCount).toBe(0);
  await expect
    .poll(() => page.evaluate(() => window.localStorage.getItem("ega_staff_access_token")))
    .toBe("mock-access-token");
  await assertNoHorizontalOverflow(page);
  await page.screenshot({
    path: "test-results/admin-commerce/non-super-order-only.png",
    fullPage: true
  });
});

async function openCommerce(page: Page, width: number) {
  await page.setViewportSize({ width, height: width === 390 ? 920 : 980 });
  await page.goto("/ticaret", { waitUntil: "domcontentloaded" });
  await hideNextDevOverlay(page);
  await expect(page.getByText("Ticaret ve Sipariş Merkezi").first()).toBeVisible();
  await page.waitForTimeout(120);
}

async function hideNextDevOverlay(page: Page) {
  await page.addStyleTag({
    content: "nextjs-portal, [data-nextjs-toast], [data-nextjs-devtools-button] { display: none !important; }"
  });
}

async function assertNoHorizontalOverflow(page: Page) {
  const offenders = await page.evaluate(() => {
    return Array.from(document.querySelectorAll<HTMLElement>("body *"))
      .filter((element) => {
        if (element.closest(".admin-app-sidebar[aria-hidden='true']")) {
          return false;
        }

        const style = window.getComputedStyle(element);
        if (style.display === "none" || style.visibility === "hidden") {
          return false;
        }

        const rect = element.getBoundingClientRect();
        return rect.width > 0 && (rect.left < -2 || rect.right > window.innerWidth + 2);
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();

        return {
          tag: element.tagName.toLowerCase(),
          className: typeof element.className === "string" ? element.className : "",
          text: element.textContent?.trim().replace(/\s+/g, " ").slice(0, 80) ?? "",
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width)
        };
      })
      .slice(0, 12);
  });

  expect(offenders).toEqual([]);
}

async function mockCommerceApi(page: Page) {
  await page.route("http://localhost:4000/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^\/v1/, "");
    const access = accessMode === "super" ? superAccess() : orderOnlyAccess();

    if (path === "/staff/bootstrap-status") {
      await route.fulfill({ json: { requiresBootstrap: false } });
      return;
    }

    if (path === "/auth/me") {
      await route.fulfill({
        json: {
          actorType: "STAFF",
          staffUser: {
            id: accessMode === "super" ? "staff_super" : "staff_branch",
            email: accessMode === "super" ? "super@example.com" : "branch@example.com",
            firstName: accessMode === "super" ? "Ada" : "Bora",
            lastName: "Yönetici",
            status: "ACTIVE",
            roleKeys: access.roleKeys,
            permissionKeys: access.permissionKeys
          }
        }
      });
      return;
    }

    if (path === "/staff/overview") {
      await route.fulfill({
        json: {
          actorType: "STAFF",
          actorId: accessMode === "super" ? "staff_super" : "staff_branch",
          roleKeys: access.roleKeys,
          permissionKeys: access.permissionKeys
        }
      });
      return;
    }

    if (path === "/admin-commerce/categories") {
      catalogEditorRequestCount += 1;
      await route.fulfill({
        status: accessMode === "super" ? 200 : 403,
        json: accessMode === "super" ? catalogCategories() : { message: "Paket kataloğunu yalnızca Super Admin yönetebilir." }
      });
      return;
    }

    if (path === "/admin-commerce/products") {
      catalogEditorRequestCount += 1;
      await route.fulfill({
        status: accessMode === "super" ? 200 : 403,
        json: accessMode === "super" ? catalogProducts() : { message: "Paket kataloğunu yalnızca Super Admin yönetebilir." }
      });
      return;
    }

    if (path === "/admin-commerce/products/product_yks" && route.request().method() === "PATCH") {
      catalogEditorRequestCount += 1;
      lastProductSaveBody = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({ json: { ...catalogProducts()[0], ...lastProductSaveBody, id: "product_yks" } });
      return;
    }

    if (path === "/admin-commerce/products/product_yks" && route.request().method() === "DELETE") {
      catalogEditorRequestCount += 1;
      lastProductDeleteBody = route.request().postData();
      if (deleteMode === "history") {
        await route.fulfill({
          status: 400,
          json: {
            message:
              "Bu paketin sipariş veya kayıt geçmişi bulunuyor. Paket silinemez; arşivleyerek yayından kaldırabilirsiniz."
          }
        });
        return;
      }

      await route.fulfill({ json: { status: "deleted", id: "product_yks" } });
      return;
    }

    if (path === "/admin-commerce/products/product_yks") {
      catalogEditorRequestCount += 1;
      await route.fulfill({ json: catalogProducts()[0] });
      return;
    }

    if (path === "/admin-commerce/orders") {
      await route.fulfill({ json: [orderSummary()] });
      return;
    }

    if (path === "/admin-commerce/orders/ORD-1") {
      await route.fulfill({ json: orderDetail() });
      return;
    }

    if (path === "/admin-media") {
      await route.fulfill({ json: mediaAssets() });
      return;
    }

    await route.fulfill({ json: {} });
  });
}

function superAccess() {
  return {
    roleKeys: ["super-admin"],
    permissionKeys: ["orders.read", "products.manage", "pricing.manage", "coupons.manage"]
  };
}

function orderOnlyAccess() {
  return {
    roleKeys: ["branch-admin"],
    permissionKeys: ["orders.read", "products.manage", "pricing.manage"]
  };
}

function catalogCategories() {
  return [
    root("online-kocluk", "Online Koçluk", 10),
    root("yuz-yuze-kocluk", "Yüz Yüze Koçluk", 20),
    root("yazili-kampi", "Yazılı Kampı (Hazırlık)", 30),
    root("ozel-ders", "Özel Ders", 40),
    root("deneme-kulubu", "Deneme Kulübü", 50),
    root("tekrar-kampi", "Tekrar Kampı", 60),
    child("online-kocluk--yks", "YKS", "online-kocluk", 10),
    child("online-kocluk--lgs", "LGS", "online-kocluk", 20),
    child("online-kocluk--9-10-sinif", "9. ve 10. Sınıflar", "online-kocluk", 30),
    child("online-kocluk--11-sinif", "11. Sınıf", "online-kocluk", 40),
    child("online-kocluk--kpss", "KPSS", "online-kocluk", 50),
    child("yazili-kampi--kamp-icerigi", "Kamp İçeriği", "yazili-kampi", 10),
    child("yazili-kampi--hazirlik-takvimi", "Hazırlık Takvimi", "yazili-kampi", 20),
    child("ozel-ders--online", "Online", "ozel-ders", 10),
    child("ozel-ders--yuz-yuze", "Yüz Yüze", "ozel-ders", 20),
    child("deneme-kulubu--basili-kargo", "Basılı Kargo", "deneme-kulubu", 10),
    child("deneme-kulubu--gercek-mekan", "Gerçek Mekan", "deneme-kulubu", 20),
    child("tekrar-kampi--tekrar-plani", "Tekrar Planı", "tekrar-kampi", 10),
    child("tekrar-kampi--basvuru-takvimi", "Başvuru Takvimi", "tekrar-kampi", 20)
  ];
}

function catalogProducts() {
  return [
    {
      id: "product_yks",
      slug: "yks-kocluk",
      name: "YKS Koçluk Paketi",
      categorySlug: "online-kocluk--yks",
      categoryName: "YKS",
      rootCategorySlug: "online-kocluk",
      rootCategoryName: "Online Koçluk",
      categoryIsRoot: false,
      categoryIsActive: true,
      rootCategoryIsActive: true,
      shortDescription: "Kişisel plan, haftalık koç görüşmesi ve deneme takibi.",
      description: "YKS hazırlık sürecinde koçluk takibi.",
      type: "COACHING_PACKAGE",
      provider: "LOCAL",
      publishStatus: "PUBLISHED",
      isFeatured: true,
      sortOrder: 10,
      accentColor: "teal",
      coverImageUrl: "",
      introVideoSourceType: null,
      introVideoUrl: null,
      introVideoPosterUrl: null,
      introVideoTitle: null,
      variants: [
        {
          id: "variant_yks",
          title: "Aylık",
          sku: "YKS-AYLIK",
          billingLabel: "₺1.200",
          price: "1200",
          compareAtPrice: "1500",
          currency: "TRY",
          isDefault: true,
          isActive: true,
          hasInstallments: true,
          installmentCount: 6,
          sortOrder: 10
        }
      ],
      features: [
        { id: "feature_1", title: "Haftalık koç görüşmesi", description: "Plan ve takip", sortOrder: 10 },
        { id: "feature_2", title: "Deneme analizi", description: "Net takibi", sortOrder: 20 }
      ]
    },
    {
      id: "product_legacy",
      slug: "legacy-root-package",
      name: "Eski Kök Paket",
      categorySlug: "online-kocluk",
      categoryName: "Online Koçluk",
      rootCategorySlug: "online-kocluk",
      rootCategoryName: "Online Koçluk",
      categoryIsRoot: true,
      categoryIsActive: true,
      rootCategoryIsActive: true,
      shortDescription: "Onarım gerektiren eski kayıt.",
      description: "",
      type: "COACHING_PACKAGE",
      provider: "LOCAL",
      publishStatus: "DRAFT",
      sortOrder: 20,
      accentColor: "amber",
      variants: [{ id: "variant_legacy", title: "Standart", sku: "LEGACY", price: "900", currency: "TRY", isDefault: true, isActive: true }],
      features: [{ id: "feature_legacy", title: "Onarım bekliyor", sortOrder: 10 }]
    }
  ];
}

function root(slug: string, name: string, sortOrder: number) {
  return {
    id: `cat_${slug}`,
    slug,
    name,
    parentSlug: null,
    parentName: null,
    description: `${name} açıklaması`,
    sortOrder,
    isActive: true,
    childCategoryCount: 0,
    productCount: 0
  };
}

function child(slug: string, name: string, parentSlug: string, sortOrder: number) {
  return {
    id: `cat_${slug}`,
    slug,
    name,
    parentSlug,
    parentName: parentNames[parentSlug] ?? null,
    description: `${name} alt kategorisi`,
    sortOrder,
    isActive: true,
    childCategoryCount: 0,
    productCount: 0
  };
}

function orderSummary() {
  return {
    id: "order_1",
    orderNumber: "ORD-1",
    userEmail: "veli@example.com",
    status: "PAID",
    currency: "TRY",
    subtotalAmount: "1200",
    discountAmount: "0",
    totalAmount: "1200",
    paidAt: now,
    createdAt: now,
    updatedAt: now,
    note: "Kontrol edildi",
    paymentStatus: "PAID",
    paymentProvider: "PAYTR",
    redirectMode: false,
    externalOrderStatus: null,
    items: [{ id: "item_1", titleSnapshot: "YKS Koçluk Paketi", skuSnapshot: "YKS-AYLIK", quantity: 1, unitPrice: "1200", totalAmount: "1200", provider: "LOCAL", variantTitle: "Aylık", productSlug: "yks-kocluk" }],
    externalOrders: []
  };
}

function orderDetail() {
  return {
    ...orderSummary(),
    userId: "student_1",
    couponCode: null,
    taxAmount: "0",
    payments: [{ id: "payment_1", provider: "PAYTR", method: "CARD", status: "PAID", amount: "1200", currency: "TRY", paidAt: now, createdAt: now, updatedAt: now, attempts: [] }],
    externalOrders: [],
    timeline: [{ timestamp: now, label: "Ödeme alındı", description: "PayTR ödemesi tamamlandı.", source: "payment", tone: "success" }]
  };
}

function mediaAssets() {
  return [
    {
      id: "media_1",
      kind: "IMAGE",
      sourceType: "EXTERNAL_URL",
      title: "Paket Kapak",
      altText: "Paket kapak görseli",
      externalUrl: "https://example.com/package.jpg",
      thumbnailUrl: "https://example.com/package.jpg",
      url: "https://example.com/package.jpg",
      createdAt: now,
      updatedAt: now
    }
  ];
}
