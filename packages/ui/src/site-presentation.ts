/**
 * Site-wide presentation settings the admin panel controls: navbar logo size,
 * the wordmark beside it, and typography.
 *
 * Shared by the admin (to build its controls and preview) and the public site
 * (to turn saved settings into CSS custom properties). Everything here is
 * defensive: a missing, stale or malformed value resolves to "keep the design
 * default", so settings saved before these controls existed render exactly as
 * they did.
 *
 * The API validates the same ranges and font keys on save
 * (apps/api/src/admin-content/site-presentation.ts). Keep the two in step —
 * both have a spec pinning the list.
 */

export const NAVBAR_LOGO_HEIGHT_MIN = 32;
export const NAVBAR_LOGO_HEIGHT_MAX = 96;
/** What the stylesheet uses when no height is saved. */
export const NAVBAR_LOGO_HEIGHT_DEFAULT = 52;

export const TEXT_SCALE_MIN = 85;
export const TEXT_SCALE_MAX = 130;
export const TEXT_SCALE_DEFAULT = 100;

export type SiteFontOption = {
  key: string;
  label: string;
  /** Short description shown under the option in the admin panel. */
  hint: string;
  /** CSS font-family stack, or null for the design default. */
  stack: string | null;
};

/**
 * Curated, self-hosted typefaces (apps/web/public/fonts, declared in
 * apps/web/app/fonts.css). All cover Turkish. A free-text font name was
 * deliberately not offered: a typo or an unlicensed font silently falls back
 * to Arial, which reads to the customer as "the setting does nothing".
 */
export const SITE_FONT_OPTIONS: readonly SiteFontOption[] = [
  { key: "default", label: "Varsayılan", hint: "Sitenin mevcut yazı tipi", stack: null },
  {
    key: "inter",
    label: "Inter",
    hint: "Modern, sade, ekranda çok okunaklı",
    stack: '"Inter Variable", "Segoe UI", Arial, sans-serif'
  },
  {
    key: "nunito",
    label: "Nunito",
    hint: "Yuvarlak hatlı, sıcak ve samimi",
    stack: '"Nunito Variable", "Segoe UI", Arial, sans-serif'
  },
  {
    key: "montserrat",
    label: "Montserrat",
    hint: "Geniş ve güçlü; başlıklarda etkili",
    stack: '"Montserrat Variable", "Segoe UI", Arial, sans-serif'
  },
  {
    key: "source-sans-3",
    label: "Source Sans 3",
    hint: "Kompakt; uzun metinlerde rahat",
    stack: '"Source Sans 3 Variable", "Segoe UI", Arial, sans-serif'
  },
  {
    key: "lora",
    label: "Lora",
    hint: "Tırnaklı (serif), klasik ve akademik",
    stack: '"Lora Variable", Georgia, "Times New Roman", serif'
  },
  {
    key: "playfair-display",
    label: "Playfair Display",
    hint: "Zarif serif; yalnızca başlıklar için önerilir",
    stack: '"Playfair Display Variable", Georgia, "Times New Roman", serif'
  }
];

export const SITE_FONT_KEYS = SITE_FONT_OPTIONS.map((option) => option.key);

export type SitePresentationSettings = {
  navbarLogoHeight?: number | null;
  showNavbarWordmark?: boolean | null;
  fontFamily?: string | null;
  headingFontFamily?: string | null;
  headingScale?: number | null;
  bodyScale?: number | null;
};

function toInteger(value: unknown): number | null {
  const numeric = typeof value === "string" && value.trim() ? Number(value) : value;

  return typeof numeric === "number" && Number.isFinite(numeric) ? Math.round(numeric) : null;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Logo height in px, or null for the stylesheet default. */
export function normalizeNavbarLogoHeight(value: unknown): number | null {
  const height = toInteger(value);

  return height === null ? null : clamp(height, NAVBAR_LOGO_HEIGHT_MIN, NAVBAR_LOGO_HEIGHT_MAX);
}

/** Text scale in percent, or null for 100%. */
export function normalizeTextScale(value: unknown): number | null {
  const scale = toInteger(value);

  return scale === null ? null : clamp(scale, TEXT_SCALE_MIN, TEXT_SCALE_MAX);
}

/** A known font key, or null for the design default. */
export function normalizeSiteFontKey(value: unknown): string | null {
  if (typeof value !== "string" || value === "default") {
    return null;
  }

  return SITE_FONT_KEYS.includes(value) ? value : null;
}

export function resolveSiteFontStack(key: unknown): string | null {
  const normalized = normalizeSiteFontKey(key);

  return SITE_FONT_OPTIONS.find((option) => option.key === normalized)?.stack ?? null;
}

/** The wordmark shows unless it was explicitly turned off. */
export function shouldShowNavbarWordmark(settings: Pick<SitePresentationSettings, "showNavbarWordmark">) {
  return settings.showNavbarWordmark !== false;
}

/** Every custom property sitePresentationStyle can emit. */
export const SITE_PRESENTATION_PROPERTIES = [
  "--font-body",
  "--font-display",
  "--ega-body-scale",
  "--ega-heading-scale",
  "--ega-navbar-logo-height"
] as const;

/**
 * CSS custom properties for the document root.
 *
 * Only properties with a real choice behind them are emitted, so the
 * stylesheet's own defaults stay in charge otherwise. The stylesheet reads:
 *   --font-body, --font-display            font stacks
 *   --ega-body-scale, --ega-heading-scale  unitless multipliers (1 = design)
 *   --ega-navbar-logo-height               px length
 */
export function sitePresentationStyle(settings: SitePresentationSettings): Record<string, string> {
  const style: Record<string, string> = {};
  const bodyFont = resolveSiteFontStack(settings.fontFamily);
  const headingFont = resolveSiteFontStack(settings.headingFontFamily);
  const bodyScale = normalizeTextScale(settings.bodyScale);
  const headingScale = normalizeTextScale(settings.headingScale);
  const logoHeight = normalizeNavbarLogoHeight(settings.navbarLogoHeight);

  if (bodyFont) {
    style["--font-body"] = bodyFont;
  }

  if (headingFont) {
    style["--font-display"] = headingFont;
  }

  if (bodyScale !== null && bodyScale !== TEXT_SCALE_DEFAULT) {
    style["--ega-body-scale"] = String(bodyScale / 100);
  }

  if (headingScale !== null && headingScale !== TEXT_SCALE_DEFAULT) {
    style["--ega-heading-scale"] = String(headingScale / 100);
  }

  if (logoHeight !== null) {
    style["--ega-navbar-logo-height"] = `${logoHeight}px`;
  }

  return style;
}
