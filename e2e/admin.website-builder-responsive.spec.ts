import { expect, test, type Page } from "@playwright/test";

type AccessMode = "branch" | "none";

let accessMode: AccessMode = "branch";
let contentRequestCount = 0;
let saveRequestCount = 0;
let mediaRequestCount = 0;
let mediaUploadRequestCount = 0;

const adminViewports = [1920, 1440, 1280, 1024, 768, 390];

test.beforeEach(async ({ page }) => {
  accessMode = "branch";
  contentRequestCount = 0;
  saveRequestCount = 0;
  mediaRequestCount = 0;
  mediaUploadRequestCount = 0;

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
  await page.screenshot({ path: "test-results/admin-website-builder/media-library-picker.png", fullPage: true });
  await page.keyboard.press("Escape");
  await expect(page.locator(".admin-website-builder__footer-preview")).toBeVisible();
  await page.screenshot({ path: "test-results/admin-website-builder/branding-settings.png", fullPage: true });

  await openWebsiteBuilder(page, "/web-sitesi?alan=footer", 1440);
  await expect(page.getByLabel("E.164 telefon")).toHaveValue("+905318553827");
  await expect(page.locator('.admin-website-builder__footer-preview a[href="tel:+905318553827"]')).toBeVisible();
  await expect(page.locator('.admin-website-builder__footer-preview a[href^="https://wa.me/905318553827"]')).toBeVisible();
  await page.screenshot({ path: "test-results/admin-website-builder/footer-editor.png", fullPage: true });

  await openWebsiteBuilder(page, "/web-sitesi?alan=sayfalar", 1440);
  await expect(page.locator(".admin-page-canvas")).toBeVisible();
  await expect(page.locator(".admin-editable-frame").first()).toBeVisible();
  await page.locator(".admin-editable-frame").nth(1).click();
  await expect(page.locator(".admin-editable-frame").nth(1)).toHaveAttribute("data-selected", "true");
  await page.screenshot({ path: "test-results/admin-website-builder/selected-editable-canvas-section.png", fullPage: true });
  await page.locator(".admin-inline-select").first().dblclick();
  await expect(page.locator(".admin-inline-editor").first()).toBeVisible();
  await page.locator(".admin-inline-editor").first().fill("Guncellenen baslik");
  await page.screenshot({ path: "test-results/admin-website-builder/inline-text-editing-state.png", fullPage: true });
  await page.getByRole("tab", { name: "Bileşenler" }).click();
  await page.locator(".admin-builder-widget-card").first().click();
  await expect(page.locator(".admin-editable-frame")).toHaveCount(4);
  await page.screenshot({ path: "test-results/admin-website-builder/widget-insertion-state.png", fullPage: true });
  await page.screenshot({ path: "test-results/admin-website-builder/page-section-navigator.png", fullPage: true });

  await page.getByRole("tab", { name: "Sayfalar" }).click();
  await page.getByRole("button", { name: /Ana Sayfa Sliderı/ }).click();
  await expect(page.locator(".admin-slider-editor")).toBeVisible();
  await expect(page.getByRole("button", { name: "Yeni Slide" })).toBeVisible();
  await expect(page.getByText("Primary CTA metni")).toBeVisible();
  await expect(page.getByText("Mobil slide görseli")).toBeVisible();
  await page.screenshot({ path: "test-results/admin-website-builder/homepage-slider-list.png", fullPage: true });
  await page.screenshot({ path: "test-results/admin-website-builder/homepage-slider-slide-editor.png", fullPage: true });
  await page.getByRole("button", { name: "Mobil" }).click();
  await page.screenshot({ path: "test-results/admin-website-builder/homepage-slider-mobile-preview.png", fullPage: true });

  await openWebsiteBuilder(page, "/web-sitesi?alan=ucretsiz-materyaller", 1440);
  await expect(page.getByRole("button", { name: "Yeni Kategori" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Yeni Kart" })).toBeVisible();
  await expect(page.locator(".admin-website-builder__download-card").first()).toContainText("TYT Plan");
  await page.screenshot({ path: "test-results/admin-website-builder/free-material-editor.png", fullPage: true });
  await page.screenshot({ path: "test-results/admin-website-builder/download-card-preview.png", fullPage: true });

  await assertNoHorizontalOverflow(page);
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
    path: "test-results/admin-website-builder/branding-upload-error.png",
    fullPage: true
  });
});

test("website editor saves drafts and creates preview token without repeated calls", async ({ page }) => {
  await openWebsiteBuilder(page, "/web-sitesi?alan=footer", 1440);
  await page.getByLabel("Footer marka açıklaması").fill("Güncel footer açıklaması");
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

    if (path === "/admin-content/free-materials") {
      contentRequestCount += 1;
      await route.fulfill({ json: freeMaterials() });
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

function freeMaterials() {
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
            slug: "tyt-plan",
            title: "TYT Plan",
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
            accessibilityLabel: "TYT Plan dosyasını indir",
            opensInNewTab: false,
            sortOrder: 10,
            isFeatured: true,
            publishStatus: "PUBLISHED",
            countdownPageSlug: null
          }
        ]
      }
    ],
    countdownPages: []
  };
}
