import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { FreeMaterialItemType } from "@ega/db";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
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
    const menu = await this.publicContentRepository.getNavigationMenu(key);

    if (!menu) {
      throw new NotFoundException(`Navigation menu not found for key "${key}".`);
    }

    const nodeMap = new Map<string, NavigationNode>();
    const roots: NavigationNode[] = [];

    for (const item of menu.items) {
      nodeMap.set(item.id, {
        id: item.id,
        itemKey: item.itemKey,
        label: item.label,
        href: item.href,
        description: item.description,
        target: item.target,
        children: []
      });
    }

    for (const item of menu.items) {
      const node = nodeMap.get(item.id)!;

      if (item.parentId) {
        const parent = nodeMap.get(item.parentId);

        if (parent) {
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }
    }

    return {
      id: menu.id,
      key: menu.key,
      name: menu.name,
      location: menu.location,
      items: roots
    };
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
