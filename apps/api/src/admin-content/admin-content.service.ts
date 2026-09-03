import { createHmac, randomUUID } from "node:crypto";
import { AuditActorType, ContentStatus, FreeMaterialItemType, PERMISSION_KEYS, Prisma } from "@ega/db";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { appEnv } from "../config/env";
import { PrismaService } from "../database/prisma.service";
import {
  isDownloadMaterialType,
  resolveFreeMaterialDestination,
  type MaterialDestinationItem
} from "../free-materials/material-destination";
import type { AuthenticatedRequestContext } from "../auth/auth.types";
import {
  SaveCountdownPageDto,
  SaveFreeMaterialItemDto,
  SaveFreeMaterialsDocumentDto,
  SaveMarketingPageDto,
  SaveNavigationMenuDto,
  SaveNavigationMenuItemDto,
  SaveSiteSettingsDto,
  SaveStaffProfilesDocumentDto,
  SaveSuccessStoriesDocumentDto
} from "./dto/admin-content.dto";

const WEBSITE_FORBIDDEN_MESSAGE = "Web sitesi yönetimi için yetkiniz bulunmuyor.";
const STALE_CONTENT_MESSAGE =
  "Bu içerik başka bir kullanıcı tarafından güncellendi. Son sürümü yenileyerek değişikliklerinizi karşılaştırın.";
const PHONE_FORMAT_MESSAGE = "Telefon numarasını +905318553827 E.164 formatında girmelisiniz.";
const WHATSAPP_FORMAT_MESSAGE =
  "WhatsApp numarası wa.me için yalnızca ülke kodu ve rakamlardan oluşmalıdır.";
const DOWNLOAD_URL_MESSAGE = "İndirilebilir materyal bağlantısı güvenli bir HTTPS adresi olmalıdır.";
const UNSAFE_URL_MESSAGE = "Bağlantı yalnızca site içi rota veya güvenli HTTPS adresi olabilir.";
const EMPTY_ACTIVE_NAVIGATION_MESSAGE = "Ana menüde en az bir aktif öğe bulunmalıdır.";
const INCOMPLETE_FREE_MATERIALS_DOCUMENT_MESSAGE =
  "Ücretsiz materyaller tamamen yüklenmeden kaydedilemez.";
const CATEGORY_DELETE_BLOCKED_MESSAGE =
  "Bu kategoriye bağlı materyal kartları bulunuyor. Önce kartları taşıyın, arşivleyin veya silin.";
const PROTECTED_FREE_MATERIAL_ITEM_TYPES = new Set<FreeMaterialItemType>([
  FreeMaterialItemType.COUNTDOWN,
  FreeMaterialItemType.CALCULATOR,
  FreeMaterialItemType.SIMULATION,
  FreeMaterialItemType.SYSTEM_TOOL,
  FreeMaterialItemType.TOOL
]);
const PUBLIC_LAYOUT_REVALIDATION_ROUTES = [
  "/",
  "/paketlerimiz",
  "/hakkimizda",
  "/akademik-kadro",
  "/basarilarimiz",
  "/ucretsiz-materyaller",
  "/ucretsiz-materyaller/pdf-dokumanlar",
  "/giris",
  "/yuz-yuze-kocluk"
] as const;
const REQUIRED_QUICK_LINKS = [
  { label: "Paketlerimiz", href: "/paketlerimiz" },
  { label: "Ücretsiz Materyaller", href: "/ucretsiz-materyaller" },
  { label: "Hakkımızda", href: "/hakkimizda" },
  { label: "Öğrenci Girişi", href: "/giris" }
] as const;

const defaultSiteSettings = {
  id: "",
  key: "default",
  siteName: "Eğitim Gurmesi Akademi",
  siteTitle: "EĞİTİM GURMESİ AKADEMİ",
  tagline: "Video paketleri, koçluk akışı ve öğrenci paneli",
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
  whatsappMessage: "Merhaba, Eğitim Gurmesi Akademi hakkında bilgi almak istiyorum.",
  address: "Alacaatlı Mah. 4834. Sok. No: 10/8-59 Çankaya/Ankara",
  publicContactEmail: "bilgi@egitimgurmesi.com",
  footerBrandDescription:
    "Eğitim Gurmesi Akademi; kayıtlı video paketlerini, koçluk yönlendirme mantığını ve öğrenci hesap disiplinini tek çatı altında birleştiren yeni nesil bir eğitim satış platformu olarak kurgulanıyor.",
  footerQuickLinks: REQUIRED_QUICK_LINKS,
  footerContactTitle: "İletişim",
  socialLinks: [] as Array<{ label: string; href: string }>,
  copyrightText: "© Eğitim Gurmesi Akademi. Tüm hakları saklıdır.",
  footerNotice: "Eğitim Gurmesi Akademi iletişim ve marka bilgileri.",
  defaultSeoTitle: "Eğitim Gurmesi Akademi",
  defaultSeoDescription: "Video paketleri, koçluk programları ve ücretsiz öğrenci kaynakları.",
  version: 1,
  publishedAt: null as string | null,
  lastPublishedByStaffUserId: null as string | null,
  updatedAt: null as string | null
};

const navigationInclude = {
  items: {
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  }
} satisfies Prisma.NavigationMenuInclude;

const marketingPagesInclude = {
  sections: {
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  }
} satisfies Prisma.MarketingPageInclude;

const staffGroupsInclude = {
  profiles: {
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  }
} satisfies Prisma.StaffProfileGroupInclude;

const freeMaterialCategoriesInclude = {
  items: {
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      countdownPage: {
        select: {
          slug: true,
          title: true,
          updatedLabel: true
        }
      }
    }
  }
} satisfies Prisma.FreeMaterialCategoryInclude;

const freeMaterialItemMutationInclude = {
  category: true,
  countdownPage: {
    select: {
      slug: true,
      title: true,
      updatedLabel: true
    }
  }
} satisfies Prisma.FreeMaterialItemInclude;

const countdownPagesInclude = {
  targets: {
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  },
  officialLinks: {
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  },
  articleSections: {
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  }
} satisfies Prisma.CountdownPageInclude;

type WebsiteSaveAction = "draft" | "publish";
type TransactionClient = Prisma.TransactionClient;

type NavigationMenuWithItems = Prisma.NavigationMenuGetPayload<{
  include: typeof navigationInclude;
}>;

type MarketingPageWithSections = Prisma.MarketingPageGetPayload<{
  include: typeof marketingPagesInclude;
}>;

type StaffGroupWithProfiles = Prisma.StaffProfileGroupGetPayload<{
  include: typeof staffGroupsInclude;
}>;

type FreeMaterialCategoryWithItems = Prisma.FreeMaterialCategoryGetPayload<{
  include: typeof freeMaterialCategoriesInclude;
}>;

type CountdownPageWithChildren = Prisma.CountdownPageGetPayload<{
  include: typeof countdownPagesInclude;
}>;

type SiteSettingRecord = Prisma.SiteSettingGetPayload<object>;
type WebsiteRevisionRecord = Prisma.WebsiteContentRevisionGetPayload<object>;

@Injectable()
export class AdminContentService {
  constructor(private readonly prisma: PrismaService) {}

  async getSiteSettings(auth: AuthenticatedRequestContext) {
    requireWebsiteRead(auth);

    const settings = await this.prisma.siteSetting.findUnique({
      where: { key: "default" }
    });

    return normalizeSiteSettings(settings);
  }

  async saveSiteSettings(
    payload: SaveSiteSettingsDto,
    auth: AuthenticatedRequestContext,
    action: WebsiteSaveAction
  ) {
    requireWebsiteAction(auth, action);

    const normalizedPayload = normalizeSiteSettingsPayload(payload);
    const before = await this.prisma.siteSetting.findUnique({
      where: { key: "default" }
    });
    assertCurrentVersion(payload.version, before?.version);

    if (action === "draft") {
      const draft = normalizeSiteSettingsDraft(before, normalizedPayload);
      await this.prisma.$transaction(async (tx) => {
        await recordWebsiteRevision(tx, auth, {
          entityType: "SiteSetting",
          entityKey: "default",
          action: "website.site-settings.save-draft",
          version: draft.version,
          summary: "Global web sitesi ayarları taslak olarak kaydedildi.",
          beforeData: before ? normalizeSiteSettings(before) : null,
          afterData: draft
        });
        await recordAuditLog(tx, auth, {
          action: "website.site-settings.save-draft",
          entityType: "SiteSetting",
          entityId: before?.id ?? "default",
          summary: "Global web sitesi ayarları taslak olarak kaydedildi.",
          beforeData: before ? normalizeSiteSettings(before) : null,
          afterData: draft
        });
      });

      return {
        ...draft,
        draftStatus: "DRAFT",
        revalidateRoutes: [] as string[]
      };
    }

    const saved = await this.prisma.$transaction(async (tx) => {
      const record = await tx.siteSetting.upsert({
        where: { key: "default" },
        update: {
          ...normalizedPayload,
          footerQuickLinks: normalizedPayload.footerQuickLinks as Prisma.InputJsonValue,
          socialLinks: normalizedPayload.socialLinks as Prisma.InputJsonValue,
          version: {
            increment: 1
          },
          publishedAt: new Date(),
          lastPublishedByStaffUserId: auth.actorId
        },
        create: {
          key: "default",
          ...normalizedPayload,
          footerQuickLinks: normalizedPayload.footerQuickLinks as Prisma.InputJsonValue,
          socialLinks: normalizedPayload.socialLinks as Prisma.InputJsonValue,
          version: 1,
          publishedAt: new Date(),
          lastPublishedByStaffUserId: auth.actorId
        }
      });

      const normalized = normalizeSiteSettings(record);
      await recordWebsiteRevision(tx, auth, {
        entityType: "SiteSetting",
        entityKey: "default",
        action: "website.site-settings.publish",
        version: record.version,
        summary: "Global web sitesi ayarları yayınlandı.",
        beforeData: before ? normalizeSiteSettings(before) : null,
        afterData: normalized
      });
      await recordAuditLog(tx, auth, {
        action: "website.site-settings.publish",
        entityType: "SiteSetting",
        entityId: record.id,
        summary: "Global web sitesi ayarları yayınlandı.",
        beforeData: before ? normalizeSiteSettings(before) : null,
        afterData: normalized,
        metadata: revalidationMetadata([...PUBLIC_LAYOUT_REVALIDATION_ROUTES], ["site-settings", "public-layout"])
      });

      return record;
    });

    return {
      ...normalizeSiteSettings(saved),
      revalidateRoutes: [...PUBLIC_LAYOUT_REVALIDATION_ROUTES],
      revalidateTags: ["site-settings", "public-layout"]
    };
  }

  async listRevisions(
    auth: AuthenticatedRequestContext,
    filters: { entityType?: string; entityKey?: string }
  ) {
    requireWebsiteRead(auth);

    const revisions = await this.prisma.websiteContentRevision.findMany({
      where: {
        scope: "global-website",
        entityType: filters.entityType || undefined,
        entityKey: filters.entityKey || undefined
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 50
    });

    return revisions.map(normalizeRevision);
  }

  async restoreRevision(revisionId: string, auth: AuthenticatedRequestContext) {
    requireWebsitePublish(auth);

    const revision = await this.prisma.websiteContentRevision.findUnique({
      where: { id: revisionId }
    });

    if (!revision) {
      throw new NotFoundException("Revizyon bulunamadı.");
    }

    const data = asRecord(revision.afterData);

    if (revision.entityType === "SiteSetting") {
      return this.saveSiteSettings(data as unknown as SaveSiteSettingsDto, auth, "publish");
    }

    if (revision.entityType === "NavigationMenu") {
      return this.saveNavigationMenu(
        revision.entityKey,
        data as unknown as SaveNavigationMenuDto,
        auth,
        "publish"
      );
    }

    if (revision.entityType === "MarketingPage") {
      return this.saveMarketingPage(
        revision.entityKey,
        data as unknown as SaveMarketingPageDto,
        auth,
        "publish"
      );
    }

    if (revision.entityType === "StaffProfilesDocument") {
      return this.saveStaffProfilesDocument(
        data as unknown as SaveStaffProfilesDocumentDto,
        auth,
        "publish"
      );
    }

    if (revision.entityType === "SuccessStoriesDocument") {
      return this.saveSuccessStoriesDocument(
        data as unknown as SaveSuccessStoriesDocumentDto,
        auth,
        "publish"
      );
    }

    if (revision.entityType === "FreeMaterialsDocument") {
      return this.saveFreeMaterialsDocument(
        { ...data, completeDocument: true } as unknown as SaveFreeMaterialsDocumentDto,
        auth,
        "publish"
      );
    }

    if (revision.entityType === "FreeMaterialItem") {
      return this.restoreMaterialCardFromRevision(data, auth);
    }

    throw new BadRequestException("Bu revizyon otomatik geri yükleme için desteklenmiyor.");
  }

  createPreviewToken(auth: AuthenticatedRequestContext) {
    requireWebsiteRead(auth);

    const expiresAt = Math.floor(Date.now() / 1000) + 15 * 60;
    const body = Buffer.from(
      JSON.stringify({
        actorId: auth.actorId,
        scope: "global-website-preview",
        exp: expiresAt,
        nonce: randomUUID()
      })
    ).toString("base64url");
    const signature = createHmac("sha256", appEnv.authSecret()).update(body).digest("base64url");

    return {
      token: `${body}.${signature}`,
      expiresAt
    };
  }

  async getNavigationMenu(key: string, auth: AuthenticatedRequestContext) {
    requireWebsiteRead(auth);

    const menu = await this.prisma.navigationMenu.findUnique({
      where: { key },
      include: navigationInclude
    });

    if (!menu) {
      return createEmptyNavigationMenu(key);
    }

    return normalizeNavigationMenu(menu);
  }

  async saveNavigationMenu(
    key: string,
    payload: SaveNavigationMenuDto,
    auth: AuthenticatedRequestContext,
    action: WebsiteSaveAction = "draft"
  ) {
    requireWebsiteAction(auth, action);

    const before = await this.prisma.navigationMenu.findUnique({
      where: { key },
      include: navigationInclude
    });
    assertCurrentVersion(payload.version, before?.version);
    assertNavigationMenuCanBeSaved(payload);

    const draft = normalizeNavigationMenuPayload(key, payload, before);

    if (action === "draft") {
      await this.prisma.$transaction(async (tx) => {
        await recordWebsiteRevision(tx, auth, {
          entityType: "NavigationMenu",
          entityKey: key,
          action: "website.navigation.save-draft",
          version: draft.version,
          summary: `${key} menüsü taslak olarak kaydedildi.`,
          beforeData: before ? normalizeNavigationMenu(before) : null,
          afterData: draft
        });
        await recordAuditLog(tx, auth, {
          action: "website.navigation.save-draft",
          entityType: "NavigationMenu",
          entityId: before?.id ?? key,
          summary: `${key} menüsü taslak olarak kaydedildi.`,
          beforeData: before ? normalizeNavigationMenu(before) : null,
          afterData: draft
        });
      });

      return {
        ...draft,
        draftStatus: "DRAFT"
      };
    }

    const menu = await this.prisma.$transaction(async (tx) => {
      const record = await tx.navigationMenu.upsert({
        where: { key },
        update: {
          name: sanitizePlainText(payload.name),
          location: payload.location,
          description: sanitizeNullableText(payload.description),
          isActive: payload.isActive ?? true,
          version: {
            increment: 1
          }
        },
        create: {
          key,
          name: sanitizePlainText(payload.name),
          location: payload.location,
          description: sanitizeNullableText(payload.description),
          isActive: payload.isActive ?? true
        }
      });

      const activeKeys: string[] = [];
      await upsertNavigationItems(tx, record.id, payload.items, null, activeKeys);
      await tx.navigationMenuItem.updateMany({
        where: {
          menuId: record.id,
          itemKey: {
            notIn: activeKeys.length > 0 ? activeKeys : ["__none__"]
          }
        },
        data: {
          isActive: false
        }
      });

      const saved = await tx.navigationMenu.findUnique({
        where: { id: record.id },
        include: navigationInclude
      });

      if (!saved) {
        throw new NotFoundException("Kaydedilen menü yeniden yüklenemedi.");
      }

      const normalized = normalizeNavigationMenu(saved);
      await recordWebsiteRevision(tx, auth, {
        entityType: "NavigationMenu",
        entityKey: key,
        action: "website.navigation.publish",
        version: saved.version,
        summary: `${key} menüsü yayınlandı.`,
        beforeData: before ? normalizeNavigationMenu(before) : null,
        afterData: normalized
      });
      await recordAuditLog(tx, auth, {
        action: "website.navigation.publish",
        entityType: "NavigationMenu",
        entityId: record.id,
        summary: `${key} menüsü yayınlandı.`,
        beforeData: before ? normalizeNavigationMenu(before) : null,
        afterData: normalized,
        metadata: revalidationMetadata(["/"], ["navigation", "public-layout"])
      });

      return saved;
    });

    return {
      ...normalizeNavigationMenu(menu),
      revalidateRoutes: ["/"],
      revalidateTags: ["navigation", "public-layout"]
    };
  }

  async listMarketingPages(auth: AuthenticatedRequestContext) {
    requireWebsiteRead(auth);

    const pages = await this.prisma.marketingPage.findMany({
      include: marketingPagesInclude,
      orderBy: [{ pageType: "asc" }, { createdAt: "asc" }]
    });

    return pages.map(normalizeMarketingPage);
  }

  async saveMarketingPage(
    key: string,
    payload: SaveMarketingPageDto,
    auth: AuthenticatedRequestContext,
    action: WebsiteSaveAction = "draft"
  ) {
    requireWebsiteAction(auth, action);

    const before = await this.prisma.marketingPage.findUnique({
      where: { key },
      include: marketingPagesInclude
    });
    assertCurrentVersion(payload.version, before?.version);

    const draft = normalizeMarketingPagePayload(key, payload, before);

    if (action === "draft") {
      await this.prisma.$transaction(async (tx) => {
        await recordWebsiteRevision(tx, auth, {
          entityType: "MarketingPage",
          entityKey: key,
          action: "website.marketing-page.save-draft",
          version: draft.version,
          summary: `${key} sayfası taslak olarak kaydedildi.`,
          beforeData: before ? normalizeMarketingPage(before) : null,
          afterData: draft
        });
        await recordAuditLog(tx, auth, {
          action: "website.marketing-page.save-draft",
          entityType: "MarketingPage",
          entityId: before?.id ?? key,
          summary: `${key} sayfası taslak olarak kaydedildi.`,
          beforeData: before ? normalizeMarketingPage(before) : null,
          afterData: draft
        });
      });

      return {
        ...draft,
        draftStatus: "DRAFT"
      };
    }

    const page = await this.prisma.$transaction(async (tx) => {
      const record = await tx.marketingPage.upsert({
        where: { key },
        update: {
          slug: sanitizeSlug(payload.slug),
          title: sanitizePlainText(payload.title),
          excerpt: sanitizeNullableText(payload.excerpt),
          description: sanitizeNullableText(payload.description),
          pageType: payload.pageType,
          publishStatus: payload.publishStatus ?? ContentStatus.PUBLISHED,
          seoTitle: sanitizeNullableText(payload.seoTitle),
          seoDescription: sanitizeNullableText(payload.seoDescription),
          heroImageUrl: normalizeOptionalContentUrl(payload.heroImageUrl),
          metadata: toNullableJsonInput(payload.metadata),
          version: {
            increment: 1
          }
        },
        create: {
          key,
          slug: sanitizeSlug(payload.slug),
          title: sanitizePlainText(payload.title),
          excerpt: sanitizeNullableText(payload.excerpt),
          description: sanitizeNullableText(payload.description),
          pageType: payload.pageType,
          publishStatus: payload.publishStatus ?? ContentStatus.PUBLISHED,
          seoTitle: sanitizeNullableText(payload.seoTitle),
          seoDescription: sanitizeNullableText(payload.seoDescription),
          heroImageUrl: normalizeOptionalContentUrl(payload.heroImageUrl),
          metadata: toNullableJsonInput(payload.metadata)
        }
      });

      const activeSectionKeys: string[] = [];
      for (let index = 0; index < payload.sections.length; index += 1) {
        const section = payload.sections[index];
        const sectionKey = sanitizeSlug(section.sectionKey);
        activeSectionKeys.push(sectionKey);
        await tx.marketingPageSection.upsert({
          where: {
            pageId_sectionKey: {
              pageId: record.id,
              sectionKey
            }
          },
          update: {
            eyebrow: sanitizeNullableText(section.eyebrow),
            title: sanitizeNullableText(section.title),
            body: sanitizeNullableText(section.body),
            variantKey: sanitizeNullableText(section.variantKey),
            payload: toNullableJsonInput(section.payload),
            sortOrder: section.sortOrder ?? (index + 1) * 10,
            isActive: section.isActive ?? true,
            publishStatus: section.publishStatus ?? ContentStatus.PUBLISHED
          },
          create: {
            pageId: record.id,
            sectionKey,
            eyebrow: sanitizeNullableText(section.eyebrow),
            title: sanitizeNullableText(section.title),
            body: sanitizeNullableText(section.body),
            variantKey: sanitizeNullableText(section.variantKey),
            payload: toNullableJsonInput(section.payload),
            sortOrder: section.sortOrder ?? (index + 1) * 10,
            isActive: section.isActive ?? true,
            publishStatus: section.publishStatus ?? ContentStatus.PUBLISHED
          }
        });
      }

      await tx.marketingPageSection.updateMany({
        where: {
          pageId: record.id,
          sectionKey: {
            notIn: activeSectionKeys.length > 0 ? activeSectionKeys : ["__none__"]
          }
        },
        data: {
          isActive: false,
          publishStatus: ContentStatus.ARCHIVED
        }
      });

      const saved = await tx.marketingPage.findUnique({
        where: { id: record.id },
        include: marketingPagesInclude
      });

      if (!saved) {
        throw new NotFoundException("Kaydedilen sayfa yeniden yüklenemedi.");
      }

      const normalized = normalizeMarketingPage(saved);
      const route = `/${saved.slug === "home" ? "" : saved.slug}`;
      await recordWebsiteRevision(tx, auth, {
        entityType: "MarketingPage",
        entityKey: key,
        action: "website.marketing-page.publish",
        version: saved.version,
        summary: `${key} sayfası yayınlandı.`,
        beforeData: before ? normalizeMarketingPage(before) : null,
        afterData: normalized
      });
      await recordAuditLog(tx, auth, {
        action: "website.marketing-page.publish",
        entityType: "MarketingPage",
        entityId: record.id,
        summary: `${key} sayfası yayınlandı.`,
        beforeData: before ? normalizeMarketingPage(before) : null,
        afterData: normalized,
        metadata: revalidationMetadata([route], ["marketing-page"])
      });

      return saved;
    });

    return {
      ...normalizeMarketingPage(page),
      revalidateRoutes: [`/${page.slug === "home" ? "" : page.slug}`],
      revalidateTags: ["marketing-page"]
    };
  }

  async getStaffProfilesDocument(auth: AuthenticatedRequestContext) {
    requireWebsiteRead(auth);

    const groups = await this.prisma.staffProfileGroup.findMany({
      include: staffGroupsInclude,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    });

    return normalizeStaffProfilesDocument(groups);
  }

  async saveStaffProfilesDocument(
    payload: SaveStaffProfilesDocumentDto,
    auth: AuthenticatedRequestContext,
    action: WebsiteSaveAction = "draft"
  ) {
    requireWebsiteAction(auth, action);

    const beforeGroups = await this.prisma.staffProfileGroup.findMany({
      include: staffGroupsInclude,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    });
    const before = normalizeStaffProfilesDocument(beforeGroups);
    assertCurrentVersion(payload.version, before.version);
    const draft = normalizeStaffProfilesPayload(payload, before.version);

    if (action === "draft") {
      await this.prisma.$transaction(async (tx) => {
        await recordWebsiteRevision(tx, auth, {
          entityType: "StaffProfilesDocument",
          entityKey: "academic-staff",
          action: "website.staff-profiles.save-draft",
          version: draft.version,
          summary: "Akademik kadro taslak olarak kaydedildi.",
          beforeData: before,
          afterData: draft
        });
        await recordAuditLog(tx, auth, {
          action: "website.staff-profiles.save-draft",
          entityType: "StaffProfileGroup",
          entityId: "all",
          summary: "Akademik kadro taslak olarak kaydedildi.",
          beforeData: before,
          afterData: draft
        });
      });

      return {
        ...draft,
        draftStatus: "DRAFT"
      };
    }

    const groups = await this.prisma.$transaction(async (tx) => {
      const activeGroupKeys: string[] = [];
      const activeProfileSlugs: string[] = [];

      for (let groupIndex = 0; groupIndex < payload.groups.length; groupIndex += 1) {
        const group = payload.groups[groupIndex];
        const groupKey = sanitizeSlug(group.key);
        activeGroupKeys.push(groupKey);
        const groupRecord = await tx.staffProfileGroup.upsert({
          where: { key: groupKey },
          update: {
            label: sanitizePlainText(group.label),
            eyebrow: sanitizeNullableText(group.eyebrow),
            description: sanitizeNullableText(group.description),
            introVideoSourceType: group.introVideoSourceType ?? null,
            introVideoUrl: normalizeOptionalContentUrl(group.introVideoUrl),
            introVideoPosterUrl: normalizeOptionalContentUrl(group.introVideoPosterUrl),
            introVideoTitle: sanitizeNullableText(group.introVideoTitle),
            sortOrder: group.sortOrder ?? (groupIndex + 1) * 10,
            publishStatus: group.publishStatus ?? ContentStatus.PUBLISHED,
            version: {
              increment: 1
            }
          },
          create: {
            key: groupKey,
            label: sanitizePlainText(group.label),
            eyebrow: sanitizeNullableText(group.eyebrow),
            description: sanitizeNullableText(group.description),
            introVideoSourceType: group.introVideoSourceType ?? null,
            introVideoUrl: normalizeOptionalContentUrl(group.introVideoUrl),
            introVideoPosterUrl: normalizeOptionalContentUrl(group.introVideoPosterUrl),
            introVideoTitle: sanitizeNullableText(group.introVideoTitle),
            sortOrder: group.sortOrder ?? (groupIndex + 1) * 10,
            publishStatus: group.publishStatus ?? ContentStatus.PUBLISHED
          }
        });

        for (let profileIndex = 0; profileIndex < group.profiles.length; profileIndex += 1) {
          const profile = group.profiles[profileIndex];
          const profileSlug = sanitizeSlug(profile.slug);
          activeProfileSlugs.push(profileSlug);
          await tx.staffProfile.upsert({
            where: { slug: profileSlug },
            update: {
              groupId: groupRecord.id,
              fullName: sanitizePlainText(profile.fullName),
              title: sanitizePlainText(profile.title),
              city: sanitizeNullableText(profile.city),
              biography: sanitizeNullableText(profile.biography),
              photoUrl: normalizeOptionalContentUrl(profile.photoUrl),
              sortOrder: profile.sortOrder ?? (profileIndex + 1) * 10,
              publishStatus: profile.publishStatus ?? ContentStatus.PUBLISHED
            },
            create: {
              groupId: groupRecord.id,
              slug: profileSlug,
              fullName: sanitizePlainText(profile.fullName),
              title: sanitizePlainText(profile.title),
              city: sanitizeNullableText(profile.city),
              biography: sanitizeNullableText(profile.biography),
              photoUrl: normalizeOptionalContentUrl(profile.photoUrl),
              sortOrder: profile.sortOrder ?? (profileIndex + 1) * 10,
              publishStatus: profile.publishStatus ?? ContentStatus.PUBLISHED
            }
          });
        }
      }

      await tx.staffProfileGroup.updateMany({
        where: {
          key: {
            notIn: activeGroupKeys.length > 0 ? activeGroupKeys : ["__none__"]
          }
        },
        data: {
          publishStatus: ContentStatus.ARCHIVED
        }
      });
      await tx.staffProfile.updateMany({
        where: {
          slug: {
            notIn: activeProfileSlugs.length > 0 ? activeProfileSlugs : ["__none__"]
          }
        },
        data: {
          publishStatus: ContentStatus.ARCHIVED
        }
      });

      const savedGroups = await tx.staffProfileGroup.findMany({
        include: staffGroupsInclude,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
      });
      const normalized = normalizeStaffProfilesDocument(savedGroups);
      await recordWebsiteRevision(tx, auth, {
        entityType: "StaffProfilesDocument",
        entityKey: "academic-staff",
        action: "website.staff-profiles.publish",
        version: normalized.version,
        summary: "Akademik kadro yayınlandı.",
        beforeData: before,
        afterData: normalized
      });
      await recordAuditLog(tx, auth, {
        action: "website.staff-profiles.publish",
        entityType: "StaffProfileGroup",
        entityId: "all",
        summary: "Akademik kadro yayınlandı.",
        beforeData: before,
        afterData: normalized,
        metadata: revalidationMetadata(["/akademik-kadro"], ["academic-staff"])
      });

      return savedGroups;
    });

    return {
      ...normalizeStaffProfilesDocument(groups),
      revalidateRoutes: ["/akademik-kadro"],
      revalidateTags: ["academic-staff"]
    };
  }

  async getSuccessStoriesDocument(auth: AuthenticatedRequestContext) {
    requireWebsiteRead(auth);

    const stories = await this.prisma.successStory.findMany({
      orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }]
    });

    return normalizeSuccessStoriesDocument(stories);
  }

  async saveSuccessStoriesDocument(
    payload: SaveSuccessStoriesDocumentDto,
    auth: AuthenticatedRequestContext,
    action: WebsiteSaveAction = "draft"
  ) {
    requireWebsiteAction(auth, action);

    const beforeStories = await this.prisma.successStory.findMany({
      orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }]
    });
    const before = normalizeSuccessStoriesDocument(beforeStories);
    assertCurrentVersion(payload.version, before.version);
    const draft = normalizeSuccessStoriesPayload(payload, before.version);

    if (action === "draft") {
      await this.prisma.$transaction(async (tx) => {
        await recordWebsiteRevision(tx, auth, {
          entityType: "SuccessStoriesDocument",
          entityKey: "success-stories",
          action: "website.success-stories.save-draft",
          version: draft.version,
          summary: "Başarı hikayeleri taslak olarak kaydedildi.",
          beforeData: before,
          afterData: draft
        });
        await recordAuditLog(tx, auth, {
          action: "website.success-stories.save-draft",
          entityType: "SuccessStory",
          entityId: "all",
          summary: "Başarı hikayeleri taslak olarak kaydedildi.",
          beforeData: before,
          afterData: draft
        });
      });

      return {
        ...draft,
        draftStatus: "DRAFT"
      };
    }

    const stories = await this.prisma.$transaction(async (tx) => {
      const activeSlugs: string[] = [];

      for (let index = 0; index < payload.stories.length; index += 1) {
        const story = payload.stories[index];
        const slug = sanitizeSlug(story.slug);
        activeSlugs.push(slug);
        await tx.successStory.upsert({
          where: { slug },
          update: {
            studentName: sanitizePlainText(story.studentName),
            city: sanitizeNullableText(story.city),
            examLabel: sanitizeNullableText(story.examLabel),
            resultTitle: sanitizePlainText(story.resultTitle),
            highlight: sanitizePlainText(story.highlight),
            story: sanitizeNullableText(story.story),
            avatarUrl: normalizeOptionalContentUrl(story.avatarUrl),
            isFeatured: story.isFeatured ?? false,
            sortOrder: story.sortOrder ?? (index + 1) * 10,
            publishStatus: story.publishStatus ?? ContentStatus.PUBLISHED,
            version: {
              increment: 1
            }
          },
          create: {
            slug,
            studentName: sanitizePlainText(story.studentName),
            city: sanitizeNullableText(story.city),
            examLabel: sanitizeNullableText(story.examLabel),
            resultTitle: sanitizePlainText(story.resultTitle),
            highlight: sanitizePlainText(story.highlight),
            story: sanitizeNullableText(story.story),
            avatarUrl: normalizeOptionalContentUrl(story.avatarUrl),
            isFeatured: story.isFeatured ?? false,
            sortOrder: story.sortOrder ?? (index + 1) * 10,
            publishStatus: story.publishStatus ?? ContentStatus.PUBLISHED
          }
        });
      }

      await tx.successStory.updateMany({
        where: {
          slug: {
            notIn: activeSlugs.length > 0 ? activeSlugs : ["__none__"]
          }
        },
        data: {
          publishStatus: ContentStatus.ARCHIVED
        }
      });

      const savedStories = await tx.successStory.findMany({
        orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }]
      });
      const normalized = normalizeSuccessStoriesDocument(savedStories);
      await recordWebsiteRevision(tx, auth, {
        entityType: "SuccessStoriesDocument",
        entityKey: "success-stories",
        action: "website.success-stories.publish",
        version: normalized.version,
        summary: "Başarı hikayeleri yayınlandı.",
        beforeData: before,
        afterData: normalized
      });
      await recordAuditLog(tx, auth, {
        action: "website.success-stories.publish",
        entityType: "SuccessStory",
        entityId: "all",
        summary: "Başarı hikayeleri yayınlandı.",
        beforeData: before,
        afterData: normalized,
        metadata: revalidationMetadata(["/basarilarimiz"], ["success-stories"])
      });

      return savedStories;
    });

    return {
      ...normalizeSuccessStoriesDocument(stories),
      revalidateRoutes: ["/basarilarimiz"],
      revalidateTags: ["success-stories"]
    };
  }

  async getFreeMaterialsDocument(auth: AuthenticatedRequestContext) {
    requireWebsiteRead(auth);

    const [categories, countdownPages] = await Promise.all([
      this.prisma.freeMaterialCategory.findMany({
        include: freeMaterialCategoriesInclude,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
      }),
      this.prisma.countdownPage.findMany({
        include: countdownPagesInclude,
        orderBy: [{ createdAt: "asc" }]
      })
    ]);

    return normalizeFreeMaterialsDocument(categories, countdownPages);
  }

  async saveFreeMaterialsDocument(
    payload: SaveFreeMaterialsDocumentDto,
    auth: AuthenticatedRequestContext,
    action: WebsiteSaveAction = "draft"
  ) {
    requireWebsiteAction(auth, action);

    if (!payload.completeDocument) {
      throw new BadRequestException(INCOMPLETE_FREE_MATERIALS_DOCUMENT_MESSAGE);
    }

    const [beforeCategories, beforeCountdownPages] = await Promise.all([
      this.prisma.freeMaterialCategory.findMany({
        include: freeMaterialCategoriesInclude,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
      }),
      this.prisma.countdownPage.findMany({
        include: countdownPagesInclude,
        orderBy: [{ createdAt: "asc" }]
      })
    ]);
    const before = normalizeFreeMaterialsDocument(beforeCategories, beforeCountdownPages);
    assertCurrentVersion(payload.version, before.version);
    const draft = normalizeFreeMaterialsPayload(payload, before.version, action === "publish");
    const payloadCountdownSlugs = new Set(payload.countdownPages.filter((page) => (page.publishStatus ?? ContentStatus.PUBLISHED) === ContentStatus.PUBLISHED).map((page) => sanitizeSlug(page.slug)));

    if (action === "draft") {
      await this.prisma.$transaction(async (tx) => {
        await recordWebsiteRevision(tx, auth, {
          entityType: "FreeMaterialsDocument",
          entityKey: "free-materials",
          action: "website.free-materials.save-draft",
          version: draft.version,
          summary: "Ücretsiz materyaller taslak olarak kaydedildi.",
          beforeData: before,
          afterData: draft
        });
        await recordAuditLog(tx, auth, {
          action: "website.free-materials.save-draft",
          entityType: "FreeMaterialCategory",
          entityId: "all",
          summary: "Ücretsiz materyaller taslak olarak kaydedildi.",
          beforeData: before,
          afterData: draft
        });
      });

      return {
        ...draft,
        draftStatus: "DRAFT"
      };
    }

    const document = await this.prisma.$transaction(async (tx) => {
      const countdownIdBySlug = new Map<string, string>();

      for (const countdownPage of payload.countdownPages) {
        const record = await upsertCountdownPage(tx, countdownPage);
        countdownIdBySlug.set(record.slug, record.id);
      }

      for (let categoryIndex = 0; categoryIndex < payload.categories.length; categoryIndex += 1) {
        const category = payload.categories[categoryIndex];
        const key = sanitizeSlug(category.key);
        const categoryData = {
          label: sanitizePlainText(category.label),
          description: sanitizeNullableText(category.description),
          sortOrder: category.sortOrder ?? (categoryIndex + 1) * 10,
          publishStatus: category.publishStatus ?? ContentStatus.PUBLISHED
        };
        const categoryRecord = category.id
          ? await tx.freeMaterialCategory.update({
              where: { id: category.id },
              data: {
                key,
                ...categoryData,
                version: {
                  increment: 1
                }
              }
            })
          : await tx.freeMaterialCategory.upsert({
              where: { key },
              update: {
                ...categoryData,
                version: {
                  increment: 1
                }
              },
              create: {
                key,
                ...categoryData
              }
            });

        for (let itemIndex = 0; itemIndex < category.items.length; itemIndex += 1) {
          const normalizedItem = normalizeFreeMaterialItemInput(
            category.items[itemIndex],
            key,
            itemIndex,
            {
              requirePublishReady: true,
              countdownSlugs: payloadCountdownSlugs
            }
          );
          const itemPayload = category.items[itemIndex];
          const itemData = {
              categoryId: categoryRecord.id,
              slug: normalizedItem.slug,
              title: normalizedItem.title,
              itemType: normalizedItem.itemType,
              badgeLabel: normalizedItem.badgeLabel,
              summary: normalizedItem.summary,
              href: normalizedItem.href,
              buttonLabel: normalizedItem.buttonLabel,
              iconKey: normalizedItem.iconKey,
              tone: normalizedItem.tone,
              coverImageUrl: normalizedItem.coverImageUrl,
              downloadUrl: normalizedItem.downloadUrl,
              mediaAssetId: normalizedItem.mediaAssetId,
              displayFilename: normalizedItem.displayFilename,
              mimeType: normalizedItem.mimeType,
              fileSizeBytes: normalizedItem.fileSizeBytes,
              accessibilityLabel: normalizedItem.accessibilityLabel,
              opensInNewTab: normalizedItem.opensInNewTab,
              sortOrder: normalizedItem.sortOrder,
              isFeatured: normalizedItem.isFeatured,
              publishStatus: normalizedItem.publishStatus,
              countdownPageId: normalizedItem.countdownPageSlug
                ? countdownIdBySlug.get(normalizedItem.countdownPageSlug) ?? null
                : null
          };

          if (itemPayload.id) {
            await tx.freeMaterialItem.update({
              where: { id: itemPayload.id },
              data: {
                ...itemData,
                version: {
                  increment: 1
                }
              }
            });
          } else {
            await tx.freeMaterialItem.upsert({
              where: { slug: normalizedItem.slug },
              update: {
                ...itemData,
                version: {
                  increment: 1
                }
              },
              create: itemData
            });
          }
        }
      }

      const [categories, countdownPages] = await Promise.all([
        tx.freeMaterialCategory.findMany({
          include: freeMaterialCategoriesInclude,
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
        }),
        tx.countdownPage.findMany({
          include: countdownPagesInclude,
          orderBy: [{ createdAt: "asc" }]
        })
      ]);
      const normalized = normalizeFreeMaterialsDocument(categories, countdownPages);
      await recordWebsiteRevision(tx, auth, {
        entityType: "FreeMaterialsDocument",
        entityKey: "free-materials",
        action: "website.free-materials.publish",
        version: normalized.version,
        summary: "Ücretsiz materyaller yayınlandı.",
        beforeData: before,
        afterData: normalized
      });
      await recordAuditLog(tx, auth, {
        action: "website.free-materials.publish",
        entityType: "FreeMaterialCategory",
        entityId: "all",
        summary: "Ücretsiz materyaller yayınlandı.",
        beforeData: before,
        afterData: normalized,
        metadata: revalidationMetadata(
          freeMaterialRevalidationRoutes(),
          ["free-materials"]
        )
      });

      return normalized;
    });

    return {
      ...document,
      revalidateRoutes: freeMaterialRevalidationRoutes(),
      revalidateTags: ["free-materials"]
    };
  }

  archiveMaterialCategory(categoryKey: string, auth: AuthenticatedRequestContext) {
    return this.changeMaterialCategoryStatus(categoryKey, ContentStatus.ARCHIVED, auth, "archive");
  }

  restoreMaterialCategory(categoryKey: string, auth: AuthenticatedRequestContext) {
    return this.changeMaterialCategoryStatus(categoryKey, ContentStatus.PUBLISHED, auth, "restore");
  }

  async deleteMaterialCategory(categoryKey: string, auth: AuthenticatedRequestContext) {
    requireWebsiteManage(auth);
    const key = sanitizeSlug(categoryKey);

    await this.prisma.$transaction(async (tx) => {
      const category = await tx.freeMaterialCategory.findUnique({
        where: { key },
        include: freeMaterialCategoriesInclude
      });

      if (!category) {
        throw new NotFoundException("Materyal kategorisi bulunamadı.");
      }

      if (category.items.length > 0) {
        throw new BadRequestException(CATEGORY_DELETE_BLOCKED_MESSAGE);
      }

      const beforeData = normalizeFreeMaterialCategoryForRevision(category);
      await tx.freeMaterialCategory.delete({ where: { id: category.id } });
      await recordWebsiteRevision(tx, auth, {
        entityType: "FreeMaterialCategory",
        entityKey: key,
        action: "website.free-materials.category.delete",
        version: category.version + 1,
        summary: "Ücretsiz materyal kategorisi kalıcı olarak silindi.",
        beforeData,
        afterData: { deleted: true, category: beforeData }
      });
      await recordAuditLog(tx, auth, {
        action: "website.free-materials.category.delete",
        entityType: "FreeMaterialCategory",
        entityId: category.id,
        summary: "Ücretsiz materyal kategorisi kalıcı olarak silindi.",
        beforeData,
        afterData: { deleted: true, category: beforeData },
        metadata: revalidationMetadata(freeMaterialRevalidationRoutes(), ["free-materials"])
      });
    });

    return withFreeMaterialRevalidation(await this.getFreeMaterialsDocument(auth));
  }

  archiveMaterialCard(itemIdOrSlug: string, auth: AuthenticatedRequestContext) {
    return this.changeMaterialCardStatus(itemIdOrSlug, ContentStatus.ARCHIVED, auth, "archive");
  }

  restoreMaterialCard(itemIdOrSlug: string, auth: AuthenticatedRequestContext) {
    return this.changeMaterialCardStatus(itemIdOrSlug, ContentStatus.PUBLISHED, auth, "restore");
  }

  async deleteMaterialCard(itemIdOrSlug: string, auth: AuthenticatedRequestContext) {
    requireWebsiteManage(auth);

    await this.prisma.$transaction(async (tx) => {
      const item = await findFreeMaterialItemForMutation(tx, itemIdOrSlug);

      if (!item) {
        throw new NotFoundException("Materyal kartı bulunamadı.");
      }

      if (PROTECTED_FREE_MATERIAL_ITEM_TYPES.has(item.itemType)) {
        throw new BadRequestException("Sistem aracı kartları kalıcı olarak silinemez; arşivleyerek public görünürlüğünü kapatın.");
      }

      const beforeData = normalizeFreeMaterialItemForRevision(item);
      await tx.freeMaterialItem.delete({ where: { id: item.id } });
      await recordWebsiteRevision(tx, auth, {
        entityType: "FreeMaterialItem",
        entityKey: item.slug ?? item.id,
        action: "website.free-materials.item.delete",
        version: item.version + 1,
        summary: "Ücretsiz materyal kartı kalıcı olarak silindi.",
        beforeData,
        afterData: { deleted: true, item: beforeData }
      });
      await recordAuditLog(tx, auth, {
        action: "website.free-materials.item.delete",
        entityType: "FreeMaterialItem",
        entityId: item.id,
        summary: "Ücretsiz materyal kartı kalıcı olarak silindi.",
        beforeData,
        afterData: { deleted: true, item: beforeData },
        metadata: revalidationMetadata(freeMaterialRevalidationRoutes(), ["free-materials"])
      });
    });

    return withFreeMaterialRevalidation(await this.getFreeMaterialsDocument(auth));
  }

  async moveMaterialCard(itemIdOrSlug: string, direction: -1 | 1, auth: AuthenticatedRequestContext) {
    requireWebsiteManage(auth);

    await this.prisma.$transaction(async (tx) => {
      const item = await findFreeMaterialItemForMutation(tx, itemIdOrSlug);

      if (!item) {
        throw new NotFoundException("Materyal kartı bulunamadı.");
      }

      const siblings = await tx.freeMaterialItem.findMany({
        where: { categoryId: item.categoryId },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
      });
      const currentIndex = siblings.findIndex((entry) => entry.id === item.id);
      const target = siblings[currentIndex + direction];

      if (!target) {
        return;
      }

      const beforeData = {
        item: normalizeFreeMaterialItemForRevision(item),
        target: normalizeFreeMaterialItemForRevision({ ...target, category: item.category, countdownPage: null })
      };

      await tx.freeMaterialItem.update({
        where: { id: item.id },
        data: { sortOrder: target.sortOrder, version: { increment: 1 } }
      });
      await tx.freeMaterialItem.update({
        where: { id: target.id },
        data: { sortOrder: item.sortOrder, version: { increment: 1 } }
      });

      const updated = await findFreeMaterialItemForMutation(tx, item.id);
      await recordWebsiteRevision(tx, auth, {
        entityType: "FreeMaterialItem",
        entityKey: item.slug ?? item.id,
        action: "website.free-materials.item.move",
        version: item.version + 1,
        summary: "Ücretsiz materyal kartı sıralandı.",
        beforeData,
        afterData: updated ? normalizeFreeMaterialItemForRevision(updated) : beforeData.item
      });
      await recordAuditLog(tx, auth, {
        action: "website.free-materials.item.move",
        entityType: "FreeMaterialItem",
        entityId: item.id,
        summary: "Ücretsiz materyal kartı sıralandı.",
        beforeData,
        afterData: updated ? normalizeFreeMaterialItemForRevision(updated) : beforeData.item,
        metadata: revalidationMetadata(freeMaterialRevalidationRoutes(), ["free-materials"])
      });
    });

    return withFreeMaterialRevalidation(await this.getFreeMaterialsDocument(auth));
  }

  private async restoreMaterialCardFromRevision(
    data: Record<string, unknown>,
    auth: AuthenticatedRequestContext
  ) {
    const nestedItemData = asRecord(data.item);
    const itemData = Object.keys(nestedItemData).length > 0 ? nestedItemData : data;
    const categoryKey = typeof itemData.categoryKey === "string" ? sanitizeSlug(itemData.categoryKey) : "";

    if (!categoryKey) {
      throw new BadRequestException("Materyal kartı revizyonunda kategori bilgisi bulunamadı.");
    }

    await this.prisma.$transaction(async (tx) => {
      const category = await tx.freeMaterialCategory.findUnique({ where: { key: categoryKey } });

      if (!category) {
        throw new NotFoundException("Materyal kategorisi bulunamadı.");
      }

      const normalizedItem = normalizeFreeMaterialItemInput({
          slug: typeof itemData.slug === "string" ? itemData.slug : undefined,
          title: typeof itemData.title === "string" ? itemData.title : "Geri yüklenen materyal",
          itemType: normalizeFreeMaterialItemType(itemData.itemType),
          badgeLabel: nullableRevisionString(itemData.badgeLabel) ?? undefined,
          summary: nullableRevisionString(itemData.summary) ?? undefined,
          href: nullableRevisionString(itemData.href) ?? undefined,
          buttonLabel: nullableRevisionString(itemData.buttonLabel) ?? undefined,
          iconKey: nullableRevisionString(itemData.iconKey) ?? undefined,
          tone: nullableRevisionString(itemData.tone) ?? undefined,
          coverImageUrl: nullableRevisionString(itemData.coverImageUrl) ?? undefined,
          downloadUrl: nullableRevisionString(itemData.downloadUrl) ?? undefined,
          mediaAssetId: nullableRevisionString(itemData.mediaAssetId) ?? undefined,
          displayFilename: nullableRevisionString(itemData.displayFilename) ?? undefined,
          mimeType: nullableRevisionString(itemData.mimeType) ?? undefined,
          fileSizeBytes: typeof itemData.fileSizeBytes === "number" ? itemData.fileSizeBytes : undefined,
          accessibilityLabel: nullableRevisionString(itemData.accessibilityLabel) ?? undefined,
          opensInNewTab: typeof itemData.opensInNewTab === "boolean" ? itemData.opensInNewTab : false,
          sortOrder: typeof itemData.sortOrder === "number" ? itemData.sortOrder : undefined,
          isFeatured: typeof itemData.isFeatured === "boolean" ? itemData.isFeatured : false,
          publishStatus: normalizeContentStatus(itemData.publishStatus, ContentStatus.PUBLISHED),
          countdownPageSlug: nullableRevisionString(itemData.countdownPageSlug) ?? undefined
        },
        categoryKey,
        0,
        {
          requirePublishReady: false
        }
      );
      const countdownPage = normalizedItem.countdownPageSlug
        ? await tx.countdownPage.findUnique({ where: { slug: normalizedItem.countdownPageSlug } })
        : null;

      const restored = await tx.freeMaterialItem.upsert({
        where: { slug: normalizedItem.slug },
        update: {
          categoryId: category.id,
          title: normalizedItem.title,
          itemType: normalizedItem.itemType,
          badgeLabel: normalizedItem.badgeLabel,
          summary: normalizedItem.summary,
          href: normalizedItem.href,
          buttonLabel: normalizedItem.buttonLabel,
          iconKey: normalizedItem.iconKey,
          tone: normalizedItem.tone,
          coverImageUrl: normalizedItem.coverImageUrl,
          downloadUrl: normalizedItem.downloadUrl,
          mediaAssetId: normalizedItem.mediaAssetId,
          displayFilename: normalizedItem.displayFilename,
          mimeType: normalizedItem.mimeType,
          fileSizeBytes: normalizedItem.fileSizeBytes,
          accessibilityLabel: normalizedItem.accessibilityLabel,
          opensInNewTab: normalizedItem.opensInNewTab,
          sortOrder: normalizedItem.sortOrder,
          isFeatured: normalizedItem.isFeatured,
          publishStatus: normalizedItem.publishStatus,
          countdownPageId: countdownPage?.id ?? null,
          version: { increment: 1 }
        },
        create: {
          categoryId: category.id,
          slug: normalizedItem.slug,
          title: normalizedItem.title,
          itemType: normalizedItem.itemType,
          badgeLabel: normalizedItem.badgeLabel,
          summary: normalizedItem.summary,
          href: normalizedItem.href,
          buttonLabel: normalizedItem.buttonLabel,
          iconKey: normalizedItem.iconKey,
          tone: normalizedItem.tone,
          coverImageUrl: normalizedItem.coverImageUrl,
          downloadUrl: normalizedItem.downloadUrl,
          mediaAssetId: normalizedItem.mediaAssetId,
          displayFilename: normalizedItem.displayFilename,
          mimeType: normalizedItem.mimeType,
          fileSizeBytes: normalizedItem.fileSizeBytes,
          accessibilityLabel: normalizedItem.accessibilityLabel,
          opensInNewTab: normalizedItem.opensInNewTab,
          sortOrder: normalizedItem.sortOrder,
          isFeatured: normalizedItem.isFeatured,
          publishStatus: normalizedItem.publishStatus,
          countdownPageId: countdownPage?.id ?? null
        }
      });

      await recordWebsiteRevision(tx, auth, {
        entityType: "FreeMaterialItem",
        entityKey: restored.slug ?? restored.id,
        action: "website.free-materials.item.restore-revision",
        version: restored.version,
        summary: "Ücretsiz materyal kartı revizyondan geri yüklendi.",
        beforeData: null,
        afterData: { ...normalizedItem, id: restored.id, categoryKey }
      });
      await recordAuditLog(tx, auth, {
        action: "website.free-materials.item.restore-revision",
        entityType: "FreeMaterialItem",
        entityId: restored.id,
        summary: "Ücretsiz materyal kartı revizyondan geri yüklendi.",
        beforeData: null,
        afterData: { ...normalizedItem, id: restored.id, categoryKey },
        metadata: revalidationMetadata(freeMaterialRevalidationRoutes(), ["free-materials"])
      });
    });

    return withFreeMaterialRevalidation(await this.getFreeMaterialsDocument(auth));
  }

  private async changeMaterialCategoryStatus(
    categoryKey: string,
    publishStatus: ContentStatus,
    auth: AuthenticatedRequestContext,
    actionName: "archive" | "restore"
  ) {
    requireWebsiteManage(auth);
    const key = sanitizeSlug(categoryKey);

    await this.prisma.$transaction(async (tx) => {
      const before = await tx.freeMaterialCategory.findUnique({
        where: { key },
        include: freeMaterialCategoriesInclude
      });

      if (!before) {
        throw new NotFoundException("Materyal kategorisi bulunamadı.");
      }

      const beforeData = normalizeFreeMaterialCategoryForRevision(before);
      const updated = await tx.freeMaterialCategory.update({
        where: { id: before.id },
        data: {
          publishStatus,
          version: { increment: 1 }
        },
        include: freeMaterialCategoriesInclude
      });
      const afterData = normalizeFreeMaterialCategoryForRevision(updated);
      await recordWebsiteRevision(tx, auth, {
        entityType: "FreeMaterialCategory",
        entityKey: key,
        action: `website.free-materials.category.${actionName}`,
        version: updated.version,
        summary: actionName === "archive"
          ? "Ücretsiz materyal kategorisi arşivlendi."
          : "Ücretsiz materyal kategorisi arşivden çıkarıldı.",
        beforeData,
        afterData
      });
      await recordAuditLog(tx, auth, {
        action: `website.free-materials.category.${actionName}`,
        entityType: "FreeMaterialCategory",
        entityId: updated.id,
        summary: actionName === "archive"
          ? "Ücretsiz materyal kategorisi arşivlendi."
          : "Ücretsiz materyal kategorisi arşivden çıkarıldı.",
        beforeData,
        afterData,
        metadata: revalidationMetadata(freeMaterialRevalidationRoutes(), ["free-materials"])
      });
    });

    return withFreeMaterialRevalidation(await this.getFreeMaterialsDocument(auth));
  }

  private async changeMaterialCardStatus(
    itemIdOrSlug: string,
    publishStatus: ContentStatus,
    auth: AuthenticatedRequestContext,
    actionName: "archive" | "restore"
  ) {
    requireWebsiteManage(auth);

    await this.prisma.$transaction(async (tx) => {
      const before = await findFreeMaterialItemForMutation(tx, itemIdOrSlug);

      if (!before) {
        throw new NotFoundException("Materyal kartı bulunamadı.");
      }

      const beforeData = normalizeFreeMaterialItemForRevision(before);
      const updated = await tx.freeMaterialItem.update({
        where: { id: before.id },
        data: {
          publishStatus,
          version: { increment: 1 }
        },
        include: freeMaterialItemMutationInclude
      });
      const afterData = normalizeFreeMaterialItemForRevision(updated);
      await recordWebsiteRevision(tx, auth, {
        entityType: "FreeMaterialItem",
        entityKey: updated.slug ?? updated.id,
        action: `website.free-materials.item.${actionName}`,
        version: updated.version,
        summary: actionName === "archive"
          ? "Ücretsiz materyal kartı arşivlendi."
          : "Ücretsiz materyal kartı arşivden çıkarıldı.",
        beforeData,
        afterData
      });
      await recordAuditLog(tx, auth, {
        action: `website.free-materials.item.${actionName}`,
        entityType: "FreeMaterialItem",
        entityId: updated.id,
        summary: actionName === "archive"
          ? "Ücretsiz materyal kartı arşivlendi."
          : "Ücretsiz materyal kartı arşivden çıkarıldı.",
        beforeData,
        afterData,
        metadata: revalidationMetadata(freeMaterialRevalidationRoutes(), ["free-materials"])
      });
    });

    return withFreeMaterialRevalidation(await this.getFreeMaterialsDocument(auth));
  }
}

function freeMaterialRevalidationRoutes() {
  return [
    "/ucretsiz-materyaller",
    "/ucretsiz-materyaller/pdf-dokumanlar",
    "/ucretsiz-materyaller/faydali-linkler",
    "/ucretsiz-materyaller/blog",
    "/ucretsiz-materyaller/yks-kac-gun-kaldi",
    "/ucretsiz-materyaller/yks-atlas",
    "/ucretsiz-materyaller/turkiye-geneli-deneme",
    "/ucretsiz-materyaller/puan-hesapla",
    "/ucretsiz-materyaller/puan-hesaplama",
    "/ucretsiz-materyaller/maarif-simulasyonlari"
  ];
}

function withFreeMaterialRevalidation<T extends object>(document: T) {
  return {
    ...document,
    revalidateRoutes: freeMaterialRevalidationRoutes(),
    revalidateTags: ["free-materials"]
  };
}

function normalizeFreeMaterialCategoryForRevision(category: FreeMaterialCategoryWithItems) {
  return normalizeFreeMaterialsDocument([category], []).categories[0];
}

async function findFreeMaterialItemForMutation(tx: TransactionClient, itemIdOrSlug: string) {
  return tx.freeMaterialItem.findFirst({
    where: {
      OR: [{ id: itemIdOrSlug }, { slug: itemIdOrSlug }]
    },
    include: freeMaterialItemMutationInclude
  });
}

function normalizeFreeMaterialItemForRevision(
  item: NonNullable<Awaited<ReturnType<typeof findFreeMaterialItemForMutation>>>
) {
  return {
    id: item.id,
    categoryId: item.categoryId,
    categoryKey: item.category.key,
    slug: item.slug ?? sanitizeSlug(`${item.category.key}-${item.title}`),
    title: item.title,
    itemType: item.itemType,
    badgeLabel: item.badgeLabel,
    summary: item.summary,
    href: item.href,
    buttonLabel: item.buttonLabel,
    iconKey: item.iconKey,
    tone: item.tone,
    coverImageUrl: item.coverImageUrl,
    downloadUrl: item.downloadUrl,
    mediaAssetId: item.mediaAssetId,
    displayFilename: item.displayFilename,
    mimeType: item.mimeType,
    fileSizeBytes: item.fileSizeBytes,
    accessibilityLabel: item.accessibilityLabel,
    opensInNewTab: item.opensInNewTab,
    sortOrder: item.sortOrder,
    isFeatured: item.isFeatured,
    publishStatus: item.publishStatus,
    version: item.version,
    countdownPageSlug: item.countdownPage?.slug ?? null
  };
}

function nullableRevisionString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function normalizeFreeMaterialItemType(value: unknown) {
  return Object.values(FreeMaterialItemType).includes(value as FreeMaterialItemType)
    ? (value as FreeMaterialItemType)
    : FreeMaterialItemType.INTERNAL_PAGE;
}

function normalizeContentStatus(value: unknown, fallback: ContentStatus) {
  return Object.values(ContentStatus).includes(value as ContentStatus)
    ? (value as ContentStatus)
    : fallback;
}

async function upsertNavigationItems(
  tx: TransactionClient,
  menuId: string,
  items: readonly SaveNavigationMenuItemDto[],
  parentId: string | null,
  activeKeys: string[]
) {
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const itemKey = sanitizeSlug(item.itemKey);
    activeKeys.push(itemKey);
    const record = await tx.navigationMenuItem.upsert({
      where: {
        menuId_itemKey: {
          menuId,
          itemKey
        }
      },
      update: {
        parentId,
        label: sanitizePlainText(item.label),
        href: normalizeRequiredContentHref(item.href),
        description: sanitizeNullableText(item.description),
        target: sanitizeNullableText(item.target),
        isActive: item.isActive ?? true,
        sortOrder: item.sortOrder ?? (index + 1) * 10
      },
      create: {
        menuId,
        parentId,
        itemKey,
        label: sanitizePlainText(item.label),
        href: normalizeRequiredContentHref(item.href),
        description: sanitizeNullableText(item.description),
        target: sanitizeNullableText(item.target),
        isActive: item.isActive ?? true,
        sortOrder: item.sortOrder ?? (index + 1) * 10
      }
    });

    if (item.children?.length) {
      await upsertNavigationItems(tx, menuId, item.children, record.id, activeKeys);
    }
  }
}

async function upsertCountdownPage(tx: TransactionClient, page: SaveCountdownPageDto) {
  const slug = sanitizeSlug(page.slug);
  const record = await tx.countdownPage.upsert({
    where: { slug },
    update: {
      eyebrow: sanitizePlainText(page.eyebrow),
      title: sanitizePlainText(page.title),
      description: sanitizePlainText(page.description),
      updatedLabel: sanitizeNullableText(page.updatedLabel),
      videoTitle: sanitizePlainText(page.videoTitle),
      videoNote: sanitizePlainText(page.videoNote),
      publishStatus: page.publishStatus ?? ContentStatus.PUBLISHED,
      version: {
        increment: 1
      }
    },
    create: {
      slug,
      eyebrow: sanitizePlainText(page.eyebrow),
      title: sanitizePlainText(page.title),
      description: sanitizePlainText(page.description),
      updatedLabel: sanitizeNullableText(page.updatedLabel),
      videoTitle: sanitizePlainText(page.videoTitle),
      videoNote: sanitizePlainText(page.videoNote),
      publishStatus: page.publishStatus ?? ContentStatus.PUBLISHED
    }
  });

  await tx.countdownTarget.deleteMany({
    where: { countdownPageId: record.id }
  });
  await tx.countdownOfficialLink.deleteMany({
    where: { countdownPageId: record.id }
  });
  await tx.countdownArticleSection.deleteMany({
    where: { countdownPageId: record.id }
  });

  if (page.targets.length > 0) {
    await tx.countdownTarget.createMany({
      data: page.targets.map((target, index) => ({
        countdownPageId: record.id,
        label: sanitizePlainText(target.label),
        targetAt: target.targetAt ? new Date(target.targetAt) : null,
        dateLabel: sanitizePlainText(target.dateLabel),
        note: sanitizePlainText(target.note),
        sortOrder: target.sortOrder ?? (index + 1) * 10
      }))
    });
  }

  if (page.officialLinks.length > 0) {
    await tx.countdownOfficialLink.createMany({
      data: page.officialLinks.map((link, index) => ({
        countdownPageId: record.id,
        title: sanitizePlainText(link.title),
        linkType: sanitizePlainText(link.linkType),
        summary: sanitizePlainText(link.summary),
        href: normalizeRequiredContentHref(link.href),
        buttonLabel: sanitizeNullableText(link.buttonLabel),
        sortOrder: link.sortOrder ?? (index + 1) * 10
      }))
    });
  }

  if (page.articleSections.length > 0) {
    await tx.countdownArticleSection.createMany({
      data: page.articleSections.map((section, index) => ({
        countdownPageId: record.id,
        title: sanitizePlainText(section.title),
        body: sanitizePlainText(section.body),
        sortOrder: section.sortOrder ?? (index + 1) * 10
      }))
    });
  }

  return record;
}

function normalizeSiteSettings(record: SiteSettingRecord | null) {
  const source = record ?? defaultSiteSettings;
  const footerQuickLinks = normalizeLinkList(source.footerQuickLinks, REQUIRED_QUICK_LINKS);
  const socialLinks = normalizeLinkList(source.socialLinks, []);
  const canonicalPhone = source.canonicalPhone ?? defaultSiteSettings.canonicalPhone;
  const whatsappNumber = source.supportWhatsappNumber ?? defaultSiteSettings.supportWhatsappNumber;
  const whatsappMessage = source.whatsappMessage ?? defaultSiteSettings.whatsappMessage;

  return {
    id: source.id,
    key: source.key,
    siteName: source.siteName || defaultSiteSettings.siteName,
    siteTitle: source.siteTitle || defaultSiteSettings.siteTitle,
    tagline: source.tagline ?? defaultSiteSettings.tagline,
    supportEmail: source.supportEmail ?? defaultSiteSettings.supportEmail,
    supportPhone: source.supportPhone ?? defaultSiteSettings.supportPhone,
    supportWhatsappNumber: whatsappNumber,
    logoPrimaryUrl: source.logoPrimaryUrl ?? defaultSiteSettings.logoPrimaryUrl,
    logoMarkUrl: source.logoMarkUrl ?? defaultSiteSettings.logoMarkUrl,
    logoFooterUrl: source.logoFooterUrl ?? defaultSiteSettings.logoFooterUrl,
    logoCompactUrl: source.logoCompactUrl ?? defaultSiteSettings.logoCompactUrl,
    logoDarkUrl: source.logoDarkUrl ?? defaultSiteSettings.logoDarkUrl,
    logoLightUrl: source.logoLightUrl ?? defaultSiteSettings.logoLightUrl,
    faviconUrl: source.faviconUrl ?? defaultSiteSettings.faviconUrl,
    defaultSocialImageUrl: source.defaultSocialImageUrl ?? defaultSiteSettings.defaultSocialImageUrl,
    logoAltText: source.logoAltText ?? defaultSiteSettings.logoAltText,
    displayPhone: source.displayPhone ?? defaultSiteSettings.displayPhone,
    canonicalPhone,
    telHref: `tel:${canonicalPhone}`,
    whatsappMessage,
    whatsappHref: buildWhatsappHref(whatsappNumber, whatsappMessage),
    address: source.address ?? defaultSiteSettings.address,
    publicContactEmail: source.publicContactEmail ?? source.supportEmail ?? defaultSiteSettings.publicContactEmail,
    footerBrandDescription:
      source.footerBrandDescription ?? defaultSiteSettings.footerBrandDescription,
    footerQuickLinks,
    footerContactTitle: source.footerContactTitle ?? defaultSiteSettings.footerContactTitle,
    socialLinks,
    copyrightText: source.copyrightText ?? defaultSiteSettings.copyrightText,
    footerNotice: source.footerNotice ?? defaultSiteSettings.footerNotice,
    defaultSeoTitle: source.defaultSeoTitle ?? defaultSiteSettings.defaultSeoTitle,
    defaultSeoDescription:
      source.defaultSeoDescription ?? defaultSiteSettings.defaultSeoDescription,
    version: source.version ?? defaultSiteSettings.version,
    publishedAt: formatDate(source.publishedAt),
    lastPublishedByStaffUserId: source.lastPublishedByStaffUserId ?? null,
    updatedAt: formatDate(source.updatedAt)
  };
}

function normalizeSiteSettingsDraft(
  before: SiteSettingRecord | null,
  payload: ReturnType<typeof normalizeSiteSettingsPayload>
) {
  const base = normalizeSiteSettings(before);
  return {
    ...base,
    ...payload,
    telHref: `tel:${payload.canonicalPhone}`,
    whatsappHref: buildWhatsappHref(payload.supportWhatsappNumber, payload.whatsappMessage),
    version: before?.version ?? 1,
    publishedAt: formatDate(before?.publishedAt),
    lastPublishedByStaffUserId: before?.lastPublishedByStaffUserId ?? null,
    updatedAt: formatDate(before?.updatedAt)
  };
}

function normalizeSiteSettingsPayload(payload: SaveSiteSettingsDto) {
  const canonicalPhone = sanitizePlainText(payload.canonicalPhone);
  const supportWhatsappNumber = sanitizePlainText(payload.supportWhatsappNumber);
  const displayPhone = sanitizePlainText(payload.displayPhone);

  if (!/^\+[1-9]\d{7,14}$/.test(canonicalPhone)) {
    throw new BadRequestException(PHONE_FORMAT_MESSAGE);
  }

  if (!/^[1-9]\d{7,14}$/.test(supportWhatsappNumber)) {
    throw new BadRequestException(WHATSAPP_FORMAT_MESSAGE);
  }

  if (!/^\+\d[\d\s]{7,20}$/.test(displayPhone)) {
    throw new BadRequestException("Görünen telefon numarası +90 531 855 38 27 biçiminde olmalıdır.");
  }

  const footerQuickLinks = normalizeEditableLinks(payload.footerQuickLinks, REQUIRED_QUICK_LINKS);
  const socialLinks = normalizeEditableLinks(payload.socialLinks, []);

  return {
    siteName: sanitizePlainText(payload.siteName),
    siteTitle: sanitizePlainText(payload.siteTitle),
    tagline: sanitizeNullableText(payload.tagline),
    supportEmail: sanitizeNullableText(payload.supportEmail),
    supportPhone: displayPhone,
    supportWhatsappNumber,
    logoPrimaryUrl: normalizeRequiredAssetUrl(payload.logoPrimaryUrl, defaultSiteSettings.logoPrimaryUrl),
    logoMarkUrl: normalizeRequiredAssetUrl(payload.logoMarkUrl, defaultSiteSettings.logoMarkUrl),
    logoFooterUrl: normalizeRequiredAssetUrl(payload.logoFooterUrl, defaultSiteSettings.logoFooterUrl),
    logoCompactUrl: normalizeRequiredAssetUrl(payload.logoCompactUrl, defaultSiteSettings.logoCompactUrl),
    logoDarkUrl: normalizeRequiredAssetUrl(payload.logoDarkUrl, defaultSiteSettings.logoDarkUrl),
    logoLightUrl: normalizeRequiredAssetUrl(payload.logoLightUrl, defaultSiteSettings.logoLightUrl),
    faviconUrl: normalizeRequiredAssetUrl(payload.faviconUrl, defaultSiteSettings.faviconUrl),
    defaultSocialImageUrl: normalizeRequiredAssetUrl(
      payload.defaultSocialImageUrl,
      defaultSiteSettings.defaultSocialImageUrl
    ),
    logoAltText: sanitizeNullableText(payload.logoAltText) ?? defaultSiteSettings.logoAltText,
    displayPhone,
    canonicalPhone,
    whatsappMessage: sanitizePlainText(payload.whatsappMessage),
    address: sanitizePlainText(payload.address),
    publicContactEmail: sanitizeNullableText(payload.publicContactEmail),
    footerBrandDescription: sanitizePlainText(payload.footerBrandDescription),
    footerQuickLinks,
    footerContactTitle: sanitizePlainText(payload.footerContactTitle),
    socialLinks,
    copyrightText: sanitizePlainText(payload.copyrightText),
    footerNotice: sanitizeNullableText(payload.footerNotice),
    defaultSeoTitle: sanitizeNullableText(payload.defaultSeoTitle),
    defaultSeoDescription: sanitizeNullableText(payload.defaultSeoDescription)
  };
}

function normalizeNavigationMenu(menu: NavigationMenuWithItems) {
  return {
    id: menu.id,
    key: menu.key,
    name: menu.name,
    location: menu.location,
    description: menu.description,
    isActive: menu.isActive,
    version: menu.version,
    items: buildNavigationTree(menu.items)
  };
}

function normalizeNavigationMenuPayload(
  key: string,
  payload: SaveNavigationMenuDto,
  before: NavigationMenuWithItems | null
) {
  return {
    id: before?.id ?? "",
    key,
    name: sanitizePlainText(payload.name),
    location: payload.location,
    description: sanitizeNullableText(payload.description),
    isActive: payload.isActive ?? true,
    version: before?.version ?? 1,
    items: normalizeNavigationItems(payload.items)
  };
}

function assertNavigationMenuCanBeSaved(payload: SaveNavigationMenuDto) {
  if (payload.isActive === false) {
    return;
  }

  const hasActiveTopLevelItem = payload.items.some((item) => {
    if (item.isActive === false) {
      return false;
    }

    return Boolean(item.itemKey?.trim() && item.label?.trim() && item.href?.trim());
  });

  if (!hasActiveTopLevelItem) {
    throw new BadRequestException(EMPTY_ACTIVE_NAVIGATION_MESSAGE);
  }
}

function normalizeNavigationItems(items: readonly SaveNavigationMenuItemDto[]): NavigationTreeNode[] {
  return items.map((item, index) => ({
    id: item.itemKey,
    itemKey: sanitizeSlug(item.itemKey),
    label: sanitizePlainText(item.label),
    href: normalizeRequiredContentHref(item.href),
    description: sanitizeNullableText(item.description),
    target: sanitizeNullableText(item.target),
    sortOrder: item.sortOrder ?? (index + 1) * 10,
    isActive: item.isActive ?? true,
    children: normalizeNavigationItems(item.children ?? [])
  }));
}

function createEmptyNavigationMenu(key: string) {
  return {
    id: "",
    key,
    name: key === "primary" ? "Primary Navigation" : key,
    location: key === "primary" ? "PRIMARY" : key.toUpperCase(),
    description: null,
    isActive: true,
    version: 1,
    items: []
  };
}

type NavigationTreeNode = {
  id: string;
  itemKey: string;
  label: string;
  href: string;
  description: string | null;
  target: string | null;
  sortOrder: number;
  isActive: boolean;
  children: NavigationTreeNode[];
};

function buildNavigationTree(
  items: NavigationMenuWithItems["items"],
  parentId: string | null = null
): NavigationTreeNode[] {
  return items
    .filter((item) => item.parentId === parentId)
    .map((item) => ({
      id: item.id,
      itemKey: item.itemKey,
      label: item.label,
      href: item.href,
      description: item.description,
      target: item.target,
      sortOrder: item.sortOrder,
      isActive: item.isActive,
      children: buildNavigationTree(items, item.id)
    }));
}

function normalizeMarketingPage(page: MarketingPageWithSections) {
  return {
    id: page.id,
    key: page.key,
    slug: page.slug,
    title: page.title,
    excerpt: page.excerpt,
    description: page.description,
    pageType: page.pageType,
    publishStatus: page.publishStatus,
    seoTitle: page.seoTitle,
    seoDescription: page.seoDescription,
    heroImageUrl: page.heroImageUrl,
    metadata: page.metadata,
    version: page.version,
    sections: page.sections.map((section) => ({
      id: section.id,
      sectionKey: section.sectionKey,
      eyebrow: section.eyebrow,
      title: section.title,
      body: section.body,
      variantKey: section.variantKey,
      payload: section.payload,
      sortOrder: section.sortOrder,
      isActive: section.isActive,
      publishStatus: section.publishStatus
    }))
  };
}

function normalizeMarketingPagePayload(
  key: string,
  payload: SaveMarketingPageDto,
  before: MarketingPageWithSections | null
) {
  return {
    id: before?.id ?? "",
    key,
    slug: sanitizeSlug(payload.slug),
    title: sanitizePlainText(payload.title),
    excerpt: sanitizeNullableText(payload.excerpt),
    description: sanitizeNullableText(payload.description),
    pageType: payload.pageType,
    publishStatus: payload.publishStatus ?? ContentStatus.PUBLISHED,
    seoTitle: sanitizeNullableText(payload.seoTitle),
    seoDescription: sanitizeNullableText(payload.seoDescription),
    heroImageUrl: normalizeOptionalContentUrl(payload.heroImageUrl),
    metadata: payload.metadata ?? null,
    version: before?.version ?? 1,
    sections: payload.sections.map((section, index) => ({
      id: section.id ?? section.sectionKey,
      sectionKey: sanitizeSlug(section.sectionKey),
      eyebrow: sanitizeNullableText(section.eyebrow),
      title: sanitizeNullableText(section.title),
      body: sanitizeNullableText(section.body),
      variantKey: sanitizeNullableText(section.variantKey),
      payload: section.payload ?? null,
      sortOrder: section.sortOrder ?? (index + 1) * 10,
      isActive: section.isActive ?? true,
      publishStatus: section.publishStatus ?? ContentStatus.PUBLISHED
    }))
  };
}

function normalizeStaffProfilesDocument(groups: readonly StaffGroupWithProfiles[]) {
  return {
    version: getMaxVersion(groups),
    groups: groups.map(normalizeStaffGroup)
  };
}

function normalizeStaffGroup(group: StaffGroupWithProfiles) {
  return {
    id: group.id,
    key: group.key,
    label: group.label,
    eyebrow: group.eyebrow,
    description: group.description,
    introVideoSourceType: group.introVideoSourceType,
    introVideoUrl: group.introVideoUrl,
    introVideoPosterUrl: group.introVideoPosterUrl,
    introVideoTitle: group.introVideoTitle,
    sortOrder: group.sortOrder,
    publishStatus: group.publishStatus,
    version: group.version,
    profiles: group.profiles.map((profile) => ({
      id: profile.id,
      slug: profile.slug,
      fullName: profile.fullName,
      title: profile.title,
      city: profile.city,
      biography: profile.biography,
      photoUrl: profile.photoUrl,
      sortOrder: profile.sortOrder,
      publishStatus: profile.publishStatus
    }))
  };
}

function normalizeStaffProfilesPayload(payload: SaveStaffProfilesDocumentDto, version: number) {
  return {
    version,
    groups: payload.groups.map((group, groupIndex) => ({
      id: group.key,
      key: sanitizeSlug(group.key),
      label: sanitizePlainText(group.label),
      eyebrow: sanitizeNullableText(group.eyebrow),
      description: sanitizeNullableText(group.description),
      introVideoSourceType: group.introVideoSourceType ?? null,
      introVideoUrl: normalizeOptionalContentUrl(group.introVideoUrl),
      introVideoPosterUrl: normalizeOptionalContentUrl(group.introVideoPosterUrl),
      introVideoTitle: sanitizeNullableText(group.introVideoTitle),
      sortOrder: group.sortOrder ?? (groupIndex + 1) * 10,
      publishStatus: group.publishStatus ?? ContentStatus.PUBLISHED,
      profiles: group.profiles.map((profile, profileIndex) => ({
        id: profile.slug,
        slug: sanitizeSlug(profile.slug),
        fullName: sanitizePlainText(profile.fullName),
        title: sanitizePlainText(profile.title),
        city: sanitizeNullableText(profile.city),
        biography: sanitizeNullableText(profile.biography),
        photoUrl: normalizeOptionalContentUrl(profile.photoUrl),
        sortOrder: profile.sortOrder ?? (profileIndex + 1) * 10,
        publishStatus: profile.publishStatus ?? ContentStatus.PUBLISHED
      }))
    }))
  };
}

function normalizeSuccessStoriesDocument(stories: readonly Prisma.SuccessStoryGetPayload<object>[]) {
  return {
    version: getMaxVersion(stories),
    stories: stories.map((story) => ({
      id: story.id,
      slug: story.slug,
      studentName: story.studentName,
      city: story.city,
      examLabel: story.examLabel,
      resultTitle: story.resultTitle,
      highlight: story.highlight,
      story: story.story,
      avatarUrl: story.avatarUrl,
      isFeatured: story.isFeatured,
      sortOrder: story.sortOrder,
      publishStatus: story.publishStatus,
      version: story.version
    }))
  };
}

function normalizeSuccessStoriesPayload(payload: SaveSuccessStoriesDocumentDto, version: number) {
  return {
    version,
    stories: payload.stories.map((story, index) => ({
      id: story.slug,
      slug: sanitizeSlug(story.slug),
      studentName: sanitizePlainText(story.studentName),
      city: sanitizeNullableText(story.city),
      examLabel: sanitizeNullableText(story.examLabel),
      resultTitle: sanitizePlainText(story.resultTitle),
      highlight: sanitizePlainText(story.highlight),
      story: sanitizeNullableText(story.story),
      avatarUrl: normalizeOptionalContentUrl(story.avatarUrl),
      isFeatured: story.isFeatured ?? false,
      sortOrder: story.sortOrder ?? (index + 1) * 10,
      publishStatus: story.publishStatus ?? ContentStatus.PUBLISHED
    }))
  };
}

function normalizeFreeMaterialsDocument(
  categories: readonly FreeMaterialCategoryWithItems[],
  countdownPages: readonly CountdownPageWithChildren[]
) {
  return {
    version: Math.max(getMaxVersion(categories), getMaxVersion(countdownPages)),
    categories: categories.map((category) => ({
      id: category.id,
      key: category.key,
      label: category.label,
      description: category.description,
      sortOrder: category.sortOrder,
      publishStatus: category.publishStatus,
      version: category.version,
      items: category.items.map((item) => ({
        id: item.id,
        slug: item.slug ?? sanitizeSlug(`${category.key}-${item.title}`),
        title: item.title,
        itemType: item.itemType,
        badgeLabel: item.badgeLabel,
        summary: item.summary,
        href: item.href,
        buttonLabel: item.buttonLabel,
        iconKey: item.iconKey,
        tone: item.tone,
        coverImageUrl: item.coverImageUrl,
        downloadUrl: item.downloadUrl,
        mediaAssetId: item.mediaAssetId,
        displayFilename: item.displayFilename,
        mimeType: item.mimeType,
        fileSizeBytes: item.fileSizeBytes,
        accessibilityLabel: item.accessibilityLabel,
        opensInNewTab: item.opensInNewTab,
        sortOrder: item.sortOrder,
        isFeatured: item.isFeatured,
        publishStatus: item.publishStatus,
        version: item.version,
        countdownPageSlug: item.countdownPage?.slug ?? null
      }))
    })),
    countdownPages: countdownPages.map((page) => ({
      id: page.id,
      slug: page.slug,
      eyebrow: page.eyebrow,
      title: page.title,
      description: page.description,
      updatedLabel: page.updatedLabel,
      videoTitle: page.videoTitle,
      videoNote: page.videoNote,
      publishStatus: page.publishStatus,
      version: page.version,
      targets: page.targets.map((target) => ({
        id: target.id,
        label: target.label,
        targetAt: target.targetAt?.toISOString() ?? null,
        dateLabel: target.dateLabel,
        note: target.note,
        sortOrder: target.sortOrder
      })),
      officialLinks: page.officialLinks.map((link) => ({
        id: link.id,
        title: link.title,
        linkType: link.linkType,
        summary: link.summary,
        href: link.href,
        buttonLabel: link.buttonLabel,
        sortOrder: link.sortOrder
      })),
      articleSections: page.articleSections.map((section) => ({
        id: section.id,
        title: section.title,
        body: section.body,
        sortOrder: section.sortOrder
      }))
    }))
  };
}

function normalizeFreeMaterialsPayload(
  payload: SaveFreeMaterialsDocumentDto,
  version: number,
  requirePublishReady: boolean
) {
  const countdownSlugs = new Set(payload.countdownPages.filter((page) => (page.publishStatus ?? ContentStatus.PUBLISHED) === ContentStatus.PUBLISHED).map((page) => sanitizeSlug(page.slug)));

  return {
    version,
    categories: payload.categories.map((category, categoryIndex) => {
      const key = sanitizeSlug(category.key);
      return {
        id: key,
        key,
        label: sanitizePlainText(category.label),
        description: sanitizeNullableText(category.description),
        sortOrder: category.sortOrder ?? (categoryIndex + 1) * 10,
        publishStatus: category.publishStatus ?? ContentStatus.PUBLISHED,
        items: category.items.map((item, itemIndex) =>
          normalizeFreeMaterialItemInput(item, key, itemIndex, { requirePublishReady, countdownSlugs })
        )
      };
    }),
    countdownPages: payload.countdownPages.map((page) => ({
      id: page.slug,
      slug: sanitizeSlug(page.slug),
      eyebrow: sanitizePlainText(page.eyebrow),
      title: sanitizePlainText(page.title),
      description: sanitizePlainText(page.description),
      updatedLabel: sanitizeNullableText(page.updatedLabel),
      videoTitle: sanitizePlainText(page.videoTitle),
      videoNote: sanitizePlainText(page.videoNote),
      publishStatus: page.publishStatus ?? ContentStatus.PUBLISHED,
      targets: page.targets.map((target, index) => ({
        id: `${page.slug}-target-${index}`,
        label: sanitizePlainText(target.label),
        targetAt: target.targetAt ?? null,
        dateLabel: sanitizePlainText(target.dateLabel),
        note: sanitizePlainText(target.note),
        sortOrder: target.sortOrder ?? (index + 1) * 10
      })),
      officialLinks: page.officialLinks.map((link, index) => ({
        id: `${page.slug}-link-${index}`,
        title: sanitizePlainText(link.title),
        linkType: sanitizePlainText(link.linkType),
        summary: sanitizePlainText(link.summary),
        href: normalizeRequiredContentHref(link.href),
        buttonLabel: sanitizeNullableText(link.buttonLabel),
        sortOrder: link.sortOrder ?? (index + 1) * 10
      })),
      articleSections: page.articleSections.map((section, index) => ({
        id: `${page.slug}-section-${index}`,
        title: sanitizePlainText(section.title),
        body: sanitizePlainText(section.body),
        sortOrder: section.sortOrder ?? (index + 1) * 10
      }))
    }))
  };
}

function normalizeFreeMaterialItemInput(
  item: SaveFreeMaterialItemDto,
  categoryKey: string,
  itemIndex: number,
  options: { requirePublishReady: boolean; countdownSlugs?: Set<string> }
) {
  const title = sanitizePlainText(item.title);
  const slug = sanitizeSlug(item.slug || `${categoryKey}-${title}`);
  const itemType = item.itemType;
  const downloadUrl = item.downloadUrl ? normalizeDownloadUrl(item.downloadUrl) : null;
  const mediaAssetId = sanitizeNullableText(item.mediaAssetId);
  const isDownload = isDownloadMaterialType(itemType);
  const href = isDownload ? null : item.href ? normalizeRequiredContentHref(item.href) : null;
  const requestedCountdownSlug = item.countdownPageSlug ? sanitizeSlug(item.countdownPageSlug) : null;
  const destination = resolveFreeMaterialDestination(
    {
      id: slug,
      slug,
      title,
      itemType,
      href,
      downloadUrl,
      mediaAssetId,
      countdownPageSlug: requestedCountdownSlug,
      opensInNewTab: item.opensInNewTab ?? false
    } satisfies MaterialDestinationItem,
    {
      countdownSlugs: options.countdownSlugs,
      allowAnySafeInternalRoute: !options.requirePublishReady
    }
  );

  if (options.requirePublishReady && !destination.ok) {
    throw new BadRequestException(destination.message);
  }

  return {
    id: slug,
    slug,
    title,
    itemType,
    badgeLabel: sanitizeNullableText(item.badgeLabel),
    summary: sanitizeNullableText(item.summary),
    href,
    buttonLabel: sanitizeNullableText(item.buttonLabel),
    iconKey: normalizeIconKey(item.iconKey, isDownload ? "pdf" : "link"),
    tone: normalizeTone(item.tone),
    coverImageUrl: normalizeOptionalContentUrl(item.coverImageUrl),
    downloadUrl,
    mediaAssetId,
    displayFilename: sanitizeNullableText(item.displayFilename),
    mimeType: sanitizeNullableText(item.mimeType),
    fileSizeBytes: item.fileSizeBytes ?? null,
    accessibilityLabel:
      sanitizeNullableText(item.accessibilityLabel) ??
      (isDownload ? `${title} dosyasını indir` : sanitizeNullableText(item.buttonLabel) ?? "İçeriği Aç"),
    opensInNewTab: isDownload ? false : item.opensInNewTab ?? false,
    sortOrder: item.sortOrder ?? (itemIndex + 1) * 10,
    isFeatured: item.isFeatured ?? false,
    publishStatus: item.publishStatus ?? ContentStatus.PUBLISHED,
    countdownPageSlug: destination.countdownSlug ?? requestedCountdownSlug
  };
}
function toNullableJsonInput(
  value?: Record<string, unknown> | null
): Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return Prisma.JsonNull;
  }

  return sanitizeJson(value) as Prisma.InputJsonValue;
}

async function recordWebsiteRevision(
  tx: TransactionClient,
  auth: AuthenticatedRequestContext,
  payload: {
    entityType: string;
    entityKey: string;
    action: string;
    version: number;
    summary: string;
    beforeData: unknown;
    afterData: unknown;
  }
) {
  await tx.websiteContentRevision.create({
    data: {
      scope: "global-website",
      entityType: payload.entityType,
      entityKey: payload.entityKey,
      action: payload.action,
      version: payload.version,
      summary: payload.summary,
      beforeData: payload.beforeData === null ? Prisma.JsonNull : (payload.beforeData as Prisma.InputJsonValue),
      afterData: payload.afterData as Prisma.InputJsonValue,
      createdByStaffUserId: auth.actorId ?? null
    }
  });
}

async function recordAuditLog(
  tx: TransactionClient,
  auth: AuthenticatedRequestContext,
  payload: {
    action: string;
    entityType: string;
    entityId: string;
    summary: string;
    beforeData?: unknown;
    afterData?: unknown;
    metadata?: unknown;
  }
) {
  if (!auth.actorId || (!auth.isSuperAdmin && !auth.permissionKeys.includes(PERMISSION_KEYS.websiteManage))) {
    return;
  }

  await tx.auditLog.create({
    data: {
      actorType: AuditActorType.STAFF_USER,
      staffUserId: auth.actorId,
      organizationId: auth.organizationId ?? null,
      branchId: auth.primaryBranchId ?? null,
      action: payload.action,
      entityType: payload.entityType,
      entityId: payload.entityId,
      summary: payload.summary,
      beforeData:
        payload.beforeData === undefined
          ? undefined
          : payload.beforeData === null
            ? Prisma.JsonNull
            : (payload.beforeData as Prisma.InputJsonValue),
      afterData:
        payload.afterData === undefined
          ? undefined
          : payload.afterData === null
            ? Prisma.JsonNull
            : (payload.afterData as Prisma.InputJsonValue),
      metadata:
        payload.metadata === undefined
          ? undefined
          : payload.metadata === null
            ? Prisma.JsonNull
            : (payload.metadata as Prisma.InputJsonValue)
    }
  });
}

function normalizeRevision(revision: WebsiteRevisionRecord) {
  return {
    id: revision.id,
    scope: revision.scope,
    entityType: revision.entityType,
    entityKey: revision.entityKey,
    version: revision.version,
    action: revision.action,
    summary: revision.summary,
    beforeData: revision.beforeData,
    afterData: revision.afterData,
    createdByStaffUserId: revision.createdByStaffUserId,
    createdAt: revision.createdAt.toISOString()
  };
}

function requireWebsiteAction(auth: AuthenticatedRequestContext, action: WebsiteSaveAction) {
  if (action === "publish") {
    requireWebsitePublish(auth);
    return;
  }

  requireWebsiteManage(auth);
}

function requireWebsiteRead(auth: AuthenticatedRequestContext) {
  if (auth.isSuperAdmin || auth.permissionKeys.includes(PERMISSION_KEYS.websiteRead)) {
    return;
  }

  throw new ForbiddenException(WEBSITE_FORBIDDEN_MESSAGE);
}

function requireWebsiteManage(auth: AuthenticatedRequestContext) {
  if (auth.isSuperAdmin || auth.permissionKeys.includes(PERMISSION_KEYS.websiteManage)) {
    return;
  }

  throw new ForbiddenException(WEBSITE_FORBIDDEN_MESSAGE);
}

function requireWebsitePublish(auth: AuthenticatedRequestContext) {
  if (auth.isSuperAdmin || auth.permissionKeys.includes(PERMISSION_KEYS.websitePublish)) {
    return;
  }

  throw new ForbiddenException(WEBSITE_FORBIDDEN_MESSAGE);
}

function assertCurrentVersion(payloadVersion: number | undefined, currentVersion: number | undefined) {
  if (payloadVersion && currentVersion && payloadVersion !== currentVersion) {
    throw new ConflictException(STALE_CONTENT_MESSAGE);
  }
}

function normalizeEditableLinks(
  value: unknown,
  requiredLinks: readonly { label: string; href: string }[]
) {
  const links = normalizeLinkList(value, requiredLinks);
  const byHref = new Map(links.map((link) => [link.href, link]));

  for (const required of requiredLinks) {
    byHref.set(required.href, required);
  }

  return Array.from(byHref.values()).map((link) => ({
    label: sanitizePlainText(link.label),
    href: normalizeRequiredContentHref(link.href)
  }));
}

function normalizeLinkList(
  value: unknown,
  fallback: readonly { label: string; href: string }[]
) {
  if (!Array.isArray(value)) {
    return [...fallback];
  }

  const links = value
    .map((item) => {
      if (!isRecord(item) || typeof item.label !== "string" || typeof item.href !== "string") {
        return null;
      }

      return {
        label: sanitizePlainText(item.label),
        href: normalizeRequiredContentHref(item.href)
      };
    })
    .filter((item): item is { label: string; href: string } => Boolean(item));

  return links.length > 0 ? links : [...fallback];
}

function normalizeRequiredAssetUrl(value: string | null | undefined, fallback: string) {
  return normalizeOptionalContentUrl(value) ?? fallback;
}

function normalizeOptionalContentUrl(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  return normalizeRequiredContentHref(trimmed);
}

function normalizeRequiredContentHref(value: string) {
  const trimmed = sanitizePlainText(value);

  if (!isSafeContentHref(trimmed)) {
    throw new BadRequestException(UNSAFE_URL_MESSAGE);
  }

  return trimmed;
}

function normalizeDownloadUrl(value: string) {
  const trimmed = sanitizePlainText(value);

  if (!/^https:\/\//i.test(trimmed) || !isSafeContentHref(trimmed)) {
    throw new BadRequestException(DOWNLOAD_URL_MESSAGE);
  }

  return trimmed;
}

function isSafeContentHref(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) {
    return !/[\u0000-\u001f]/.test(value);
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function sanitizePlainText(value: string) {
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<\/?[^>]+>/g, "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeNullableText(value: string | null | undefined) {
  const sanitized = value === null || value === undefined ? "" : sanitizePlainText(value);
  return sanitized || null;
}

function sanitizeSlug(value: string) {
  const sanitized = sanitizePlainText(value)
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!sanitized) {
    throw new BadRequestException("Geçerli bir slug girilmelidir.");
  }

  return sanitized;
}

function normalizeIconKey(value: string | null | undefined, fallback: string) {
  const key = sanitizeNullableText(value)?.toLowerCase().replace(/[^a-z0-9-]/g, "");
  const allowed = new Set([
    "pdf",
    "document",
    "worksheet",
    "spreadsheet",
    "archive",
    "link",
    "calculator",
    "countdown",
    "blog",
    "simulation"
  ]);

  return key && allowed.has(key) ? key : fallback;
}

function normalizeTone(value: string | null | undefined) {
  const tone = sanitizeNullableText(value)?.toLowerCase();
  const allowed = new Set(["amber", "blue", "teal", "violet", "green", "orange", "pink", "navy", "gold"]);
  return tone && allowed.has(tone) ? tone : "blue";
}

function sanitizeJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizeJson);
  }

  if (isRecord(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitizeJson(item)]));
  }

  if (typeof value === "string") {
    return sanitizePlainText(value);
  }

  return value;
}

function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getMaxVersion(records: readonly { version?: number | null }[]) {
  return Math.max(1, ...records.map((record) => record.version ?? 1));
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : value;
}

function buildWhatsappHref(number: string, message: string) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function revalidationMetadata(routes: string[], tags: string[]) {
  return {
    revalidateRoutes: routes,
    revalidateTags: tags
  };
}
