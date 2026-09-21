import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException
} from "@nestjs/common";
import { appEnv } from "../config/env";
import { PublicContentRepository } from "../data-access/public-content.repository";
import { MediaService } from "../media/media.service";
import {
  resolveFreeMaterialDestination,
  type MaterialDestinationItem
} from "../free-materials/material-destination";
import { mergePreviewMarketingPage, mergePreviewSiteSettings } from "../preview/preview-content";
import { normalizeSitePresentation } from "../admin-content/site-presentation";
import { verifyPreviewToken } from "../preview/preview-token";

type NavigationNode = {
  id: string;
  itemKey: string;
  label: string;
  href: string;
  description: string | null;
  target: string | null;
  children: NavigationNode[];
};

type PublicNavigationSnapshot = {
  id: string | null;
  key: string;
  name: string;
  location: string;
  enabled: boolean;
  version: number;
  generatedAt: string;
  source: "database" | "fallback" | "disabled";
  catalogStatus: "ready" | "unavailable";
  items: NavigationNode[];
};

type NavigationBuildDiagnostic = {
  code: string;
  itemKey?: string;
};

type PackageNavigationCategory = Awaited<
  ReturnType<PublicContentRepository["listPackageNavigationCategories"]>
>[number];
type NavigationMenuRecord = NonNullable<
  Awaited<ReturnType<PublicContentRepository["getNavigationMenu"]>>
>;
type NavigationMenuItemRecord = NavigationMenuRecord["items"][number];

type PublicDownloadResult =
  | {
      kind: "local";
      filePath: string;
      filename: string;
      contentType?: string | null;
      contentLength?: number | null;
    }
  | {
      kind: "buffer";
      data: Buffer;
      filename: string;
      contentType?: string | null;
      contentLength?: number | null;
    };

const defaultPublicSiteSettings = {
  id: "",
  key: "default",
  siteName: "Eğitim Gurmesi Akademi",
  siteTitle: "EĞİTİM GURMESİ AKADEMİ",
  supportEmail: "bilgi@egitimgurmesi.com",
  supportPhone: "+90 531 855 38 27",
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
  whatsappMessage: "Merhaba, Eğitim Gurmesi Akademi hakkında bilgi almak istiyorum.",
  address: "Alacaatlı Mah. 4834. Sok. No: 10/8-59 Çankaya/Ankara",
  publicContactEmail: "bilgi@egitimgurmesi.com",
  footerBrandDescription:
    "Eğitim Gurmesi Akademi; kayıtlı video paketlerini, koçluk yönlendirme mantığını ve öğrenci hesap disiplinini tek çatı altında birleştiren yeni nesil bir eğitim satış platformu olarak kurgulanıyor.",
  footerQuickLinks: [
    { label: "Paketlerimiz", href: "/paketlerimiz" },
    { label: "Ücretsiz Materyaller", href: "/ucretsiz-materyaller" },
    { label: "Hakkımızda", href: "/hakkimizda" },
    { label: "Öğrenci Girişi", href: "/giris" }
  ],
  footerContactTitle: "İletişim",
  socialLinks: [] as Array<{ label: string; href: string }>,
  copyrightText: "© Eğitim Gurmesi Akademi. Tüm hakları saklıdır.",
  footerNotice: "Eğitim Gurmesi Akademi iletişim ve marka bilgileri.",
  navbarLogoHeight: null as number | null,
  showNavbarWordmark: true,
  fontFamily: null as string | null,
  headingFontFamily: null as string | null,
  headingScale: null as number | null,
  bodyScale: null as number | null,
  defaultSeoTitle: "Eğitim Gurmesi Akademi",
  defaultSeoDescription: "Video paketleri, koçluk programları ve ücretsiz öğrenci kaynakları.",
  version: 1,
  publishedAt: null as Date | null,
  updatedAt: null as Date | null,
  lastPublishedByStaffUserId: null as string | null
};

@Injectable()
export class PublicContentService {
  private readonly logger = new Logger(PublicContentService.name);

  constructor(
    private readonly publicContentRepository: PublicContentRepository,
    private readonly mediaService: MediaService
  ) {}

  /**
   * A valid preview token means the caller is an admin viewing unpublished
   * work. An absent or stale token is not an error: preview silently degrades
   * to the published site, so an expired link shows visitors the real thing
   * rather than a failure page.
   */
  private isPreviewRequest(previewToken?: string | null) {
    return verifyPreviewToken(previewToken, appEnv.authSecret()) !== null;
  }

  async getSiteSettings(key = "default", previewToken?: string | null) {
    const settings = await this.publicContentRepository.getSiteSetting(key);
    const base = settings ?? { ...defaultPublicSiteSettings, key };
    const draft = this.isPreviewRequest(previewToken)
      ? await this.publicContentRepository.getWebsiteDraft("SiteSetting", key)
      : null;
    const source = (
      draft ? mergePreviewSiteSettings(base as Record<string, unknown>, draft.data) : base
    ) as typeof base & { isPreview?: boolean };
    const logoPrimaryUrl = normalizePublicAssetUrl(
      source.logoPrimaryUrl,
      defaultPublicSiteSettings.logoPrimaryUrl
    );

    const whatsappNumber = source.supportWhatsappNumber || "905318553827";
    const whatsappMessage =
      source.whatsappMessage || "Merhaba, Eğitim Gurmesi Akademi hakkında bilgi almak istiyorum.";
    const canonicalPhone = source.canonicalPhone || "+905318553827";

    return {
      ...source,
      logoPrimaryUrl,
      logoCompactUrl: normalizePublicAssetUrl(source.logoCompactUrl, logoPrimaryUrl),
      logoMarkUrl: normalizePublicAssetUrl(source.logoMarkUrl, defaultPublicSiteSettings.logoMarkUrl),
      logoFooterUrl: normalizePublicAssetUrl(source.logoFooterUrl, defaultPublicSiteSettings.logoFooterUrl),
      logoDarkUrl: normalizePublicAssetUrl(source.logoDarkUrl, defaultPublicSiteSettings.logoDarkUrl),
      logoLightUrl: normalizePublicAssetUrl(source.logoLightUrl, defaultPublicSiteSettings.logoLightUrl),
      faviconUrl: normalizePublicAssetUrl(source.faviconUrl, defaultPublicSiteSettings.faviconUrl),
      defaultSocialImageUrl: normalizePublicAssetUrl(
        source.defaultSocialImageUrl,
        defaultPublicSiteSettings.defaultSocialImageUrl
      ),
      logoAltText: source.logoAltText || defaultPublicSiteSettings.logoAltText,
      displayPhone: source.displayPhone || "+90 531 855 38 27",
      canonicalPhone,
      telHref: `tel:${canonicalPhone}`,
      supportWhatsappNumber: whatsappNumber,
      whatsappHref: `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`,
      whatsappMessage,
      footerQuickLinks: normalizeJsonLinks(source.footerQuickLinks),
      socialLinks: normalizeJsonLinks(source.socialLinks),
      ...normalizeSitePresentation(source)
    };
  }

  async getNavigationMenu(key = "primary") {
    const generatedAt = new Date().toISOString();
    let menu: Awaited<ReturnType<PublicContentRepository["getNavigationMenu"]>>;

    try {
      menu = await this.publicContentRepository.getNavigationMenu(key);
    } catch (error) {
      this.logger.error(
        `Public navigation menu query failed for key "${safeLogValue(key)}": ${getErrorMessage(error)}`
      );
      throw new ServiceUnavailableException("Ana menü geçici olarak yüklenemedi.");
    }

    if (!menu) {
      this.logger.warn(`Public navigation menu missing for key "${safeLogValue(key)}".`);
      return this.fallbackWithCatalog(key, generatedAt);
    }

    if (!menu.isActive) {
      return createDisabledNavigationSnapshot(menu, generatedAt);
    }

    const builtNavigation = buildNavigationTree(menu.items);
    logNavigationDiagnostics(this.logger, builtNavigation.diagnostics);
    const categoryLoad = await this.loadPackageNavigationCategories(key);
    const composed = attachCatalogPackageNavigation(builtNavigation.roots, categoryLoad.categories);
    // One bad row used to discard the whole menu and serve the hardcoded
    // fallback, which has no dropdowns at all — the site silently lost its
    // Paketlerimiz menu. Now only the offending entries are dropped and logged.
    const pruned = pruneNavigationSnapshotItems(composed);

    for (const problem of pruned.problems) {
      this.logger.warn(`Public navigation for key "${safeLogValue(key)}": dropped ${problem}.`);
    }

    if (!pruned.items.length) {
      this.logger.warn(
        `Public navigation for key "${safeLogValue(key)}" has no valid top-level items. Returning safe fallback.`
      );
      return this.fallbackWithCatalog(key, generatedAt);
    }

    const items = pruned.items;

    return {
      id: menu.id,
      key: menu.key,
      name: menu.name,
      location: menu.location,
      enabled: true,
      version: menu.version,
      generatedAt,
      source: "database",
      catalogStatus: categoryLoad.catalogStatus,
      items
    } satisfies PublicNavigationSnapshot;
  }

  /**
   * The hardcoded menu, still with the Paketlerimiz dropdown from the catalog.
   * Production served this fallback with every dropdown empty, which is how
   * the hover menu disappeared: the fallback never looked at the catalog.
   */
  private async fallbackWithCatalog(key: string, generatedAt: string): Promise<PublicNavigationSnapshot> {
    const fallback = createSafeNavigationFallbackSnapshot(key, generatedAt);
    const categoryLoad = await this.loadPackageNavigationCategories(key);
    const items = pruneNavigationSnapshotItems(
      attachCatalogPackageNavigation(fallback.items, categoryLoad.categories)
    ).items;

    return {
      ...fallback,
      catalogStatus: categoryLoad.catalogStatus,
      items: items.length ? items : fallback.items
    };
  }

  private async loadPackageNavigationCategories(key: string) {
    try {
      return {
        categories: await this.publicContentRepository.listPackageNavigationCategories(),
        catalogStatus: "ready" as const
      };
    } catch (error) {
      this.logger.warn(
        `Package category navigation composition failed for key "${safeLogValue(key)}": ${getErrorMessage(error)}`
      );
      return {
        categories: [] as PackageNavigationCategory[],
        catalogStatus: "unavailable" as const
      };
    }
  }

  async getMarketingPage(slug: string, previewToken?: string | null) {
    if (this.isPreviewRequest(previewToken)) {
      const page = await this.publicContentRepository.getMarketingPageBySlugForPreview(slug);

      if (!page) {
        throw new NotFoundException(`Marketing page not found for slug "${slug}".`);
      }

      const draft = await this.publicContentRepository.getWebsiteDraft("MarketingPage", page.key);

      return draft
        ? mergePreviewMarketingPage(page as unknown as Record<string, unknown>, draft.data)
        : { ...page, isPreview: true };
    }

    const page = await this.publicContentRepository.getMarketingPageBySlug(slug);

    if (!page) {
      throw new NotFoundException(`Marketing page not found for slug "${slug}".`);
    }

    return page;
  }

  listStaffProfileGroups() {
    return this.publicContentRepository.listStaffProfileGroups();
  }

  listSuccessStories() {
    return this.publicContentRepository.listSuccessStories();
  }

  async listFreeMaterials() {
    const categories = await this.publicContentRepository.listFreeMaterialCategories();
    const publishedCountdownSlugs = new Set(
      categories
        .flatMap((category) => category.items.map((item) => item.countdownPage?.slug))
        .filter((slug): slug is string => Boolean(slug))
    );

    return categories.map((category) => ({
      id: category.id,
      key: category.key,
      label: category.label,
      description: category.description,
      sortOrder: category.sortOrder,
      items: category.items.flatMap((item) => {
        const destination = resolveFreeMaterialDestination(item as MaterialDestinationItem, {
          downloadHref: `/v1/public/free-materials/${item.id}/download`,
          countdownSlugs: publishedCountdownSlugs,
          allowAnySafeInternalRoute: false
        });

        if (!destination.ok) {
          this.logger.warn(
            JSON.stringify({
              event: "invalid_published_free_material_destination",
              itemId: item.id,
              slug: item.slug,
              itemType: item.itemType,
              route: item.href,
              errorCategory: destination.code
            })
          );
          return [];
        }

        const isDownload = destination.mode === "DOWNLOAD";

        return [
          {
            id: item.id,
            slug: item.slug,
            title: item.title,
            itemType: item.itemType,
            destinationMode: destination.mode,
            badgeLabel: item.badgeLabel,
            summary: item.summary,
            href: destination.href,
            downloadHref: destination.downloadHref,
            buttonLabel: item.buttonLabel,
            iconKey: item.iconKey,
            tone: item.tone,
            coverImageUrl: item.coverImageUrl,
            displayFilename: item.displayFilename,
            mimeType: item.mimeType,
            fileSizeBytes: item.fileSizeBytes,
            accessibilityLabel:
              item.accessibilityLabel ??
              (isDownload ? `${item.title} dosyas\u0131n\u0131 indir` : item.buttonLabel ?? "\u0130\u00e7eri\u011fi A\u00e7"),
            opensInNewTab: destination.opensInNewTab,
            sortOrder: item.sortOrder,
            isFeatured: item.isFeatured,
            countdownPage: item.countdownPage
          }
        ];
      })
    }));
  }

  async getCountdownPage(slug: string) {
    const page = await this.publicContentRepository.getCountdownPageBySlug(slug);

    if (!page) {
      throw new NotFoundException(`Countdown page not found for slug "${slug}".`);
    }

    return page;
  }

  async resolveFreeMaterialDownload(itemIdOrSlug: string): Promise<PublicDownloadResult> {
    const item = await this.publicContentRepository.getPublishedDownloadMaterialItem(itemIdOrSlug);

    if (!item) {
      throw new NotFoundException("İndirilebilir materyal bulunamadı.");
    }

    const destination = resolveFreeMaterialDestination(item as MaterialDestinationItem, {
      downloadHref: `/v1/public/free-materials/${item.id}/download`,
      allowAnySafeInternalRoute: false
    });

    if (!destination.ok || destination.mode !== "DOWNLOAD") {
      this.logger.warn(
        `Invalid public download request for item "${safeLogValue(item.id)}" (${safeLogValue(item.slug ?? "")}): ${destination.ok ? "wrong_mode" : destination.code}.`
      );
      if (!destination.ok && destination.code === "INVALID_DOWNLOAD_URL") {
        throw new BadRequestException(destination.message);
      }
      throw new NotFoundException("İndirilebilir materyal dosyası tanımlı değil.");
    }

    if (item.mediaAssetId) {
      const asset = await this.mediaService.getAsset(item.mediaAssetId);

      if (asset.sourceType === "LOCAL_UPLOAD") {
        const { filePath } = await this.mediaService.getLocalAssetFile(item.mediaAssetId);
        return {
          kind: "local",
          filePath,
          filename: sanitizeDownloadFilename(
            item.displayFilename || asset.originalFileName || item.title,
            asset.mimeType || item.mimeType
          ),
          contentType: asset.mimeType || item.mimeType,
          contentLength: asset.sizeBytes || item.fileSizeBytes
        };
      }

      const assetUrl = asset.externalUrl || asset.publicUrl;

      if (!assetUrl) {
        throw new NotFoundException("Medya kütüphanesi dosya adresi tanımlı değil.");
      }

      return fetchRemoteDownload(assetUrl, {
        filename: item.displayFilename || asset.originalFileName || asset.title || item.title,
        contentType: asset.mimeType || item.mimeType,
        sizeBytes: asset.sizeBytes || item.fileSizeBytes
      });
    }

    if (!item.downloadUrl) {
      throw new NotFoundException("İndirilebilir materyal dosyası tanımlı değil.");
    }

    return fetchRemoteDownload(item.downloadUrl, {
      filename: item.displayFilename || filenameFromUrl(item.downloadUrl) || item.title,
      contentType: item.mimeType,
      sizeBytes: item.fileSizeBytes
    });
  }
}

async function fetchRemoteDownload(
  sourceUrl: string,
  fallback: { filename: string; contentType?: string | null; sizeBytes?: number | null }
): Promise<PublicDownloadResult> {
  const url = await validatePublicDownloadUrl(sourceUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "error"
    });

    if (!response.ok) {
      throw new BadRequestException("İndirilebilir materyal kaynağına ulaşılamadı.");
    }

    const contentLength = Number(response.headers.get("content-length") ?? fallback.sizeBytes ?? "0");
    const maxBytes = appEnv.mediaMaxUploadBytes();

    if (contentLength > maxBytes) {
      throw new BadRequestException("İndirilebilir materyal izin verilen dosya boyutunu aşıyor.");
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    if (buffer.byteLength > maxBytes) {
      throw new BadRequestException("İndirilebilir materyal izin verilen dosya boyutunu aşıyor.");
    }

    return {
      kind: "buffer",
      data: buffer,
      filename: sanitizeDownloadFilename(
        fallback.filename || filenameFromUrl(url) || "materyal",
        response.headers.get("content-type") || fallback.contentType
      ),
      contentType: response.headers.get("content-type") || fallback.contentType || "application/octet-stream",
      contentLength: buffer.byteLength
    };
  } catch (error) {
    if (error instanceof BadRequestException) {
      throw error;
    }

    throw new ServiceUnavailableException("İndirilebilir materyal şu anda yüklenemiyor.");
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeJsonLinks(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const link = item as { label?: unknown; href?: unknown };
      return typeof link.label === "string" && typeof link.href === "string"
        ? { label: link.label, href: link.href }
        : null;
    })
    .filter((item): item is { label: string; href: string } => Boolean(item));
}

function normalizePublicAssetUrl(value: string | null | undefined, fallback: string) {
  const normalized = value?.trim();

  if (!normalized || !isSafePublicAssetUrl(normalized)) {
    return fallback;
  }

  return normalized;
}

function isSafePublicAssetUrl(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) {
    return !/[\u0000-\u001f]/.test(value);
  }

  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

const safeFallbackNavigationItems: NavigationNode[] = [
  {
    id: "fallback:packages",
    itemKey: "packages",
    label: "Paketlerimiz",
    href: "/paketlerimiz",
    description: null,
    target: null,
    children: []
  },
  {
    id: "fallback:coaches",
    itemKey: "coaches",
    label: "Akademik Kadro",
    href: "/akademik-kadro",
    description: null,
    target: null,
    children: []
  },
  {
    id: "fallback:success-stories",
    itemKey: "success-stories",
    label: "Başarılarımız",
    href: "/basarilarimiz",
    description: null,
    target: null,
    children: []
  },
  {
    id: "fallback:free-materials",
    itemKey: "free-materials",
    label: "Ücretsiz Materyaller",
    href: "/ucretsiz-materyaller",
    description: null,
    target: null,
    children: []
  },
  {
    id: "fallback:about",
    itemKey: "about",
    label: "Hakkımızda",
    href: "/hakkimizda",
    description: null,
    target: null,
    children: []
  }
];

function createSafeNavigationFallbackSnapshot(
  key: string,
  generatedAt: string
): PublicNavigationSnapshot {
  return {
    id: null,
    key,
    name: key === "primary" ? "Ana Menü" : key,
    location: key === "primary" ? "PRIMARY" : key.toUpperCase(),
    enabled: true,
    version: 1,
    generatedAt,
    source: "fallback",
    catalogStatus: "unavailable",
    items: cloneNavigationNodes(safeFallbackNavigationItems)
  };
}

function createDisabledNavigationSnapshot(
  menu: Pick<NavigationMenuRecord, "id" | "key" | "name" | "location" | "version">,
  generatedAt: string
): PublicNavigationSnapshot {
  return {
    id: menu.id,
    key: menu.key,
    name: menu.name,
    location: menu.location,
    enabled: false,
    version: menu.version,
    generatedAt,
    source: "disabled",
    catalogStatus: "unavailable",
    items: []
  };
}

function buildNavigationTree(items: readonly NavigationMenuItemRecord[]) {
  const nodeMap = new Map<string, NavigationNode>();
  const sourceById = new Map<string, NavigationMenuItemRecord>();
  const seenItemKeys = new Set<string>();
  const diagnostics: NavigationBuildDiagnostic[] = [];

  for (const item of items) {
    const normalized = normalizeNavigationMenuItem(item);
    if (!normalized) {
      diagnostics.push({ code: "invalid-navigation-item", itemKey: item.itemKey });
      continue;
    }

    if (seenItemKeys.has(normalized.itemKey)) {
      diagnostics.push({ code: "duplicate-item-key", itemKey: normalized.itemKey });
      continue;
    }

    seenItemKeys.add(normalized.itemKey);
    nodeMap.set(item.id, normalized);
    sourceById.set(item.id, item);
  }

  const roots: NavigationNode[] = [];

  for (const [id, node] of nodeMap.entries()) {
    const source = sourceById.get(id);
    if (!source) {
      continue;
    }

    if (!source.parentId) {
      roots.push(node);
      continue;
    }

    const parent = nodeMap.get(source.parentId);
    if (!parent) {
      diagnostics.push({ code: "orphan-navigation-item", itemKey: node.itemKey });
      continue;
    }

    parent.children.push(node);
  }

  return { roots, diagnostics };
}

function normalizeNavigationMenuItem(item: NavigationMenuItemRecord): NavigationNode | null {
  const itemKey = item.itemKey.trim();
  const label = item.label.trim();
  const href = item.href.trim();

  if (!itemKey || !label || !isSafeContentHref(href)) {
    return null;
  }

  return {
    id: item.id,
    itemKey,
    label,
    href,
    description: item.description,
    target: item.target,
    children: []
  };
}

/**
 * Returns the menu with every invalid entry removed, plus a description of each
 * removal for the log. A node is dropped (with its subtree) when it is nested
 * too deep, has an empty key or label, an unsafe href, a key already used
 * elsewhere in the menu, or a catalog key ("packages-…") outside Paketlerimiz.
 */
function pruneNavigationSnapshotItems(items: readonly NavigationNode[]) {
  const seenItemKeys = new Set<string>();
  const problems: string[] = [];
  const pruned = pruneNavigationLevel(items, seenItemKeys, problems, 0, false);

  return { items: pruned, problems };
}

function pruneNavigationLevel(
  nodes: readonly NavigationNode[],
  seenItemKeys: Set<string>,
  problems: string[],
  depth: number,
  isInsidePackagesTree: boolean
): NavigationNode[] {
  const kept: NavigationNode[] = [];

  for (const node of nodes) {
    const problem = describeInvalidNavigationNode(node, seenItemKeys, depth, isInsidePackagesTree);

    if (problem) {
      problems.push(problem);
      continue;
    }

    seenItemKeys.add(node.itemKey);
    const childIsInsidePackagesTree = isInsidePackagesTree || isPackagesNavigationNode(node);
    kept.push({
      ...node,
      children: pruneNavigationLevel(
        Array.isArray(node.children) ? node.children : [],
        seenItemKeys,
        problems,
        depth + 1,
        childIsInsidePackagesTree
      )
    });
  }

  return kept;
}

function describeInvalidNavigationNode(
  node: NavigationNode,
  seenItemKeys: Set<string>,
  depth: number,
  isInsidePackagesTree: boolean
): string {
  const key = safeLogValue(node.itemKey ?? "");

  if (depth > 2) {
    return `"${key}" (nested deeper than the menu supports)`;
  }

  if (!node.itemKey?.trim()) {
    return "an item with an empty key";
  }

  if (seenItemKeys.has(node.itemKey)) {
    return `"${key}" (duplicate key)`;
  }

  if (!node.label?.trim()) {
    return `"${key}" (empty label)`;
  }

  if (!isSafeContentHref(node.href)) {
    return `"${key}" (unsafe href)`;
  }

  if (node.itemKey.startsWith("packages-") && !isInsidePackagesTree) {
    return `"${key}" (catalog key outside Paketlerimiz)`;
  }

  return "";
}

function cloneNavigationNodes(items: readonly NavigationNode[]): NavigationNode[] {
  return items.map((item) => ({
    ...item,
    children: cloneNavigationNodes(item.children)
  }));
}

function logNavigationDiagnostics(logger: Logger, diagnostics: readonly NavigationBuildDiagnostic[]) {
  for (const diagnostic of diagnostics) {
    logger.warn(
      `Public navigation diagnostic: ${diagnostic.code}${diagnostic.itemKey ? ` (${safeLogValue(diagnostic.itemKey)})` : ""}.`
    );
  }
}

/**
 * Paketlerimiz's dropdown comes from the catalog's active categories. When the
 * catalog has none to offer (none active yet, or the query failed), the
 * sub-items authored in the menu editor are kept rather than replaced with an
 * empty list — an empty list is what turned the dropdown off. Legacy
 * "packages-…" rows (copies of old catalog categories) are still dropped.
 */
function attachCatalogPackageNavigation(
  roots: NavigationNode[],
  categories: PackageNavigationCategory[]
) {
  const packageChildren = sortPackageNavigationCategories(categories).map(normalizePackageNavigationRoot);

  return roots.map((root) => {
    if (!isPackagesNavigationNode(root)) {
      return root;
    }

    if (packageChildren.length) {
      return { ...root, children: packageChildren };
    }

    // "packages-…" rows are legacy mirrors of old catalog categories and would
    // link to categories that no longer exist; everything else was authored.
    return {
      ...root,
      children: root.children.filter((child) => !child.itemKey.startsWith("packages-"))
    };
  });
}

function normalizePackageNavigationRoot(category: PackageNavigationCategory): NavigationNode {
  const rootHref = normalizeCategoryHref(
    category.ctaHref,
    `/paketlerimiz?kategori=${encodeURIComponent(category.slug)}`
  );

  return {
    id: `catalog-root:${category.id}`,
    itemKey: `packages-${category.slug}`,
    label: category.name,
    href: rootHref,
    description: category.description,
    target: isExternalHttpsHref(rootHref) ? "_blank" : null,
    children: sortPackageNavigationCategories(category.childCategories).map((child) =>
      normalizePackageNavigationChild(category, child)
    )
  };
}

function sortPackageNavigationCategories<
  T extends { sortOrder: number; createdAt: Date }
>(categories: readonly T[]) {
  return [...categories].sort(
    (left, right) => left.sortOrder - right.sortOrder || left.createdAt.getTime() - right.createdAt.getTime()
  );
}

function normalizePackageNavigationChild(
  root: PackageNavigationCategory,
  child: PackageNavigationCategory["childCategories"][number]
): NavigationNode {
  const subcategoryId = extractSubcategoryFilterId(child) ?? child.slug;
  const childHref = normalizeCategoryHref(
    child.ctaHref,
    `/paketlerimiz?kategori=${encodeURIComponent(root.slug)}&alt=${encodeURIComponent(
      subcategoryId
    )}`
  );

  return {
    id: `catalog-child:${child.id}`,
    itemKey: `packages-${root.slug}-${subcategoryId}`,
    label: child.name,
    href: childHref,
    description: child.description,
    target: isExternalHttpsHref(childHref) ? "_blank" : null,
    children: []
  };
}

function isPackagesNavigationNode(node: NavigationNode) {
  return node.itemKey === "packages" || normalizePathname(node.href) === "/paketlerimiz";
}

function normalizeCategoryHref(value: string | null | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed && isSafeContentHref(trimmed) ? trimmed : fallback;
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

function isExternalHttpsHref(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function normalizePathname(value: string) {
  try {
    return new URL(value, "https://egitimgurmesi.com").pathname.replace(/\/+$/, "") || "/";
  } catch {
    return value.split("?")[0].replace(/\/+$/, "") || "/";
  }
}

function extractSubcategoryFilterId(category: { ctaHref: string | null; slug: string }) {
  if (!category.ctaHref) {
    return null;
  }

  const search = category.ctaHref.includes("?")
    ? category.ctaHref.slice(category.ctaHref.indexOf("?") + 1)
    : "";
  const params = new URLSearchParams(search);

  return params.get("alt");
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "unknown error";
}

function safeLogValue(value: string) {
  return value.replace(/[^\w./:-]/g, "").slice(0, 80);
}

async function validatePublicDownloadUrl(value: string) {
  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new BadRequestException("İndirilebilir materyal bağlantısı geçerli değil.");
  }

  if (parsed.protocol !== "https:") {
    throw new BadRequestException("İndirilebilir materyal bağlantısı HTTPS olmalıdır.");
  }

  if (isUnsafeHostname(parsed.hostname)) {
    throw new BadRequestException("İndirilebilir materyal bağlantısı güvenli değil.");
  }

  let addresses: Array<{ address: string }>;

  try {
    addresses = await lookup(parsed.hostname, { all: true, verbatim: true });
  } catch {
    throw new BadRequestException("İndirilebilir materyal bağlantısı doğrulanamadı.");
  }

  if (addresses.some((address) => isPrivateAddress(address.address))) {
    throw new BadRequestException("İndirilebilir materyal bağlantısı güvenli değil.");
  }

  return parsed.toString();
}

function isUnsafeHostname(hostname: string) {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".internal")
  );
}

function isPrivateAddress(address: string) {
  if (address.includes(":")) {
    const normalized = address.toLowerCase();
    return (
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe80:")
    );
  }

  if (!isIP(address)) {
    return true;
  }

  const octets = address.split(".").map((part) => Number(part));
  const [first, second] = octets;

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

function sanitizeDownloadFilename(value: string, contentType?: string | null) {
  const extension = extensionForContentType(contentType);
  const cleaned = value
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);

  if (!cleaned) {
    return `materyal${extension}`;
  }

  return /\.[a-z0-9]{2,8}$/i.test(cleaned) ? cleaned : `${cleaned}${extension}`;
}

function extensionForContentType(contentType?: string | null) {
  if (!contentType) {
    return "";
  }

  if (contentType.includes("pdf")) {
    return ".pdf";
  }

  if (contentType.includes("spreadsheet") || contentType.includes("excel")) {
    return ".xlsx";
  }

  if (contentType.includes("zip")) {
    return ".zip";
  }

  if (contentType.includes("word") || contentType.includes("document")) {
    return ".docx";
  }

  return "";
}

function filenameFromUrl(value: string) {
  try {
    const parsed = new URL(value);
    const lastSegment = parsed.pathname.split("/").filter(Boolean).at(-1);
    return lastSegment ? decodeURIComponent(lastSegment) : null;
  } catch {
    return null;
  }
}
