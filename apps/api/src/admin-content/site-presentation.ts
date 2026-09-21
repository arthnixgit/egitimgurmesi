/**
 * Server-side validation for the site presentation settings (navbar logo size,
 * wordmark, typography).
 *
 * Mirrors packages/ui/src/site-presentation.ts, which the admin and public site
 * use. The API does not depend on @ega/ui (it ships TypeScript source, the API
 * compiles to CommonJS), so the ranges and the font list live here too; both
 * sides pin the list in a spec so they cannot drift silently.
 */

export const NAVBAR_LOGO_HEIGHT_MIN = 32;
export const NAVBAR_LOGO_HEIGHT_MAX = 96;
export const TEXT_SCALE_MIN = 85;
export const TEXT_SCALE_MAX = 130;

export const SITE_FONT_KEYS = [
  "default",
  "inter",
  "nunito",
  "montserrat",
  "source-sans-3",
  "lora",
  "playfair-display"
] as const;

function toInteger(value: unknown): number | null {
  const numeric = typeof value === "string" && value.trim() ? Number(value) : value;

  return typeof numeric === "number" && Number.isFinite(numeric) ? Math.round(numeric) : null;
}

function clampOrNull(value: unknown, min: number, max: number) {
  const integer = toInteger(value);

  return integer === null ? null : Math.min(max, Math.max(min, integer));
}

export function normalizeNavbarLogoHeight(value: unknown) {
  return clampOrNull(value, NAVBAR_LOGO_HEIGHT_MIN, NAVBAR_LOGO_HEIGHT_MAX);
}

/** 100% is stored as null so "back to default" leaves no trace in the row. */
export function normalizeTextScale(value: unknown) {
  const scale = clampOrNull(value, TEXT_SCALE_MIN, TEXT_SCALE_MAX);

  return scale === 100 ? null : scale;
}

export function normalizeSiteFontKey(value: unknown): string | null {
  if (typeof value !== "string" || value === "default") {
    return null;
  }

  return (SITE_FONT_KEYS as readonly string[]).includes(value) ? value : null;
}

export type SitePresentationFields = {
  navbarLogoHeight: number | null;
  showNavbarWordmark: boolean;
  fontFamily: string | null;
  headingFontFamily: string | null;
  headingScale: number | null;
  bodyScale: number | null;
};

export function normalizeSitePresentation(source: {
  navbarLogoHeight?: unknown;
  showNavbarWordmark?: unknown;
  fontFamily?: unknown;
  headingFontFamily?: unknown;
  headingScale?: unknown;
  bodyScale?: unknown;
}): SitePresentationFields {
  return {
    navbarLogoHeight: normalizeNavbarLogoHeight(source.navbarLogoHeight),
    // Only an explicit false hides it: absent means "as before", which showed it.
    showNavbarWordmark: source.showNavbarWordmark !== false,
    fontFamily: normalizeSiteFontKey(source.fontFamily),
    headingFontFamily: normalizeSiteFontKey(source.headingFontFamily),
    headingScale: normalizeTextScale(source.headingScale),
    bodyScale: normalizeTextScale(source.bodyScale)
  };
}
