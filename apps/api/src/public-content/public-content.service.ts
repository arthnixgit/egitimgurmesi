import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { FreeMaterialItemType } from "@ega/db";
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

@Injectable()
export class PublicContentService {
  private readonly logger = new Logger(PublicContentService.name);

  constructor(
    private readonly publicContentRepository: PublicContentRepository,
    private readonly mediaService: MediaService
  ) {}

  async getSiteSettings(key = "default") {
    const settings = await this.publicContentRepository.getSiteSetting(key);

    if (!settings) {
      throw new NotFoundException(`Site settings not found for key "${key}".`);
    }

    const whatsappNumber = settings.supportWhatsappNumber || "905318553827";
    const whatsappMessage =
      settings.whatsappMessage || "Merhaba, Eğitim Gurmesi Akademi hakkında bilgi almak istiyorum.";
    const canonicalPhone = settings.canonicalPhone || "+905318553827";

    return {
      ...settings,
      displayPhone: settings.displayPhone || "+90 531 855 38 27",
      canonicalPhone,
      telHref: `tel:${canonicalPhone}`,
      supportWhatsappNumber: whatsappNumber,
      whatsappHref: `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`,
      whatsappMessage,
      footerQuickLinks: normalizeJsonLinks(settings.footerQuickLinks),
      socialLinks: normalizeJsonLinks(settings.socialLinks)
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
      return createSafeNavigationFallbackSnapshot(key, generatedAt);
    }

    if (!menu.isActive) {
      return createDisabledNavigationSnapshot(menu, generatedAt);
    }

    const builtNavigation = buildNavigationTree(menu.items);
    logNavigationDiagnostics(this.logger, builtNavigation.diagnostics);
    const categoryLoad = await this.loadPackageNavigationCategories(key);
    const items = attachCatalogPackageNavigation(builtNavigation.roots, categoryLoad.categories);
    const validation = validateNavigationSnapshotItems(items);

    if (validation) {
      this.logger.warn(
        `Public navigation for key "${safeLogValue(key)}" is invalid: ${validation}. Returning safe fallback.`
      );
      return createSafeNavigationFallbackSnapshot(key, generatedAt);
    }

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

  async getMarketingPage(slug: string) {
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

    return categories.map((category) => ({
      id: category.id,
      key: category.key,
      label: category.label,
      description: category.description,
      sortOrder: category.sortOrder,
      items: category.items.map((item) => {
        const isDownload =
          item.itemType === FreeMaterialItemType.PDF ||
          item.itemType === FreeMaterialItemType.DOWNLOAD;
        const downloadHref = isDownload ? `/v1/public/free-materials/${item.id}/download` : null;

        return {
          id: item.id,
          slug: item.slug,
          title: item.title,
          itemType: item.itemType,
          badgeLabel: item.badgeLabel,
          summary: item.summary,
          href: downloadHref ?? item.href,
          downloadHref,
          buttonLabel: item.buttonLabel,
          iconKey: item.iconKey,
          tone: item.tone,
          coverImageUrl: item.coverImageUrl,
          displayFilename: item.displayFilename,
          mimeType: item.mimeType,
          fileSizeBytes: item.fileSizeBytes,
          accessibilityLabel:
            item.accessibilityLabel ??
            (isDownload ? `${item.title} dosyasını indir` : item.buttonLabel ?? "İçeriği Aç"),
          opensInNewTab: isDownload ? false : item.opensInNewTab,
          sortOrder: item.sortOrder,
          isFeatured: item.isFeatured,
          countdownPage: item.countdownPage
        };
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

function validateNavigationSnapshotItems(items: readonly NavigationNode[]) {
  if (!items.length) {
    return "active navigation has zero valid top-level items";
  }

  const seenItemKeys = new Set<string>();

  for (const item of items) {
    const invalid = validateNavigationNode(item, seenItemKeys, 0, false);
    if (invalid) {
      return invalid;
    }
  }

  return "";
}

function validateNavigationNode(
  node: NavigationNode,
  seenItemKeys: Set<string>,
  depth: number,
  isInsidePackagesTree: boolean
): string {
  if (depth > 2) {
    return "navigation depth exceeds supported maximum";
  }

  if (!node.itemKey.trim()) {
    return "navigation item has empty itemKey";
  }

  if (seenItemKeys.has(node.itemKey)) {
    return `duplicate itemKey "${safeLogValue(node.itemKey)}"`;
  }
  seenItemKeys.add(node.itemKey);

  if (!node.label.trim()) {
    return `navigation item "${safeLogValue(node.itemKey)}" has empty label`;
  }

  if (!isSafeContentHref(node.href)) {
    return `navigation item "${safeLogValue(node.itemKey)}" has unsafe href`;
  }

  if (!Array.isArray(node.children)) {
    return `navigation item "${safeLogValue(node.itemKey)}" has invalid children`;
  }

  if (node.itemKey.startsWith("packages-") && !isInsidePackagesTree) {
    return `package child "${safeLogValue(node.itemKey)}" is not attached to Paketlerimiz`;
  }

  const childIsInsidePackagesTree = isInsidePackagesTree || isPackagesNavigationNode(node);

  for (const child of node.children) {
    const invalid = validateNavigationNode(child, seenItemKeys, depth + 1, childIsInsidePackagesTree);
    if (invalid) {
      return invalid;
    }
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

function attachCatalogPackageNavigation(
  roots: NavigationNode[],
  categories: PackageNavigationCategory[]
) {
  const packageChildren = sortPackageNavigationCategories(categories).map(normalizePackageNavigationRoot);

  return roots.map((root) =>
    isPackagesNavigationNode(root)
      ? {
          ...root,
          children: packageChildren
        }
      : root
  );
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
