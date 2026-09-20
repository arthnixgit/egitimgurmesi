/**
 * The section design contract shared by the admin panel and the public site.
 *
 * The builder's "Tasarım" tab has always written `payload.style.{tone, align,
 * spacing}`, and nothing on the public site ever read it. Customers changed the
 * colour, alignment and spacing of a section, saved, published, and saw no
 * difference — which is a worse failure than a missing feature, because the
 * panel claimed the capability.
 *
 * Both apps resolve style through these functions so the canvas preview and the
 * live page cannot drift apart: whatever the editor sees is what visitors get.
 */

export const SECTION_TONES = ["teal", "blue", "amber"] as const;
export const SECTION_ALIGNMENTS = ["left", "center", "right"] as const;
export const SECTION_SPACINGS = ["tight", "normal", "relaxed"] as const;

export type SectionTone = (typeof SECTION_TONES)[number];
export type SectionAlignment = (typeof SECTION_ALIGNMENTS)[number];
export type SectionSpacing = (typeof SECTION_SPACINGS)[number];

export type SectionStyle = {
  tone: SectionTone;
  align: SectionAlignment;
  spacing: SectionSpacing;
};

export const DEFAULT_SECTION_STYLE: SectionStyle = {
  tone: "teal",
  align: "left",
  spacing: "normal"
};

/**
 * Turkish letters transliterated to their ASCII counterparts.
 *
 * Stripping them instead — which both previous implementations did — turns
 * "Ücretsiz Materyaller" into "cretsiz-materyaller" and "Başarılarımız" into
 * "ba-ar-lar-m-z". On a Turkish site that is most headings.
 *
 * Note the dotted/dotless i pair: "İ" lowercases to "i" and "I" to "ı", so both
 * are mapped explicitly rather than trusting toLowerCase.
 */
const TURKISH_TRANSLITERATION: Record<string, string> = {
  ç: "c", Ç: "c",
  ğ: "g", Ğ: "g",
  ı: "i", I: "i",
  i: "i", İ: "i",
  ö: "o", Ö: "o",
  ş: "s", Ş: "s",
  ü: "u", Ü: "u"
};

/** An anchor id usable in a URL fragment, or null when there is nothing valid. */
export function normalizeSectionAnchorId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = Array.from(value.trim())
    .map((character) => TURKISH_TRANSLITERATION[character] ?? character)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "");

  return normalized || null;
}

function pick<T extends readonly string[]>(allowed: T, value: unknown, fallback: T[number]): T[number] {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T[number]) : fallback;
}

function readStyleRecord(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {};
  }

  const style = (payload as Record<string, unknown>).style;

  return style && typeof style === "object" && !Array.isArray(style) ? (style as Record<string, unknown>) : {};
}

/**
 * Reads the design choices from a section payload, falling back to the defaults
 * for anything missing or malformed. Content authored before this contract
 * existed has no `style` key at all and must keep rendering exactly as it did.
 */
export function readSectionStyle(payload: unknown): SectionStyle {
  const style = readStyleRecord(payload);

  return {
    tone: pick(SECTION_TONES, style.tone, DEFAULT_SECTION_STYLE.tone),
    align: pick(SECTION_ALIGNMENTS, style.align, DEFAULT_SECTION_STYLE.align),
    spacing: pick(SECTION_SPACINGS, style.spacing, DEFAULT_SECTION_STYLE.spacing)
  };
}

export type SectionStyleProps = {
  "data-ega-section": "";
  "data-tone": SectionTone;
  "data-align": SectionAlignment;
  "data-spacing": SectionSpacing;
};

/**
 * The attributes a section wrapper needs for the stylesheet to act on it.
 *
 * `data-ega-section` is the hook every design rule is scoped to, so these rules
 * can never leak onto markup that did not opt in.
 */
export function sectionStyleProps(payload: unknown): SectionStyleProps {
  const style = readSectionStyle(payload);

  return {
    "data-ega-section": "",
    "data-tone": style.tone,
    "data-align": style.align,
    "data-spacing": style.spacing
  };
}

/**
 * The custom anchor a section carries, if any.
 *
 * Deliberately separate from sectionStyleProps: several sections already have a
 * hardcoded id that the navigation menu links to (#paketler, #iletisim), and
 * replacing those would break the site menu the moment someone typed an anchor
 * name. A custom anchor is rendered as an extra target instead, so both work.
 */
export function readSectionAnchorId(payload: unknown): string | null {
  return normalizeSectionAnchorId(
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>).anchorId
      : null
  );
}
