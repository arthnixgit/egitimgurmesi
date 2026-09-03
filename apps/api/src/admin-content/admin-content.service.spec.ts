import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AuthActorType, ContentStatus, FreeMaterialItemType, PERMISSION_KEYS, ROLE_KEYS } from "@ega/db";
import { BadRequestException, ConflictException, ForbiddenException } from "@nestjs/common";
import type { AuthenticatedRequestContext } from "../auth/auth.types";
import { AdminContentService } from "./admin-content.service";
import type {
  SaveFreeMaterialsDocumentDto,
  SaveNavigationMenuDto,
  SaveSiteSettingsDto
} from "./dto/admin-content.dto";

describe("AdminContentService website policy", () => {
  it("allows Super Admin and Branch Admin website reads", async () => {
    for (const auth of [superAdminAuth, branchAdminAuth]) {
      const { service } = createSiteSettingsHarness();
      const settings = await service.getSiteSettings(auth);

      assert.equal(settings.displayPhone, "+90 531 855 38 27");
      assert.equal(settings.telHref, "tel:+905318553827");
      assert.match(settings.whatsappHref, /^https:\/\/wa\.me\/905318553827/);
    }
  });

  it("blocks unrelated roles even if they still have legacy cms.manage", async () => {
    const { service } = createSiteSettingsHarness();

    await assert.rejects(
      () => service.getSiteSettings(instructorAuth),
      (error: unknown) => {
        assert.ok(error instanceof ForbiddenException);
        assert.equal(error.message, "Web sitesi yönetimi için yetkiniz bulunmuyor.");
        return true;
      }
    );
  });

  it("requires publish permission for publish actions", async () => {
    const { service } = createSiteSettingsHarness();

    await assert.rejects(
      () => service.saveSiteSettings(siteSettingsPayload(), manageOnlyAuth, "publish"),
      (error: unknown) => {
        assert.ok(error instanceof ForbiddenException);
        assert.equal(error.getStatus(), 403);
        return true;
      }
    );
  });
});

describe("AdminContentService site settings lifecycle", () => {
  it("rejects stale writes with a controlled 409", async () => {
    const { service } = createSiteSettingsHarness({ version: 7 });

    await assert.rejects(
      () => service.saveSiteSettings(siteSettingsPayload({ version: 2 }), branchAdminAuth, "draft"),
      (error: unknown) => {
        assert.ok(error instanceof ConflictException);
        assert.equal(error.getStatus(), 409);
        assert.equal(
          error.message,
          "Bu içerik başka bir kullanıcı tarafından güncellendi. Son sürümü yenileyerek değişikliklerinizi karşılaştırın."
        );
        return true;
      }
    );
  });

  it("saves drafts as revisions without publishing live site settings", async () => {
    const harness = createSiteSettingsHarness();

    const result = await harness.service.saveSiteSettings(siteSettingsPayload(), branchAdminAuth, "draft");

    assert.equal((result as { draftStatus?: string }).draftStatus, "DRAFT");
    assert.equal(result.displayPhone, "+90 531 855 38 27");
    assert.equal(harness.state.siteSettingUpserts.length, 0);
    assert.equal(harness.state.revisions.length, 1);
    assert.equal(harness.state.auditLogs.length, 1);
    assert.equal(harness.state.revisions[0].action, "website.site-settings.save-draft");
  });

  it("publishes normalized settings and returns targeted revalidation metadata", async () => {
    const harness = createSiteSettingsHarness();

    const result = await harness.service.saveSiteSettings(siteSettingsPayload(), superAdminAuth, "publish");

    assert.equal(result.displayPhone, "+90 531 855 38 27");
    assert.equal(result.canonicalPhone, "+905318553827");
    assert.equal(result.supportWhatsappNumber, "905318553827");
    assert.ok(result.revalidateRoutes.includes("/"));
    assert.ok(result.revalidateRoutes.includes("/ucretsiz-materyaller"));
    assert.deepEqual((result as { revalidateTags?: string[] }).revalidateTags, ["site-settings", "public-layout"]);
    assert.equal(harness.state.siteSettingUpserts.length, 1);
    assert.equal(harness.state.revisions[0].action, "website.site-settings.publish");
  });

  it("rejects invalid phone and WhatsApp formats", async () => {
    const { service } = createSiteSettingsHarness();

    await assertBadRequest(
      () => service.saveSiteSettings(siteSettingsPayload({ canonicalPhone: "05318553827" }), branchAdminAuth, "draft"),
      "Telefon numarasını +905318553827 E.164 formatında girmelisiniz."
    );
    await assertBadRequest(
      () => service.saveSiteSettings(siteSettingsPayload({ supportWhatsappNumber: "+905318553827" }), branchAdminAuth, "draft"),
      "WhatsApp numarası wa.me için yalnızca ülke kodu ve rakamlardan oluşmalıdır."
    );
  });
});

describe("AdminContentService free-material validation", () => {
  it("rejects incomplete free-material documents before saving", async () => {
    const { service } = createFreeMaterialsHarness();
    const payload = freeMaterialsPayload();
    delete (payload as { completeDocument?: boolean }).completeDocument;

    await assertBadRequest(
      () => service.saveFreeMaterialsDocument(payload, branchAdminAuth, "draft"),
      "Ücretsiz materyaller tamamen yüklenmeden kaydedilemez."
    );
  });

  it("allows incomplete downloadable material as a draft", async () => {
    const harness = createFreeMaterialsHarness();

    const result = await harness.service.saveFreeMaterialsDocument(freeMaterialsPayload(), branchAdminAuth, "draft");

    assert.equal((result as { draftStatus?: string }).draftStatus, "DRAFT");
    assert.equal(harness.state.revisions[0].action, "website.free-materials.save-draft");
  });

  it("blocks publishing downloadable material without a file or HTTPS URL", async () => {
    const { service } = createFreeMaterialsHarness();

    await assertBadRequest(
      () => service.saveFreeMaterialsDocument(freeMaterialsPayload(), branchAdminAuth, "publish"),
      "Bu materyali yayınlamak için indirilebilir bir dosya eklemelisiniz."
    );
  });

  it("blocks publishing PDF material without a real file even when href points at a countdown route", async () => {
    const { service } = createFreeMaterialsHarness();

    await assertBadRequest(
      () =>
        service.saveFreeMaterialsDocument(
          freeMaterialsPayload({
            itemType: FreeMaterialItemType.PDF,
            href: "/ucretsiz-materyaller/ayt-kac-gun-kaldi",
            downloadUrl: undefined,
            mediaAssetId: undefined
          }),
          branchAdminAuth,
          "publish"
        ),
      "Bu materyali yayınlamak için indirilebilir bir dosya eklemelisiniz."
    );
  });

  it("blocks publishing countdown material without a valid countdown page", async () => {
    const { service } = createFreeMaterialsHarness();

    await assertBadRequest(
      () =>
        service.saveFreeMaterialsDocument(
          freeMaterialsPayload({
            itemType: FreeMaterialItemType.COUNTDOWN,
            href: undefined,
            countdownPageSlug: undefined,
            downloadUrl: undefined,
            mediaAssetId: undefined
          }),
          branchAdminAuth,
          "publish"
        ),
      "Bu materyali yayınlamak için geçerli bir geri sayım sayfası seçmelisiniz."
    );
  });
  it("rejects unsafe free-material external URLs while keeping draft validation strict", async () => {
    const { service } = createFreeMaterialsHarness();
    const payload = freeMaterialsPayload({
      itemType: FreeMaterialItemType.EXTERNAL_LINK,
      href: "http://example.com/rejected",
      downloadUrl: undefined
    });

    await assertBadRequest(
      () => service.saveFreeMaterialsDocument(payload, branchAdminAuth, "draft"),
      "Bağlantı yalnızca site içi rota veya güvenli HTTPS adresi olabilir."
    );
  });

  it("blocks permanent category delete while cards remain", async () => {
    const service = new AdminContentService({
      $transaction: async <T>(callback: (client: unknown) => Promise<T>) =>
        callback({
          freeMaterialCategory: {
            findUnique: async () => freeMaterialCategoryRecord()
          }
        })
    } as never);

    await assertBadRequest(
      () => service.deleteMaterialCategory("pdf-documents", branchAdminAuth),
      "Bu kategoriye bağlı materyal kartları bulunuyor. Önce kartları taşıyın, arşivleyin veya silin."
    );
  });

  it("keeps system-tool cards from permanent delete", async () => {
    const service = new AdminContentService({
      $transaction: async <T>(callback: (client: unknown) => Promise<T>) =>
        callback({
          freeMaterialItem: {
            findFirst: async () => freeMaterialItemRecord({ itemType: FreeMaterialItemType.TOOL })
          }
        })
    } as never);

    await assertBadRequest(
      () => service.deleteMaterialCard("tool_1", branchAdminAuth),
      "Sistem aracı kartları kalıcı olarak silinemez; arşivleyerek public görünürlüğünü kapatın."
    );
  });
});

describe("AdminContentService navigation validation", () => {
  it("blocks saving an active primary navigation with zero active top-level items", async () => {
    const service = new AdminContentService({
      navigationMenu: {
        findUnique: async () => null
      }
    } as never);

    await assertBadRequest(
      () => service.saveNavigationMenu("primary", navigationPayload({ items: [] }), branchAdminAuth, "publish"),
      "Ana menüde en az bir aktif öğe bulunmalıdır."
    );
    await assertBadRequest(
      () =>
        service.saveNavigationMenu(
          "primary",
          navigationPayload({
            items: [
              {
                itemKey: "about",
                label: "Hakkımızda",
                href: "/hakkimizda",
                isActive: false,
                children: []
              }
            ]
          }),
          branchAdminAuth,
          "draft"
        ),
      "Ana menüde en az bir aktif öğe bulunmalıdır."
    );
  });

  it("allows explicitly disabled empty navigation documents", async () => {
    const service = new AdminContentService({
      navigationMenu: {
        findUnique: async () => null
      },
      $transaction: async <T>(callback: (client: unknown) => Promise<T>) =>
        callback({
          websiteContentRevision: {
            create: async (args: unknown) => args
          },
          auditLog: {
            create: async (args: unknown) => args
          }
        })
    } as never);

    const result = await service.saveNavigationMenu(
      "primary",
      navigationPayload({ isActive: false, items: [] }),
      branchAdminAuth,
      "draft"
    );

    assert.equal(result.isActive, false);
    assert.equal((result as { draftStatus?: string }).draftStatus, "DRAFT");
  });
});

function createSiteSettingsHarness(overrides: Partial<ReturnType<typeof siteSettingRecord>> = {}) {
  const state = {
    siteSetting: siteSettingRecord(overrides),
    siteSettingUpserts: [] as Array<Record<string, unknown>>,
    revisions: [] as Array<Record<string, unknown>>,
    auditLogs: [] as Array<Record<string, unknown>>
  };
  const tx = {
    siteSetting: {
      upsert: async (args: { create: Record<string, unknown>; update: Record<string, unknown> }) => {
        state.siteSettingUpserts.push(args);
        const next = {
          ...state.siteSetting,
          ...args.update,
          version: state.siteSetting.version + 1,
          publishedAt: args.update.publishedAt as Date,
          lastPublishedByStaffUserId: args.update.lastPublishedByStaffUserId as string
        };
        state.siteSetting = next;
        return next;
      }
    },
    websiteContentRevision: {
      create: async (args: { data: Record<string, unknown> }) => {
        state.revisions.push(args.data);
        return args.data;
      }
    },
    auditLog: {
      create: async (args: { data: Record<string, unknown> }) => {
        state.auditLogs.push(args.data);
        return args.data;
      }
    }
  };
  const prisma = {
    siteSetting: {
      findUnique: async () => state.siteSetting
    },
    $transaction: async <T>(callback: (client: typeof tx) => Promise<T>) => callback(tx)
  };

  return {
    state,
    service: new AdminContentService(prisma as never)
  };
}

function navigationPayload(overrides: Partial<SaveNavigationMenuDto> = {}): SaveNavigationMenuDto {
  return {
    name: "Ana Menü",
    location: "PRIMARY" as SaveNavigationMenuDto["location"],
    isActive: true,
    items: [
      {
        itemKey: "packages",
        label: "Paketlerimiz",
        href: "/paketlerimiz",
        children: []
      }
    ],
    ...overrides
  };
}

function createFreeMaterialsHarness() {
  const state = {
    revisions: [] as Array<Record<string, unknown>>,
    auditLogs: [] as Array<Record<string, unknown>>
  };
  const tx = {
    websiteContentRevision: {
      create: async (args: { data: Record<string, unknown> }) => {
        state.revisions.push(args.data);
        return args.data;
      }
    },
    auditLog: {
      create: async (args: { data: Record<string, unknown> }) => {
        state.auditLogs.push(args.data);
        return args.data;
      }
    }
  };
  const prisma = {
    freeMaterialCategory: {
      findMany: async () => [],
      updateMany: async () => ({ count: 0 })
    },
    countdownPage: {
      findMany: async () => []
    },
    $transaction: async <T>(callback: (client: typeof tx) => Promise<T>) => callback(tx)
  };

  return {
    state,
    service: new AdminContentService(prisma as never)
  };
}

function siteSettingRecord(overrides: Partial<Record<string, unknown>> = {}) {
  const now = new Date("2026-08-28T09:00:00.000Z");

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
    whatsappMessage: "Merhaba",
    address: "Ankara",
    publicContactEmail: "bilgi@egitimgurmesi.com",
    footerBrandDescription: "Açıklama",
    footerQuickLinks: [
      { label: "Paketlerimiz", href: "/paketlerimiz" },
      { label: "Ücretsiz Materyaller", href: "/ucretsiz-materyaller" }
    ],
    footerContactTitle: "İletişim",
    socialLinks: [],
    copyrightText: "© Eğitim Gurmesi Akademi",
    footerNotice: "Not",
    defaultSeoTitle: "SEO",
    defaultSeoDescription: "SEO açıklaması",
    version: 3,
    publishedAt: now,
    lastPublishedByStaffUserId: "staff_super",
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

function siteSettingsPayload(overrides: Partial<SaveSiteSettingsDto> = {}): SaveSiteSettingsDto {
  return {
    version: 3,
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
    whatsappMessage: "Merhaba",
    address: "Ankara",
    publicContactEmail: "bilgi@egitimgurmesi.com",
    footerBrandDescription: "Açıklama",
    footerQuickLinks: [
      { label: "Paketlerimiz", href: "/paketlerimiz" },
      { label: "Ücretsiz Materyaller", href: "/ucretsiz-materyaller" }
    ],
    footerContactTitle: "İletişim",
    socialLinks: [],
    copyrightText: "© Eğitim Gurmesi Akademi",
    footerNotice: "Not",
    defaultSeoTitle: "SEO",
    defaultSeoDescription: "SEO açıklaması",
    ...overrides
  };
}

function freeMaterialsPayload(
  overrides: Partial<SaveFreeMaterialsDocumentDto["categories"][number]["items"][number]> = {}
): SaveFreeMaterialsDocumentDto {
  return {
    version: 1,
    completeDocument: true,
    categories: [
      {
        key: "pdf-documents",
        label: "PDF Dokümanlar",
        description: "Çalışma dokümanları",
        sortOrder: 10,
        publishStatus: ContentStatus.PUBLISHED,
        items: [
          {
            slug: "tyt-plan",
            title: "TYT Plan",
            itemType: FreeMaterialItemType.DOWNLOAD,
            badgeLabel: "PDF",
            summary: "Haftalık plan",
            href: undefined,
            buttonLabel: "İndir",
            iconKey: "pdf",
            tone: "blue",
            downloadUrl: undefined,
            mediaAssetId: undefined,
            displayFilename: "tyt-plan.pdf",
            mimeType: "application/pdf",
            fileSizeBytes: 2048,
            accessibilityLabel: "TYT Plan dosyasını indir",
            opensInNewTab: false,
            sortOrder: 10,
            isFeatured: false,
            publishStatus: ContentStatus.PUBLISHED,
            ...overrides
          }
        ]
      }
    ],
    countdownPages: []
  };
}

function freeMaterialCategoryRecord() {
  const now = new Date("2026-09-02T09:00:00.000Z");
  return {
    id: "cat_1",
    key: "pdf-documents",
    label: "PDF Dokümanlar",
    description: "Dokümanlar",
    sortOrder: 10,
    publishStatus: ContentStatus.PUBLISHED,
    version: 1,
    createdAt: now,
    updatedAt: now,
    items: [freeMaterialItemRecord()]
  };
}

function freeMaterialItemRecord(overrides: Partial<Record<string, unknown>> = {}) {
  const now = new Date("2026-09-02T09:00:00.000Z");
  return {
    id: "item_1",
    categoryId: "cat_1",
    slug: "tyt-plan",
    title: "TYT Plan",
    itemType: FreeMaterialItemType.PDF,
    badgeLabel: "PDF",
    summary: "Plan",
    href: "/ucretsiz-materyaller/tyt-kac-gun-kaldi",
    buttonLabel: "Aç",
    iconKey: "pdf",
    tone: "blue",
    coverImageUrl: null,
    downloadUrl: null,
    mediaAssetId: null,
    displayFilename: null,
    mimeType: null,
    fileSizeBytes: null,
    accessibilityLabel: null,
    opensInNewTab: false,
    sortOrder: 10,
    isFeatured: false,
    publishStatus: ContentStatus.PUBLISHED,
    version: 1,
    countdownPageId: null,
    createdAt: now,
    updatedAt: now,
    category: {
      id: "cat_1",
      key: "pdf-documents",
      label: "PDF Dokümanlar",
      description: "Dokümanlar",
      sortOrder: 10,
      publishStatus: ContentStatus.PUBLISHED,
      version: 1,
      createdAt: now,
      updatedAt: now
    },
    countdownPage: null,
    ...overrides
  };
}

async function assertBadRequest(call: () => Promise<unknown>, message: string) {
  await assert.rejects(call, (error: unknown) => {
    assert.ok(error instanceof BadRequestException);
    assert.equal(error.getStatus(), 400);
    assert.equal(error.message, message);
    return true;
  });
}

const baseAuth = {
  actorId: "staff_1",
  email: "staff@example.com",
  actorType: AuthActorType.STAFF,
  sessionFamily: "session",
  organizationId: null,
  primaryBranchId: null,
  branchIds: [],
  branchRoles: []
} satisfies Omit<AuthenticatedRequestContext, "roleKeys" | "permissionKeys" | "isSuperAdmin">;

const superAdminAuth: AuthenticatedRequestContext = {
  ...baseAuth,
  actorId: "staff_super",
  roleKeys: [ROLE_KEYS.superAdmin],
  permissionKeys: [],
  isSuperAdmin: true
};

const branchAdminAuth: AuthenticatedRequestContext = {
  ...baseAuth,
  actorId: "staff_branch",
  roleKeys: [ROLE_KEYS.branchAdmin],
  permissionKeys: [PERMISSION_KEYS.websiteRead, PERMISSION_KEYS.websiteManage, PERMISSION_KEYS.websitePublish],
  isSuperAdmin: false
};

const manageOnlyAuth: AuthenticatedRequestContext = {
  ...baseAuth,
  actorId: "staff_manage",
  roleKeys: [ROLE_KEYS.branchAdmin],
  permissionKeys: [PERMISSION_KEYS.websiteRead, PERMISSION_KEYS.websiteManage],
  isSuperAdmin: false
};

const instructorAuth: AuthenticatedRequestContext = {
  ...baseAuth,
  actorId: "staff_instructor",
  roleKeys: [ROLE_KEYS.instructor],
  permissionKeys: [PERMISSION_KEYS.cmsManage],
  isSuperAdmin: false
};
