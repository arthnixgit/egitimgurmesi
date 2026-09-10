import { isSafePublicAssetUrl } from "./contact";

export type BrandLogoRenderMode = "next-image" | "native-image";

/**
 * CMS branding can be hosted on any validated HTTPS media origin. These URLs
 * must bypass Next's static external-image allowlist.
 */
export function isRemoteCmsBrandAsset(value: string | null | undefined) {
  if (!value || !isSafePublicAssetUrl(value)) {
    return false;
  }

  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function resolveBrandLogoSource(
  value: string | null | undefined,
  fallback: string
) {
  return value && isSafePublicAssetUrl(value) ? value : fallback;
}

export function getBrandLogoRenderMode(value: string): BrandLogoRenderMode {
  return isRemoteCmsBrandAsset(value) ? "native-image" : "next-image";
}
