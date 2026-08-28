import { expect, test, type Page } from "@playwright/test";

type AccessMode = "branch" | "none";

let accessMode: AccessMode = "branch";
let contentRequestCount = 0;
let saveRequestCount = 0;

const adminViewports = [1920, 1440, 1280, 1024, 768, 390];

test.beforeEach(async ({ page }) => {
  accessMode = "branch";
  contentRequestCount = 0;
  saveRequestCount = 0;

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
    await expect(page.getByText("Bu alanda yapılan değişiklikler tüm genel web sitesini etkiler.")).toBeVisible();
    await assertNoHorizontalOverflow(page);
    await page.screenshot({
      path: `test-results/admin-website-builder/editor-${width}.png`,
      fullPage: true
    });
  });
}

test("website editor branding, footer, page navigator and material preview areas render", async ({ page }) => {
  await openWebsiteBuilder(page, "/web-sitesi?alan=marka", 1440);
  await expect(page.getByLabel("Header ana logo")).toBeVisible();
  await expect(page.locator(".admin-website-builder__footer-preview")).toBeVisible();
  await page.screenshot({ path: "test-results/admin-website-builder/branding-settings.png", fullPage: true });

  await openWebsiteBuilder(page, "/web-sitesi?alan=footer", 1440);
  await expect(page.getByLabel("E.164 telefon")).toHaveValue("+905318553827");
  await expect(page.locator('.admin-website-builder__footer-preview a[href="tel:+905318553827"]')).toBeVisible();
  await expect(page.locator('.admin-website-builder__footer-preview a[href^="https://wa.me/905318553827"]')).toBeVisible();
  await page.screenshot({ path: "test-results/admin-website-builder/footer-editor.png", fullPage: true });

  await openWebsiteBuilder(page, "/web-sitesi?alan=sayfalar", 1440);
  await expect(page.locator(".admin-website-builder__section-stack article").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Çoğalt" })).toBeVisible();
  await page.screenshot({ path: "test-results/admin-website-builder/page-section-navigator.png", fullPage: true });

  await openWebsiteBuilder(page, "/web-sitesi?alan=ucretsiz-materyaller", 1440);
  await expect(page.getByRole("button", { name: "Yeni Kategori" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Yeni Kart" })).toBeVisible();
  await expect(page.locator(".admin-website-builder__download-card").first()).toContainText("TYT Plan");
  await page.screenshot({ path: "test-results/admin-website-builder/free-material-editor.png", fullPage: true });
  await page.screenshot({ path: "test-results/admin-website-builder/download-card-preview.png", fullPage: true });

  await assertNoHorizontalOverflow(page);
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

    if (path === "/admin-media") {
      await route.fulfill({ json: [] });
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
          sectionKey: "hero",
          eyebrow: "Başla",
          title: "Eğitim Gurmesi",
          body: "Canlı önizleme",
          variantKey: "Heading",
          payload: {},
          sortOrder: 10,
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
