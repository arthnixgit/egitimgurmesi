/**
 * The colour palette an editor can choose from for a free-material card.
 *
 * These nine names were already accepted and persisted by the API — the admin
 * panel exposed them as a free-text box that silently coerced anything
 * unrecognised to "blue", and the public site rendered none of them. So every
 * colour a customer picked was discarded twice over.
 *
 * Defining the list here gives the swatch picker and the stylesheet one source
 * of truth, so a colour offered in the panel is always a colour the site can
 * actually paint.
 */

export const MATERIAL_TONES = [
  "blue",
  "teal",
  "navy",
  "violet",
  "green",
  "amber",
  "gold",
  "orange",
  "pink"
] as const;

export type MaterialTone = (typeof MATERIAL_TONES)[number];

export const DEFAULT_MATERIAL_TONE: MaterialTone = "blue";

/** Turkish labels for the picker, so the panel does not show English colour names. */
export const MATERIAL_TONE_LABELS: Record<MaterialTone, string> = {
  blue: "Mavi",
  teal: "Turkuaz",
  navy: "Lacivert",
  violet: "Mor",
  green: "Yeşil",
  amber: "Kehribar",
  gold: "Altın",
  orange: "Turuncu",
  pink: "Pembe"
};

/**
 * The swatch colour shown in the picker.
 *
 * Kept alongside the stylesheet values deliberately: a swatch that does not
 * match what the card renders is its own kind of lie.
 */
export const MATERIAL_TONE_SWATCHES: Record<MaterialTone, string> = {
  blue: "#1f5fa8",
  teal: "#0d7a86",
  navy: "#102949",
  violet: "#6b4bb8",
  green: "#2f8f5b",
  amber: "#e6963c",
  gold: "#c9971f",
  orange: "#d9662b",
  pink: "#c2427c"
};

export function isMaterialTone(value: unknown): value is MaterialTone {
  return typeof value === "string" && (MATERIAL_TONES as readonly string[]).includes(value);
}

/** Resolves any stored value to a tone the stylesheet can paint. */
export function readMaterialTone(value: unknown): MaterialTone {
  return isMaterialTone(value) ? value : DEFAULT_MATERIAL_TONE;
}

/**
 * Gives each card in a list a colour.
 *
 * Content seeded before the picker existed has no tone, and a column of eight
 * identically-coloured cards is exactly the "plain" look we are trying to move
 * away from. Anything without an explicit choice is spread across the palette
 * by position instead, so an untouched page still looks deliberate.
 */
export function resolveMaterialTone(value: unknown, index: number): MaterialTone {
  return isMaterialTone(value) ? value : MATERIAL_TONES[index % MATERIAL_TONES.length];
}
