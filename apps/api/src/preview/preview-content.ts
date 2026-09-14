/**
 * Merging stored drafts over published records for preview rendering.
 *
 * Drafts are written by the admin builder as whole-entity snapshots (see
 * website_content_drafts), so a draft is authoritative for the fields it
 * carries. These helpers are deliberately tolerant: a draft is arbitrary JSON
 * that an older build of the editor may have written, and preview must degrade
 * to published content rather than throwing at a visitor.
 */

export type PreviewSection = {
  sectionKey: string;
  eyebrow: string | null;
  title: string | null;
  body: string | null;
  variantKey: string | null;
  payload: unknown;
  sortOrder: number;
  isActive: boolean;
};

/**
 * Fields the draft may override on a marketing page. Everything else on the
 * published record (ids, timestamps) is preserved.
 */
const PAGE_OVERRIDABLE_FIELDS = [
  "title",
  "excerpt",
  "description",
  "pageType",
  "seoTitle",
  "seoDescription",
  "heroImageUrl",
  "metadata"
] as const;

export function mergePreviewMarketingPage(
  published: Record<string, unknown>,
  draftData: unknown
): Record<string, unknown> {
  if (!isRecord(draftData)) {
    return published;
  }

  const merged: Record<string, unknown> = { ...published };

  for (const field of PAGE_OVERRIDABLE_FIELDS) {
    if (field in draftData) {
      merged[field] = draftData[field];
    }
  }

  const sections = normalizePreviewSections(draftData.sections);

  if (sections) {
    merged.sections = sections;
  }

  // Marks the payload so the public app can show a preview banner and never
  // let a draft be mistaken for the live site.
  merged.isPreview = true;

  return merged;
}

export function mergePreviewSiteSettings(
  published: Record<string, unknown>,
  draftData: unknown
): Record<string, unknown> {
  if (!isRecord(draftData)) {
    return published;
  }

  const merged: Record<string, unknown> = { ...published };

  for (const [key, value] of Object.entries(draftData)) {
    // Draft snapshots carry editor bookkeeping that must not leak into a
    // public response or overwrite the record's own identity.
    if (IGNORED_SETTING_KEYS.has(key) || value === undefined) {
      continue;
    }

    merged[key] = value;
  }

  merged.isPreview = true;

  return merged;
}

const IGNORED_SETTING_KEYS = new Set([
  "id",
  "key",
  "version",
  "draftStatus",
  "hasDraft",
  "draftIsStale",
  "draftUpdatedAt",
  "draftUpdatedByStaffUserId",
  "revalidateRoutes",
  "revalidateTags",
  "createdAt",
  "updatedAt"
]);

/**
 * Returns null when the draft carries no usable section list, so the caller
 * keeps the published sections instead of rendering an empty page.
 */
export function normalizePreviewSections(value: unknown): PreviewSection[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const sections = value
    .filter(isRecord)
    .map((section, index) => ({
      sectionKey: text(section.sectionKey) || `section-${index + 1}`,
      eyebrow: nullableText(section.eyebrow),
      title: nullableText(section.title),
      body: nullableText(section.body),
      variantKey: nullableText(section.variantKey),
      payload: section.payload ?? null,
      sortOrder: typeof section.sortOrder === "number" ? section.sortOrder : (index + 1) * 10,
      isActive: section.isActive !== false
    }))
    // A section switched off in the editor must not appear in its own preview.
    .filter((section) => section.isActive)
    .sort((left, right) => left.sortOrder - right.sortOrder);

  return sections.length > 0 ? sections : null;
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(value: unknown) {
  return typeof value === "string" ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
