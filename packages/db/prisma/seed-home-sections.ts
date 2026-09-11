import { PrismaClient } from "@prisma/client";
import {
  DEFAULT_FEATURE_HIGHLIGHTS_TITLE,
  DEFAULT_VIDEO_SHOWCASE_TITLE,
  HOME_SECTION_KEYS,
  defaultContactCta,
  defaultFeatureHighlights,
  defaultLogoRailItems,
  defaultVideoCards
} from "../../../apps/web/lib/home-sections";

/**
 * Seeds the homepage sections that used to be hardcoded in apps/web/app/page.tsx.
 *
 * Non-destructive by design: a section that already exists is left untouched,
 * because on an installed site those rows hold the customer's own edits. Run it
 * once after deploying the homepage binding. Pass --force to overwrite existing
 * sections with the shipped defaults.
 *
 * The copy comes from apps/web/lib/home-sections so the seed and the renderer
 * can never drift apart.
 */
const prisma = new PrismaClient();
const PUBLISHED = "PUBLISHED" as const;
const force = process.argv.includes("--force");

const sections = [
  {
    sectionKey: HOME_SECTION_KEYS.logoRail,
    variantKey: HOME_SECTION_KEYS.logoRail,
    eyebrow: "Canlı akış",
    title: "Yayın ve kurum logoları",
    body: "Ana sayfadaki hareketli logo şeridinde gösterilen görseller.",
    sortOrder: 20,
    payload: { items: defaultLogoRailItems.map((item) => ({ ...item })) }
  },
  {
    sectionKey: HOME_SECTION_KEYS.videoShowcase,
    variantKey: HOME_SECTION_KEYS.videoShowcase,
    eyebrow: "Ders vitrini",
    title: DEFAULT_VIDEO_SHOWCASE_TITLE,
    body: null,
    sortOrder: 60,
    payload: { items: defaultVideoCards.map((item) => ({ ...item })) }
  },
  {
    sectionKey: HOME_SECTION_KEYS.featureHighlights,
    variantKey: HOME_SECTION_KEYS.featureHighlights,
    eyebrow: "Deneyim",
    title: DEFAULT_FEATURE_HIGHLIGHTS_TITLE,
    body: null,
    sortOrder: 70,
    payload: { items: defaultFeatureHighlights.map((item) => ({ ...item })) }
  },
  {
    sectionKey: HOME_SECTION_KEYS.contactCta,
    variantKey: HOME_SECTION_KEYS.contactCta,
    eyebrow: defaultContactCta.eyebrow,
    title: defaultContactCta.title,
    body: defaultContactCta.body,
    sortOrder: 80,
    payload: { actions: defaultContactCta.actions.map((action) => ({ ...action })) }
  }
];

async function main() {
  const page = await prisma.marketingPage.findUnique({ where: { key: "home" } });

  if (!page) {
    throw new Error('Marketing page "home" not found. Run `npm run db:seed` first.');
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const section of sections) {
    const existing = await prisma.marketingPageSection.findUnique({
      where: { pageId_sectionKey: { pageId: page.id, sectionKey: section.sectionKey } }
    });

    if (existing && !force) {
      skipped += 1;
      console.log(`skip    ${section.sectionKey} (already present)`);
      continue;
    }

    const data = {
      eyebrow: section.eyebrow,
      title: section.title,
      body: section.body,
      variantKey: section.variantKey,
      payload: section.payload,
      sortOrder: section.sortOrder,
      isActive: true,
      publishStatus: PUBLISHED
    };

    await prisma.marketingPageSection.upsert({
      where: { pageId_sectionKey: { pageId: page.id, sectionKey: section.sectionKey } },
      update: data,
      create: { pageId: page.id, sectionKey: section.sectionKey, ...data }
    });

    if (existing) {
      updated += 1;
      console.log(`update  ${section.sectionKey}`);
    } else {
      created += 1;
      console.log(`create  ${section.sectionKey}`);
    }
  }

  console.log(`\nHomepage sections: ${created} created, ${updated} updated, ${skipped} skipped.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
