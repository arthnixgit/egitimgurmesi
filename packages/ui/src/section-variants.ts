/**
 * The marketing-page section variants the public website can actually render.
 *
 * This list is the contract between the admin builder and apps/web. The admin
 * panel used to offer roughly twenty insertable widgets while the site matched
 * only a handful of section keys, so a customer could add a section, publish
 * it, and watch nothing appear. Both sides now assert against this list:
 * apps/web proves it renders every variant here, and the admin panel proves it
 * never offers one that is missing from it.
 *
 * Adding a variant means shipping its public renderer first, then listing it.
 */
export const RENDERABLE_SECTION_VARIANTS = [
  // Homepage
  "showcase-hero",
  "logo-rail",
  "packages-surface",
  "video-showcase",
  "feature-highlights",
  "contact-cta",
  // Hakkımızda
  "about-intro",
  // Paketlerimiz
  "directory-intro",
  "guarantee-ribbon"
] as const;

export type RenderableSectionVariant = (typeof RENDERABLE_SECTION_VARIANTS)[number];

export function isRenderableSectionVariant(value: string | null | undefined): value is RenderableSectionVariant {
  return (RENDERABLE_SECTION_VARIANTS as readonly string[]).includes(value ?? "");
}
