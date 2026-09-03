import { FreeMaterialItemType } from "@ega/db";

export const DOWNLOAD_FILE_REQUIRED_MESSAGE =
  "Bu materyali yayınlamak için indirilebilir bir dosya eklemelisiniz.";
export const COUNTDOWN_PAGE_REQUIRED_MESSAGE =
  "Bu materyali yayınlamak için geçerli bir geri sayım sayfası seçmelisiniz.";
export const INTERNAL_PAGE_MISSING_MESSAGE = "Bu materyalin site içi hedef sayfası bulunamadı.";
export const MATERIAL_TARGET_REQUIRED_MESSAGE =
  "Materyal kartı için güvenli bir hedef bağlantı veya dosya seçmelisiniz.";
export const EXTERNAL_LINK_HTTPS_MESSAGE = "Harici materyal bağlantısı HTTPS olmalıdır.";
export const DOWNLOAD_URL_HTTPS_MESSAGE = "İndirilebilir materyal bağlantısı HTTPS olmalıdır.";

export type MaterialDestinationMode =
  | "DOWNLOAD"
  | "INTERNAL_PAGE"
  | "EXTERNAL_LINK"
  | "COUNTDOWN"
  | "CALCULATOR"
  | "SIMULATION"
  | "SYSTEM_TOOL"
  | "BLOG";

export type MaterialDestinationFailureCode =
  | "MISSING_DOWNLOAD_SOURCE"
  | "INVALID_DOWNLOAD_URL"
  | "MISSING_COUNTDOWN_PAGE"
  | "UNKNOWN_INTERNAL_ROUTE"
  | "INVALID_EXTERNAL_LINK"
  | "MISSING_TARGET";

export type MaterialDestinationItem = {
  id?: string | null;
  slug?: string | null;
  title?: string | null;
  itemType: FreeMaterialItemType | string;
  href?: string | null;
  downloadUrl?: string | null;
  mediaAssetId?: string | null;
  countdownPageSlug?: string | null;
  countdownPage?: { slug?: string | null } | null;
  opensInNewTab?: boolean | null;
};

export type MaterialDestinationOptions = {
  downloadHref?: string | null;
  countdownSlugs?: Iterable<string> | null;
  registeredInternalRoutes?: Iterable<string> | null;
  allowAnySafeInternalRoute?: boolean;
};

export type MaterialDestinationResult =
  | {
      ok: true;
      mode: MaterialDestinationMode;
      href: string;
      downloadHref: string | null;
      opensInNewTab: boolean;
      countdownSlug: string | null;
    }
  | {
      ok: false;
      code: MaterialDestinationFailureCode;
      message: string;
      mode: MaterialDestinationMode | null;
      href: string | null;
      countdownSlug: string | null;
    };

const DOWNLOAD_ITEM_TYPES = new Set<string>([FreeMaterialItemType.DOWNLOAD, FreeMaterialItemType.PDF]);
const EXTERNAL_ITEM_TYPES = new Set<string>([FreeMaterialItemType.EXTERNAL, FreeMaterialItemType.EXTERNAL_LINK]);
const COUNTDOWN_ITEM_TYPES = new Set<string>([FreeMaterialItemType.COUNTDOWN, FreeMaterialItemType.TOOL]);
const CALCULATOR_ITEM_TYPES = new Set<string>([FreeMaterialItemType.CALCULATOR]);
const SIMULATION_ITEM_TYPES = new Set<string>([FreeMaterialItemType.SIMULATION]);
const SYSTEM_TOOL_ITEM_TYPES = new Set<string>([FreeMaterialItemType.SYSTEM_TOOL]);

export const REGISTERED_FREE_MATERIAL_INTERNAL_ROUTES = new Set<string>([
  "/ucretsiz-materyaller",
  "/ucretsiz-materyaller/blog",
  "/ucretsiz-materyaller/faydali-linkler",
  "/ucretsiz-materyaller/maarif-simulasyonlari",
  "/ucretsiz-materyaller/pdf-dokumanlar",
  "/ucretsiz-materyaller/puan-hesapla",
  "/ucretsiz-materyaller/puan-hesapla/lgs",
  "/ucretsiz-materyaller/puan-hesapla/tyt",
  "/ucretsiz-materyaller/puan-hesapla/ayt",
  "/ucretsiz-materyaller/puan-hesapla/ydt",
  "/ucretsiz-materyaller/puan-hesaplama",
  "/ucretsiz-materyaller/turkiye-geneli-deneme",
  "/ucretsiz-materyaller/yks-atlas",
  "/ucretsiz-materyaller/yks-kac-gun-kaldi",
  "/paketlerimiz",
  "/hakkimizda",
  "/akademik-kadro",
  "/basarilarimiz",
  "/giris"
]);

export function resolveFreeMaterialDestination(
  item: MaterialDestinationItem,
  options: MaterialDestinationOptions = {}
): MaterialDestinationResult {
  const itemType = String(item.itemType);
  const href = normalizeText(item.href);
  const downloadUrl = normalizeText(item.downloadUrl);
  const mediaAssetId = normalizeText(item.mediaAssetId);
  const countdownSlug = resolveCountdownSlug(item, href);
  const countdownSlugs = toSet(options.countdownSlugs);
  const registeredInternalRoutes = new Set([
    ...REGISTERED_FREE_MATERIAL_INTERNAL_ROUTES,
    ...(options.registeredInternalRoutes ? Array.from(options.registeredInternalRoutes) : [])
  ]);

  if (DOWNLOAD_ITEM_TYPES.has(itemType)) {
    if (!mediaAssetId && !downloadUrl) {
      return invalid("MISSING_DOWNLOAD_SOURCE", DOWNLOAD_FILE_REQUIRED_MESSAGE, "DOWNLOAD", null, countdownSlug);
    }

    if (downloadUrl && !isHttpsUrl(downloadUrl)) {
      return invalid("INVALID_DOWNLOAD_URL", DOWNLOAD_URL_HTTPS_MESSAGE, "DOWNLOAD", null, countdownSlug);
    }

    const stableIdentity = normalizeText(item.id) ?? normalizeText(item.slug);
    const downloadHref = options.downloadHref ?? (stableIdentity ? `/v1/public/free-materials/${stableIdentity}/download` : null);

    if (!downloadHref) {
      return invalid("MISSING_DOWNLOAD_SOURCE", DOWNLOAD_FILE_REQUIRED_MESSAGE, "DOWNLOAD", null, countdownSlug);
    }

    return valid("DOWNLOAD", downloadHref, downloadHref, false, null);
  }

  if (COUNTDOWN_ITEM_TYPES.has(itemType)) {
    if (!countdownSlug || (countdownSlugs && !countdownSlugs.has(countdownSlug))) {
      return invalid("MISSING_COUNTDOWN_PAGE", COUNTDOWN_PAGE_REQUIRED_MESSAGE, "COUNTDOWN", href, countdownSlug);
    }

    return valid("COUNTDOWN", `/ucretsiz-materyaller/${countdownSlug}`, null, false, countdownSlug);
  }

  if (CALCULATOR_ITEM_TYPES.has(itemType)) {
    return resolveRegisteredInternalDestination(item, href, "CALCULATOR", registeredInternalRoutes, options);
  }

  if (SIMULATION_ITEM_TYPES.has(itemType)) {
    return resolveRegisteredInternalDestination(item, href, "SIMULATION", registeredInternalRoutes, options);
  }

  if (SYSTEM_TOOL_ITEM_TYPES.has(itemType)) {
    return resolveRegisteredInternalDestination(item, href, "SYSTEM_TOOL", registeredInternalRoutes, options);
  }

  if (EXTERNAL_ITEM_TYPES.has(itemType)) {
    if (!href || !isHttpsUrl(href)) {
      return invalid("INVALID_EXTERNAL_LINK", EXTERNAL_LINK_HTTPS_MESSAGE, "EXTERNAL_LINK", href, null);
    }

    return valid("EXTERNAL_LINK", href, null, true, null);
  }

  if (!href) {
    return invalid("MISSING_TARGET", MATERIAL_TARGET_REQUIRED_MESSAGE, null, null, null);
  }

  if (isHttpsUrl(href)) {
    return valid(itemType === FreeMaterialItemType.BLOG ? "BLOG" : "EXTERNAL_LINK", href, null, true, null);
  }

  if (!isSafeInternalRoute(href)) {
    return invalid("UNKNOWN_INTERNAL_ROUTE", INTERNAL_PAGE_MISSING_MESSAGE, "INTERNAL_PAGE", href, null);
  }

  if (!isKnownInternalRoute(href, registeredInternalRoutes, countdownSlugs, options.allowAnySafeInternalRoute)) {
    return invalid("UNKNOWN_INTERNAL_ROUTE", INTERNAL_PAGE_MISSING_MESSAGE, "INTERNAL_PAGE", href, null);
  }

  return valid(
    itemType === FreeMaterialItemType.BLOG || itemType === FreeMaterialItemType.GUIDANCE ? "BLOG" : "INTERNAL_PAGE",
    href,
    null,
    false,
    null
  );
}

export function isDownloadMaterialType(itemType: FreeMaterialItemType | string) {
  return DOWNLOAD_ITEM_TYPES.has(String(itemType));
}

export function isSafeInternalRoute(value: string) {
  return value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") && !value.includes("://");
}

function resolveRegisteredInternalDestination(
  item: MaterialDestinationItem,
  href: string | null,
  mode: MaterialDestinationMode,
  registeredInternalRoutes: Set<string>,
  options: MaterialDestinationOptions
): MaterialDestinationResult {
  const fallbackHref = href ?? (item.slug ? `/ucretsiz-materyaller/${item.slug}` : null);

  if (!fallbackHref || !isSafeInternalRoute(fallbackHref)) {
    return invalid("UNKNOWN_INTERNAL_ROUTE", INTERNAL_PAGE_MISSING_MESSAGE, mode, fallbackHref, null);
  }

  if (!isKnownInternalRoute(fallbackHref, registeredInternalRoutes, toSet(options.countdownSlugs), options.allowAnySafeInternalRoute)) {
    return invalid("UNKNOWN_INTERNAL_ROUTE", INTERNAL_PAGE_MISSING_MESSAGE, mode, fallbackHref, null);
  }

  return valid(mode, fallbackHref, null, false, null);
}

function resolveCountdownSlug(item: MaterialDestinationItem, href: string | null) {
  const explicit = normalizeText(item.countdownPageSlug) ?? normalizeText(item.countdownPage?.slug);
  if (explicit) {
    return explicit;
  }

  const match = href?.match(/^\/ucretsiz-materyaller\/([a-z0-9-]+)$/);
  return match?.[1] ?? null;
}

function isKnownInternalRoute(
  href: string,
  registeredInternalRoutes: Set<string>,
  countdownSlugs: Set<string> | null,
  allowAnySafeInternalRoute = false
) {
  if (allowAnySafeInternalRoute || registeredInternalRoutes.has(href)) {
    return true;
  }

  const countdownMatch = href.match(/^\/ucretsiz-materyaller\/([a-z0-9-]+)$/);
  return Boolean(countdownMatch && countdownSlugs?.has(countdownMatch[1]));
}

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function toSet(values: Iterable<string> | null | undefined) {
  return values ? new Set(Array.from(values).filter(Boolean)) : null;
}

function valid(
  mode: MaterialDestinationMode,
  href: string,
  downloadHref: string | null,
  opensInNewTab: boolean,
  countdownSlug: string | null
): MaterialDestinationResult {
  return { ok: true, mode, href, downloadHref, opensInNewTab, countdownSlug };
}

function invalid(
  code: MaterialDestinationFailureCode,
  message: string,
  mode: MaterialDestinationMode | null,
  href: string | null,
  countdownSlug: string | null
): MaterialDestinationResult {
  return { ok: false, code, message, mode, href, countdownSlug };
}