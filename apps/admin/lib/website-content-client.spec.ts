import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { deleteAdminProduct } from "./commerce-client";
import {
  serializeFreeMaterialsPayload,
  serializeSiteSettingsPayload,
  serializeStaffProfilesPayload,
  serializeSuccessStoriesPayload,
  type AdminFreeMaterialsDocument,
  type AdminSiteSettings,
  type AdminStaffProfilesDocument,
  type AdminSuccessStoriesDocument
} from "./auth-client";

describe("Admin website content client payloads", () => {
  afterEach(() => {
    delete (globalThis as { fetch?: typeof fetch }).fetch;
    delete (globalThis as { localStorage?: Storage }).localStorage;
  });

  it("strips site-settings response-only fields from write payloads", () => {
    const payload = serializeSiteSettingsPayload(siteSettingsResponse());

    assert.equal("id" in payload, false);
    assert.equal("key" in payload, false);
    assert.equal("telHref" in payload, false);
    assert.equal("whatsappHref" in payload, false);
    assert.equal("publishedAt" in payload, false);
    assert.equal("updatedAt" in payload, false);
    assert.equal("draftStatus" in payload, false);
    assert.equal(payload.displayPhone, "+90 531 855 38 27");
    assert.equal(payload.canonicalPhone, "+905318553827");
    assert.equal(payload.supportWhatsappNumber, "905318553827");
    assert.deepEqual(payload.footerQuickLinks, [
      { label: "Paketlerimiz", href: "/paketlerimiz" },
      { label: "Ekstra", href: "/ekstra" }
    ]);
  });

  it("strips structured website document response IDs from write payloads", () => {
    const staffPayload = serializeStaffProfilesPayload(staffProfilesResponse());
    const storyPayload = serializeSuccessStoriesPayload(successStoriesResponse());
    const materialsPayload = serializeFreeMaterialsPayload(freeMaterialsResponse());

    assert.equal("id" in staffPayload.groups[0], false);
    assert.equal("id" in staffPayload.groups[0].profiles[0], false);
    assert.equal("id" in storyPayload.stories[0], false);
    assert.equal("id" in materialsPayload.categories[0], false);
    assert.equal("id" in materialsPayload.categories[0].items[0], false);
    assert.equal("version" in materialsPayload.categories[0].items[0], false);
    assert.equal("id" in materialsPayload.countdownPages[0], false);
    assert.equal("id" in materialsPayload.countdownPages[0].targets[0], false);
    assert.equal(materialsPayload.categories[0].items[0].downloadUrl, "https://cdn.example.com/plan.pdf");
  });

  it("sends package delete as a route-only DELETE without product metadata body", async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    (globalThis as { localStorage?: Storage }).localStorage = {
      getItem: (key: string) => (key.includes("access") ? "access-token" : null),
      setItem: () => undefined,
      removeItem: () => undefined,
      clear: () => undefined,
      key: () => null,
      length: 1
    } as Storage;
    (globalThis as { fetch?: typeof fetch }).fetch = async (input, init) => {
      requests.push({ url: String(input), init });
      return {
        ok: true,
        status: 200,
        json: async () => ({ status: "deleted", id: "product_1" })
      } as Response;
    };

    await deleteAdminProduct("product_1");

    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, "http://localhost:4000/v1/admin-commerce/products/product_1");
    assert.equal(requests[0].init?.method, "DELETE");
    assert.equal(requests[0].init?.body, undefined);
    assert.deepEqual(requests[0].init?.headers, { Authorization: "Bearer access-token" });
  });
});

function siteSettingsResponse(): AdminSiteSettings {
  return {
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
    whatsappMessage: "Merhaba",
    whatsappHref: "https://wa.me/905318553827?text=Merhaba",
    address: "Ankara",
    publicContactEmail: "bilgi@egitimgurmesi.com",
    footerBrandDescription: "Açıklama",
    footerQuickLinks: [
      { label: "Paketlerimiz", href: "/paketlerimiz", responseOnly: true } as { label: string; href: string },
      { label: "Ekstra", href: "/ekstra" }
    ],
    footerContactTitle: "İletişim",
    socialLinks: [{ label: "Instagram", href: "https://instagram.com/egitimgurmesi" }],
    copyrightText: "© Eğitim Gurmesi",
    footerNotice: "Not",
    defaultSeoTitle: "SEO",
    defaultSeoDescription: "SEO açıklaması",
    version: 4,
    publishedAt: "2026-08-28T09:00:00.000Z",
    updatedAt: "2026-08-28T09:00:00.000Z",
    draftStatus: "DRAFT"
  };
}

function staffProfilesResponse(): AdminStaffProfilesDocument {
  return {
    version: 2,
    groups: [
      {
        id: "group_1",
        key: "coaches",
        label: "Koçlar",
        eyebrow: "Ekip",
        description: "Alan",
        sortOrder: 10,
        publishStatus: "PUBLISHED",
        profiles: [
          {
            id: "profile_1",
            slug: "ada",
            fullName: "Ada Yönetici",
            title: "Koç",
            city: "Ankara",
            biography: "Biyografi",
            photoUrl: "/team/ada.jpg",
            sortOrder: 10,
            publishStatus: "PUBLISHED"
          }
        ]
      }
    ]
  };
}

function successStoriesResponse(): AdminSuccessStoriesDocument {
  return {
    version: 3,
    stories: [
      {
        id: "story_1",
        slug: "basari",
        studentName: "Ece",
        city: "Ankara",
        examLabel: "YKS",
        resultTitle: "Derece",
        highlight: "Planlı çalışma",
        story: "Metin",
        avatarUrl: "/stories/ece.jpg",
        sortOrder: 10,
        isFeatured: true,
        publishStatus: "PUBLISHED"
      }
    ]
  };
}

function freeMaterialsResponse(): AdminFreeMaterialsDocument {
  return {
    version: 5,
    categories: [
      {
        id: "cat_1",
        key: "pdf-documents",
        label: "PDF Dokümanlar",
        description: "Dokümanlar",
        sortOrder: 10,
        publishStatus: "PUBLISHED",
        items: [
          {
            id: "item_1",
            slug: "tyt-plan",
            title: "TYT Plan",
            itemType: "DOWNLOAD",
            badgeLabel: "PDF",
            summary: "Plan",
            href: "/ignored",
            buttonLabel: "İndir",
            iconKey: "pdf",
            tone: "blue",
            coverImageUrl: null,
            downloadUrl: "https://cdn.example.com/plan.pdf",
            mediaAssetId: null,
            displayFilename: "tyt-plan.pdf",
            mimeType: "application/pdf",
            fileSizeBytes: 1024,
            accessibilityLabel: "TYT Plan dosyasını indir",
            opensInNewTab: false,
            sortOrder: 10,
            isFeatured: false,
            publishStatus: "PUBLISHED",
            version: 8,
            countdownPageSlug: null
          }
        ]
      }
    ],
    countdownPages: [
      {
        id: "countdown_1",
        slug: "tyt-kac-gun-kaldi",
        eyebrow: "Sayaç",
        title: "TYT",
        description: "Geri sayım",
        updatedLabel: "Güncel",
        videoTitle: "Video",
        videoNote: "Not",
        publishStatus: "PUBLISHED",
        targets: [
          {
            id: "target_1",
            label: "TYT",
            targetAt: "2027-06-20T07:00:00.000Z",
            dateLabel: "20 Haziran",
            note: "Sabah",
            sortOrder: 10
          }
        ],
        officialLinks: [
          {
            id: "link_1",
            title: "ÖSYM",
            linkType: "Resmi",
            summary: "Duyuru",
            href: "https://www.osym.gov.tr/",
            buttonLabel: "Aç",
            sortOrder: 10
          }
        ],
        articleSections: [
          {
            id: "section_1",
            title: "Rehber",
            body: "Metin",
            sortOrder: 10
          }
        ]
      }
    ]
  };
}
