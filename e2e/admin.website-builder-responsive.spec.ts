import { expect, test, type Page } from "@playwright/test";

type AccessMode = "branch" | "none";

let accessMode: AccessMode = "branch";
let contentRequestCount = 0;
let saveRequestCount = 0;
let mediaRequestCount = 0;
let mediaUploadRequestCount = 0;
let materialMutationRequestCount = 0;
let adminFreeMaterialsState = createAdminFreeMaterials();

const adminViewports = [1920, 1440, 1280, 1024, 768, 390];

test.beforeEach(async ({ page }) => {
  accessMode = "branch";
  contentRequestCount = 0;
  saveRequestCount = 0;
  mediaRequestCount = 0;
  mediaUploadRequestCount = 0;
  materialMutationRequestCount = 0;
  adminFreeMaterialsState = createAdminFreeMaterials();

  await page.addInitScript(() => {
    window.localStorage.setItem("ega_staff_access_token", "mock-access-token");
    window.localStorage.setItem("ega_staff_refresh_token", "mock-refresh-token");
  });

  await mockWebsiteApi(page);
});

for (const width of adminViewports) {
  test(`website editor responsive shell at ${width}px`, async ({ page }) => {
    await openWebsiteBuilder(page, "/web-sitesi", width);

    await expect(page.locator(".admin-website-builder__left")).toBeVisible();
    await expect(page.locator(".admin-website-builder__canvas")).toBeVisible();
    await expect(page.locator(".admin-website-builder__right")).toBeVisible();
    await expect(page.locator(".admin-builder-toolbar")).toBeVisible();
    await expect(page.locator(".admin-builder-panel-tabs").first()).toBeVisible();
    await expect(page.locator(".admin-website-builder__global-warning")).toBeVisible();
    await assertNoHorizontalOverflow(page);
    await page.screenshot({
      path: `test-results/admin-website-builder/website-builder-overview-${width}.png`,
      fullPage: true
    });
  });
}

test("website editor branding, media picker, canvas, slider and material preview areas render", async ({ page }) => {
  await openWebsiteBuilder(page, "/web-sitesi?alan=marka", 1440);
  await expect(page.getByText("Header ana logo")).toBeVisible();
  await expect(page.getByRole("button", { name: "Dosya Yükle" }).first()).toBeVisible();
  expect(mediaRequestCount).toBe(0);
  await page.getByRole("button", { name: "Medya Kütüphanesinden Seç" }).first().click();
  await expect(page.locator(".admin-builder-modal")).toBeVisible();
  await expect(page.getByRole("button", { name: /EGA logo/ })).toBeVisible();
  expect(mediaRequestCount).toBe(1);
  await page.screenshot({ path: "test-results/admin-website-builder/media-library-picker.png" });
  await page.keyboard.press("Escape");
  await expect(page.locator(".admin-website-builder__footer-preview")).toBeVisible();
  await page.screenshot({ path: "test-results/admin-website-builder/branding-settings.png" });

  await openWebsiteBuilder(page, "/web-sitesi?alan=footer", 1440);
  await expect(page.getByLabel("E.164 telefon")).toHaveValue("+905318553827");
  await expect(page.locator('.admin-website-builder__footer-preview a[href="tel:+905318553827"]')).toBeVisible();
  await expect(page.locator('.admin-website-builder__footer-preview a[href^="https://wa.me/905318553827"]')).toBeVisible();
  await page.screenshot({ path: "test-results/admin-website-builder/footer-editor.png" });

  await openWebsiteBuilder(page, "/web-sitesi?alan=sayfalar", 1440);
  await expect(page.locator(".admin-page-canvas")).toBeVisible();
  await expect(page.locator(".admin-editable-frame").first()).toBeVisible();
  await page.locator(".admin-editable-frame").nth(1).click();
  await expect(page.locator(".admin-editable-frame").nth(1)).toHaveAttribute("data-selected", "true");
  await page.screenshot({ path: "test-results/admin-website-builder/selected-editable-canvas-section.png" });
  await page.locator(".admin-inline-select").first().dblclick();
  await expect(page.locator(".admin-inline-editor").first()).toBeVisible();
  await page.locator(".admin-inline-editor").first().fill("Guncellenen baslik");
  await page.screenshot({ path: "test-results/admin-website-builder/inline-text-editing-state.png" });
  await page.getByRole("tab", { name: "Bileşenler" }).click();
  await page.locator(".admin-builder-widget-card").first().click();
  await expect(page.locator(".admin-editable-frame")).toHaveCount(4);
  await page.screenshot({ path: "test-results/admin-website-builder/widget-insertion-state.png" });
  await page.screenshot({ path: "test-results/admin-website-builder/page-section-navigator.png" });

  await page.getByRole("tab", { name: "Sayfalar" }).click();
  await page.getByRole("button", { name: /Ana Sayfa Sliderı/ }).click();
  await expect(page.locator(".admin-slider-editor")).toBeVisible();
  await expect(page.getByRole("button", { name: "Yeni Slide" })).toBeVisible();
  await expect(page.getByText("Primary CTA metni")).toBeVisible();
  await expect(page.getByText("Mobil slide görseli")).toBeVisible();
  await page.screenshot({ path: "test-results/admin-website-builder/homepage-slider-list.png" });
  await page.screenshot({ path: "test-results/admin-website-builder/homepage-slider-slide-editor.png" });
  await page.getByRole("button", { name: "Mobil" }).click();
  await page.screenshot({ path: "test-results/admin-website-builder/homepage-slider-mobile-preview.png" });

  await openWebsiteBuilder(page, "/web-sitesi?alan=ucretsiz-materyaller", 1440);
  await expect(page.getByRole("button", { name: "Yeni Kategori" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Yeni Kart" })).toBeVisible();
  await expect(page.locator(".admin-free-material-card-row").first()).toContainText("TYT Çalışma Planı PDF");
  await page.screenshot({ path: "test-results/admin-website-builder/free-material-editor.png" });
  await page.screenshot({ path: "test-results/admin-website-builder/download-card-preview.png" });

  await assertNoHorizontalOverflow(page);
});

test("website editor manages free-material archive, restore and safe delete lifecycle", async ({ page }) => {
  await openWebsiteBuilder(page, "/web-sitesi?alan=ucretsiz-materyaller", 1440);

  await expect(page.getByText("TYT Çalışma Planı PDF").first()).toBeVisible();
  await expect(page.getByText("AYT Tekrar Çizelgesi PDF").first()).toBeVisible();
  await expect(page.getByText("Deneme Analiz Formu PDF").first()).toBeVisible();
  await expect(page.getByText("Hedef Takip Sayfası PDF").first()).toBeVisible();
  await expect(page.locator(".admin-readiness-pill", { hasText: "Dosya Eksik" }).first()).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "test-results/admin-website-builder/four-managed-material-cards.png"
  });

  await page.getByTestId("material-card-archive").click();
  await expect.poll(() => materialMutationRequestCount).toBe(1);
  await page.getByTestId("material-filter-archived").click();
  await expect(page.getByText("TYT Çalışma Planı PDF").first()).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "test-results/admin-website-builder/archived-material-filter.png"
  });

  await page.getByTestId("material-card-restore").click();
  await expect.poll(() => materialMutationRequestCount).toBe(2);
  await page.getByTestId("material-filter-published").click();
  await expect(page.getByText("TYT Çalışma Planı PDF").first()).toBeVisible();

  await page.getByTestId("material-filter-all").click();
  await page.locator('[data-testid="material-card-row"][data-material-id="item_temp"] button').click();
  await expect(page.getByText("Geçici Silinebilir Kart").first()).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept("SİL"));
  await page.getByTestId("material-card-delete").click();
  await expect.poll(() => materialMutationRequestCount).toBe(3);
  await expect(page.getByText("Geçici Silinebilir Kart")).toHaveCount(0);

  await openWebsiteBuilder(page, "/web-sitesi?alan=ucretsiz-materyaller", 1440);
  await expect(page.getByText("Geçici Silinebilir Kart")).toHaveCount(0);
  await assertNoHorizontalOverflow(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "test-results/admin-website-builder/deleted-material-card-absent.png"
  });
});

test("website editor logo upload failure preserves draft, session and single upload request", async ({ page }) => {
  await openWebsiteBuilder(page, "/web-sitesi?alan=marka", 1440);

  const previewImage = page.locator(".admin-media-field__preview img").first();
  const originalPreviewUrl = await previewImage.getAttribute("src");
  await page.locator("input[type='file']").first().setInputFiles({
    name: "logo.png",
    mimeType: "image/png",
    buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00])
  });

  await expect(
    page.getByRole("alert").filter({ hasText: "Medya depolama alanına yazma izni yok" })
  ).toBeVisible();
  await expect(previewImage).toHaveAttribute("src", originalPreviewUrl ?? "");
  expect(mediaUploadRequestCount).toBe(1);
  await expect
    .poll(() => page.evaluate(() => window.localStorage.getItem("ega_staff_access_token")))
    .toBe("mock-access-token");
  await assertNoHorizontalOverflow(page);
  await page.screenshot({
    path: "test-results/admin-website-builder/branding-upload-error.png"
  });
});

test("website editor saves drafts and creates preview token without repeated calls", async ({ page }) => {
  await openWebsiteBuilder(page, "/web-sitesi?alan=footer", 1440);
  await page.locator(".admin-website-builder__right textarea").first().fill("Güncel footer açıklaması");
  await page.getByRole("button", { name: /Taslağı Kaydet/ }).click();
  await expect(page.getByText("Taslak kaydedildi.")).toBeVisible();
  await page.getByRole("button", { name: "Önizle" }).click();
  await expect(page.getByText(/Önizleme oturumu hazır/)).toBeVisible();

  expect(saveRequestCount).toBe(1);
  await assertNoHorizontalOverflow(page);
});

test("staff without website permission receives friendly state and keeps session tokens", async ({ page }) => {
  accessMode = "none";
  await openWebsiteBuilder(page, "/web-sitesi", 1440, false);

  await expect(page.getByRole("heading", { name: "Web sitesi yönetimi" })).toBeVisible();
  await expect(page.getByText("Bu alan için yetkiniz bulunmuyor.")).toBeVisible();
  expect(contentRequestCount).toBe(0);
  await expect
    .poll(() => page.evaluate(() => window.localStorage.getItem("ega_staff_access_token")))
    .toBe("mock-access-token");
});

async function openWebsiteBuilder(page: Page, routePath: string, width: number, expectBuilder = true) {
  await page.setViewportSize({ width, height: width === 390 ? 920 : 980 });
  await page.goto(routePath, { waitUntil: "domcontentloaded" });
  await hideNextDevOverlay(page);

  if (expectBuilder) {
    await expect(page.locator(".admin-website-builder")).toBeVisible();
    await page.waitForTimeout(120);
  }
}

async function hideNextDevOverlay(page: Page) {
  await page.addStyleTag({
    content: "nextjs-portal, [data-nextjs-toast], [data-nextjs-devtools-button] { display: none !important; }"
  });
}

async function assertNoHorizontalOverflow(page: Page) {
  const offenders = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>("body *"))
      .filter((element) => {
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
      .slice(0, 12)
  );

  expect(offenders).toEqual([]);
}

async function mockWebsiteApi(page: Page) {
  await page.route("http://localhost:4000/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^\/v1/, "");
    const access = accessMode === "branch" ? branchAccess() : noAccess();

    if (path === "/staff/bootstrap-status") {
      await route.fulfill({ json: { requiresBootstrap: false } });
      return;
    }

    if (path === "/auth/me") {
      await route.fulfill({
        json: {
          actorType: "STAFF",
          staffUser: {
            id: "staff_branch",
            email: "branch@example.com",
            firstName: "Bora",
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
          actorId: "staff_branch",
          roleKeys: access.roleKeys,
          permissionKeys: access.permissionKeys
        }
      });
      return;
    }

    if (accessMode === "none" && path.startsWith("/admin-content")) {
      contentRequestCount += 1;
      await route.fulfill({
        status: 403,
        json: { message: "Web sitesi yönetimi için yetkiniz bulunmuyor." }
      });
      return;
    }

    if (path === "/admin-content/site-settings") {
      contentRequestCount += 1;
      if (route.request().method() === "PUT") {
        saveRequestCount += 1;
        const payload = route.request().postDataJSON() as Record<string, unknown>;
        await route.fulfill({ json: siteSettings({ ...payload, version: 2, draftStatus: "DRAFT" }) });
        return;
      }

      await route.fulfill({ json: siteSettings() });
      return;
    }

    if (path === "/admin-content/site-settings/publish") {
      saveRequestCount += 1;
      const payload = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({ json: siteSettings({ ...payload, version: 2 }) });
      return;
    }

    if (path === "/admin-content/preview-token") {
      await route.fulfill({ json: { token: "signed.preview.token", expiresAt: 1798452000 } });
      return;
    }

    if (path === "/admin-content/navigation/primary") {
      contentRequestCount += 1;
      await route.fulfill({ json: navigation() });
      return;
    }

    if (path === "/admin-content/marketing-pages") {
      contentRequestCount += 1;
      await route.fulfill({ json: pages() });
      return;
    }

    if (path.startsWith("/admin-content/free-materials/items/")) {
      materialMutationRequestCount += 1;
      const itemIdOrSlug = decodeURIComponent(path.split("/")[4] ?? "");

      if (path.endsWith("/archive")) {
        setAdminMaterialItemStatus(itemIdOrSlug, "ARCHIVED");
        await route.fulfill({ json: adminFreeMaterialsState });
        return;
      }

      if (path.endsWith("/restore")) {
        setAdminMaterialItemStatus(itemIdOrSlug, "PUBLISHED");
        await route.fulfill({ json: adminFreeMaterialsState });
        return;
      }

      if (route.request().method() === "DELETE") {
        deleteAdminMaterialItem(itemIdOrSlug);
        await route.fulfill({ json: adminFreeMaterialsState });
        return;
      }

      if (path.endsWith("/move")) {
        moveAdminMaterialItem(itemIdOrSlug, (route.request().postDataJSON() as { direction?: number }).direction === -1 ? -1 : 1);
        await route.fulfill({ json: adminFreeMaterialsState });
        return;
      }
    }

    if (path === "/admin-content/free-materials") {
      contentRequestCount += 1;
      await route.fulfill({ json: adminFreeMaterialsState });
      return;
    }

    if (path === "/admin-content/staff-profiles") {
      contentRequestCount += 1;
      await route.fulfill({ json: { version: 1, groups: [] } });
      return;
    }

    if (path === "/admin-content/success-stories") {
      contentRequestCount += 1;
      await route.fulfill({ json: { version: 1, stories: [] } });
      return;
    }

    if (path === "/admin-content/revisions") {
      contentRequestCount += 1;
      await route.fulfill({
        json: [
          {
            id: "rev_1",
            scope: "global-website",
            entityType: "SiteSetting",
            entityKey: "default",
            version: 1,
            action: "website.site-settings.publish",
            summary: "Yayınlandı",
            beforeData: null,
            afterData: {},
            createdByStaffUserId: "staff_branch",
            createdAt: "2026-08-28T09:00:00.000Z"
          }
        ]
      });
      return;
    }

    if (path === "/admin-media/upload") {
      mediaUploadRequestCount += 1;
      await new Promise((resolve) => setTimeout(resolve, 150));
      await route.fulfill({
        status: 503,
        json: { message: "Medya depolama alanına yazma izni yok. Lütfen sistem yöneticisine bildirin." }
      });
      return;
    }

    if (path === "/admin-media") {
      mediaRequestCount += 1;
      await route.fulfill({
        json: [
          {
            id: "media_logo",
            kind: "BRANDING",
            sourceType: "LOCAL_UPLOAD",
            title: "EGA logo",
            altText: "EGA logo",
            mimeType: "image/png",
            originalFileName: "ega-logo.png",
            sizeBytes: 8192,
            publicUrl: "/branding/ega-logo-official.png",
            externalProvider: null,
            externalUrl: null,
            embedUrl: null,
            thumbnailUrl: "/branding/ega-logo-official.png",
            url: "/branding/ega-logo-official.png",
            playbackSourceType: null,
            createdAt: "2026-08-29T09:00:00.000Z",
            updatedAt: "2026-08-29T09:00:00.000Z",
            metadata: {}
          }
        ]
      });
      return;
    }

    await route.fulfill({ json: {} });
  });
}

function branchAccess() {
  return {
    roleKeys: ["branch-admin"],
    permissionKeys: ["website.read", "website.manage", "website.publish", "orders.read"]
  };
}

function noAccess() {
  return {
    roleKeys: ["accountant"],
    permissionKeys: ["orders.read"]
  };
}

function siteSettings(overrides: Record<string, unknown> = {}) {
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
    logoMarkUrl: "/branding/ega-mark-transparent.png",
    logoFooterUrl: "/branding/ega-logo-official.png",
    logoCompactUrl: "/branding/ega-mark-transparent.png",
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
    ...overrides,
    telHref: `tel:${String(overrides.canonicalPhone ?? base.canonicalPhone)}`,
    whatsappHref: `https://wa.me/${String(
      overrides.supportWhatsappNumber ?? base.supportWhatsappNumber
    )}?text=${encodeURIComponent(String(overrides.whatsappMessage ?? base.whatsappMessage))}`
  };
}

function navigation() {
  return {
    id: "menu_1",
    key: "primary",
    name: "Ana Menü",
    location: "PRIMARY",
    isActive: true,
    version: 1,
    items: [
      { itemKey: "home", label: "Ana Sayfa", href: "/", sortOrder: 10, isActive: true, children: [] },
      { itemKey: "packages", label: "Paketlerimiz", href: "/paketlerimiz", sortOrder: 20, isActive: true, children: [] }
    ]
  };
}

function pages() {
  return [
    {
      id: "page_home",
      key: "home",
      slug: "home",
      title: "Ana Sayfa",
      description: "Homepage",
      pageType: "HOME",
      publishStatus: "PUBLISHED",
      version: 1,
      sections: [
        {
          id: "section_1",
          sectionKey: "showcase-hero",
          eyebrow: "Basla",
          title: "Egitim Gurmesi",
          body: "Canli onizleme",
          variantKey: "showcase-hero",
          payload: {
            slides: [
              {
                id: "slide_mock",
                label: "Ana Sayfa",
                title: "Egitim Gurmesi slider",
                description: "Canli slider onizleme",
                tone: "teal",
                mediaType: "IMAGE",
                mediaUrl: "/homepage/showcase-plan.png",
                mobileMediaUrl: "",
                mediaAlt: "Slider gorseli",
                primaryCtaLabel: "Paketleri Incele",
                primaryCtaHref: "/paketlerimiz",
                secondaryCtaLabel: "Ucretsiz Materyaller",
                secondaryCtaHref: "/ucretsiz-materyaller",
                isActive: true
              }
            ],
            settings: {
              autoplay: true,
              intervalMs: 5200,
              transition: "fade",
              pauseOnHover: true,
              showArrows: true,
              showDots: true,
              keyboard: true,
              swipe: true,
              initialSlideId: "slide_mock"
            }
          },
          sortOrder: 10,
          isActive: true,
          publishStatus: "PUBLISHED"
        },
        {
          id: "section_2",
          sectionKey: "intro-text",
          eyebrow: "Rehberlik",
          title: "Sayfa bolumu",
          body: "Bu alan dogrudan canvas uzerinden duzenlenir.",
          variantKey: "heading",
          payload: {},
          sortOrder: 20,
          isActive: true,
          publishStatus: "PUBLISHED"
        },
        {
          id: "section_3",
          sectionKey: "package-surface",
          eyebrow: "Paketler",
          title: "Paket dizini cevresi",
          body: "Paket verisi kilitli dinamik modulden gelir.",
          variantKey: "packages-surface",
          payload: {},
          sortOrder: 30,
          isActive: true,
          publishStatus: "PUBLISHED"
        }
      ]
    }
  ];
}

function createAdminFreeMaterials() {
  return {
    version: 1,
    categories: [
      {
        id: "cat_1",
        key: "pdf-documents",
        label: "PDF Dokümanlar",
        description: "Planlar",
        sortOrder: 10,
        publishStatus: "PUBLISHED",
        items: [
          {
            id: "item_1",
            slug: "tyt-calisma-plani-pdf",
            title: "TYT Çalışma Planı PDF",
            itemType: "DOWNLOAD",
            badgeLabel: "PDF",
            summary: "Haftalık çalışma planı",
            href: null,
            buttonLabel: "Dosyayı İndir",
            iconKey: "pdf",
            tone: "blue",
            coverImageUrl: null,
            downloadUrl: "https://cdn.example.com/tyt-plan.pdf",
            mediaAssetId: null,
            displayFilename: "tyt-plan.pdf",
            mimeType: "application/pdf",
            fileSizeBytes: 4096,
            accessibilityLabel: "TYT Çalışma Planı PDF dosyasını indir",
            opensInNewTab: false,
            sortOrder: 10,
            isFeatured: true,
            publishStatus: "PUBLISHED",
            countdownPageSlug: null
          },
          {
            id: "item_2",
            slug: "ayt-tekrar-cizelgesi-pdf",
            title: "AYT Tekrar Çizelgesi PDF",
            itemType: "PDF",
            badgeLabel: "PDF Doküman",
            summary: "AYT konu tekrarlarını haftalara ayıran sade çizelge.",
            href: null,
            buttonLabel: "Dosya eklenince indir",
            iconKey: "pdf",
            tone: "navy",
            coverImageUrl: null,
            downloadUrl: null,
            mediaAssetId: null,
            displayFilename: null,
            mimeType: null,
            fileSizeBytes: null,
            accessibilityLabel: null,
            opensInNewTab: false,
            sortOrder: 20,
            isFeatured: false,
            publishStatus: "DRAFT",
            countdownPageSlug: null
          },
          {
            id: "item_3",
            slug: "deneme-analiz-formu-pdf",
            title: "Deneme Analiz Formu PDF",
            itemType: "PDF",
            badgeLabel: "PDF Doküman",
            summary: "Net, süre ve eksik konu değerlendirmesi için analiz formu.",
            href: null,
            buttonLabel: "Dosya eklenince indir",
            iconKey: "pdf",
            tone: "navy",
            coverImageUrl: null,
            downloadUrl: null,
            mediaAssetId: null,
            displayFilename: null,
            mimeType: null,
            fileSizeBytes: null,
            accessibilityLabel: null,
            opensInNewTab: false,
            sortOrder: 30,
            isFeatured: false,
            publishStatus: "DRAFT",
            countdownPageSlug: null
          },
          {
            id: "item_4",
            slug: "hedef-takip-sayfasi-pdf",
            title: "Hedef Takip Sayfası PDF",
            itemType: "PDF",
            badgeLabel: "PDF Doküman",
            summary: "Aylık hedefleri ve tamamlanan görevleri işlemek için takip sayfası.",
            href: null,
            buttonLabel: "Dosya eklenince indir",
            iconKey: "pdf",
            tone: "navy",
            coverImageUrl: null,
            downloadUrl: null,
            mediaAssetId: null,
            displayFilename: null,
            mimeType: null,
            fileSizeBytes: null,
            accessibilityLabel: null,
            opensInNewTab: false,
            sortOrder: 40,
            isFeatured: false,
            publishStatus: "DRAFT",
            countdownPageSlug: null
          },
          {
            id: "item_temp",
            slug: "gecici-silinebilir-kart",
            title: "Geçici Silinebilir Kart",
            itemType: "INTERNAL_PAGE",
            badgeLabel: "Test",
            summary: "Kalıcı silme akışı için güvenli geçici kart.",
            href: "/ucretsiz-materyaller",
            buttonLabel: "Aç",
            iconKey: "link",
            tone: "teal",
            coverImageUrl: null,
            downloadUrl: null,
            mediaAssetId: null,
            displayFilename: null,
            mimeType: null,
            fileSizeBytes: null,
            accessibilityLabel: null,
            opensInNewTab: false,
            sortOrder: 50,
            isFeatured: false,
            publishStatus: "DRAFT",
            countdownPageSlug: null
          }
        ]
      }
    ],
    countdownPages: []
  };
}

function setAdminMaterialItemStatus(itemIdOrSlug: string, publishStatus: string) {
  for (const category of adminFreeMaterialsState.categories) {
    const item = category.items.find((candidate) => candidate.id === itemIdOrSlug || candidate.slug === itemIdOrSlug);
    if (item) {
      item.publishStatus = publishStatus;
      adminFreeMaterialsState = { ...adminFreeMaterialsState, version: adminFreeMaterialsState.version + 1 };
      return;
    }
  }
}

function deleteAdminMaterialItem(itemIdOrSlug: string) {
  adminFreeMaterialsState = {
    ...adminFreeMaterialsState,
    version: adminFreeMaterialsState.version + 1,
    categories: adminFreeMaterialsState.categories.map((category) => ({
      ...category,
      items: category.items.filter((item) => item.id !== itemIdOrSlug && item.slug !== itemIdOrSlug)
    }))
  };
}

function moveAdminMaterialItem(itemIdOrSlug: string, direction: -1 | 1) {
  adminFreeMaterialsState = {
    ...adminFreeMaterialsState,
    version: adminFreeMaterialsState.version + 1,
    categories: adminFreeMaterialsState.categories.map((category) => {
      const index = category.items.findIndex((item) => item.id === itemIdOrSlug || item.slug === itemIdOrSlug);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= category.items.length) {
        return category;
      }

      const items = [...category.items];
      const [item] = items.splice(index, 1);
      items.splice(nextIndex, 0, item);

      return {
        ...category,
        items: items.map((candidate, order) => ({ ...candidate, sortOrder: (order + 1) * 10 }))
      };
    })
  };
}
