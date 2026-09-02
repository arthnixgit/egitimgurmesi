import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { getFreeMaterialsContent, requestPublicSiteSettingsSnapshot } from "./public-content-api";

describe("public free-material content API", () => {
  afterEach(() => {
    delete (globalThis as { fetch?: typeof fetch }).fetch;
  });

  it("keeps a successful empty category empty instead of substituting legacy fallback cards", async () => {
    mockPublicFreeMaterialsResponse([
      {
        id: "cat_pdf",
        key: "pdf-documents",
        label: "PDF Dökümanlar",
        description: null,
        items: []
      }
    ]);

    const content = await getFreeMaterialsContent();

    assert.equal(content.status, "ready");
    assert.equal(content.categories.length, 1);
    assert.equal(content.pdfDocuments.length, 0);
    assert.doesNotMatch(JSON.stringify(content), /TYT Çalışma Planı PDF/);
  });

  it("keeps a successful zero-category response empty", async () => {
    mockPublicFreeMaterialsResponse([]);

    const content = await getFreeMaterialsContent();

    assert.equal(content.status, "ready");
    assert.equal(content.categories.length, 0);
    assert.equal(content.freeTools.length, 0);
    assert.equal(content.pdfDocuments.length, 0);
  });

  it("marks free materials unavailable only when the API request fails", async () => {
    (globalThis as { fetch?: typeof fetch }).fetch = async () =>
      ({
        ok: false,
        status: 503,
        json: async () => ({})
      }) as Response;

    const content = await getFreeMaterialsContent();

    assert.equal(content.status, "unavailable");
    assert.equal(content.categories.length, 0);
    assert.equal(content.pdfDocuments.length, 0);
  });

  it("treats PDF wrapper cards without a download action as normal managed links", async () => {
    mockPublicFreeMaterialsResponse([
      {
        id: "cat_pdf",
        key: "pdf-documents",
        label: "PDF Dökümanlar",
        description: null,
        items: [
          {
            id: "item_1",
            slug: "tyt-calisma-plani-pdf",
            title: "TYT Çalışma Planı PDF",
            itemType: "PDF",
            badgeLabel: "PDF Döküman",
            summary: "Plan",
            href: "/ucretsiz-materyaller/tyt-kac-gun-kaldi",
            downloadHref: null,
            buttonLabel: "İçeriği İncele",
            iconKey: "pdf",
            tone: "navy",
            coverImageUrl: null,
            displayFilename: null,
            mimeType: null,
            fileSizeBytes: null,
            accessibilityLabel: null,
            opensInNewTab: false,
            countdownPage: null
          }
        ]
      }
    ]);

    const content = await getFreeMaterialsContent();
    const item = content.pdfDocuments[0];

    assert.equal(item.href, "/ucretsiz-materyaller/tyt-kac-gun-kaldi");
    assert.equal(item.downloadHref, undefined);
    assert.equal(item.opensInNewTab, false);
  });
});

describe("public site-settings API", () => {
  afterEach(() => {
    delete (globalThis as { fetch?: typeof fetch }).fetch;
  });

  it("accepts complete public settings snapshots for client refresh", async () => {
    mockPublicSiteSettingsResponse({
      ...baseSiteSettingsResponse(),
      logoPrimaryUrl: "/media/header.png"
    });

    const settings = await requestPublicSiteSettingsSnapshot({ rejectMalformed: true });

    assert.equal(settings.logoPrimaryUrl, "/media/header.png");
  });

  it("rejects malformed refresh snapshots before they can replace current branding", async () => {
    mockPublicSiteSettingsResponse({
      ...baseSiteSettingsResponse(),
      logoPrimaryUrl: ""
    });

    await assert.rejects(
      () => requestPublicSiteSettingsSnapshot({ rejectMalformed: true }),
      /Malformed public site settings response/
    );
  });
});

function mockPublicFreeMaterialsResponse(categories: unknown[]) {
  (globalThis as { fetch?: typeof fetch }).fetch = async (input) => {
    assert.match(String(input), /\/public\/free-materials$/);
    return {
      ok: true,
      status: 200,
      json: async () => categories
    } as Response;
  };
}

function mockPublicSiteSettingsResponse(payload: Record<string, unknown>) {
  (globalThis as { fetch?: typeof fetch }).fetch = async (input) => {
    assert.match(String(input), /\/public\/site-settings$/);
    return {
      ok: true,
      status: 200,
      json: async () => payload
    } as Response;
  };
}

function baseSiteSettingsResponse() {
  return {
    siteName: "Eğitim Gurmesi Akademi",
    siteTitle: "EĞİTİM GURMESİ AKADEMİ",
    supportWhatsappNumber: "905318553827",
    logoPrimaryUrl: "/branding/ega-logo-official.png",
    logoCompactUrl: "/branding/ega-mark-transparent.png",
    logoMarkUrl: "/branding/ega-mark-transparent.png",
    logoFooterUrl: "/branding/ega-logo-official.png",
    logoDarkUrl: "/branding/ega-logo-official.png",
    logoLightUrl: "/branding/ega-logo-official.png",
    faviconUrl: "/icon.png",
    defaultSocialImageUrl: "/branding/ega-logo-official.png",
    logoAltText: "Eğitim Gurmesi Akademi",
    displayPhone: "+90 531 855 38 27",
    canonicalPhone: "+905318553827",
    telHref: "tel:+905318553827",
    whatsappMessage: "Merhaba",
    whatsappHref: "https://wa.me/905318553827?text=Merhaba",
    address: "Ankara",
    footerBrandDescription: "Açıklama",
    footerQuickLinks: [{ label: "Paketlerimiz", href: "/paketlerimiz" }],
    footerContactTitle: "İletişim",
    socialLinks: [],
    copyrightText: "© Eğitim Gurmesi Akademi"
  };
}
