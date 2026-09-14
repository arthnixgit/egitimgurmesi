/**
 * Creates marketing pages that do not exist yet. Never modifies one that does.
 *
 * Why this exists as its own script:
 *
 * `npm run db:seed` calls seedMarketingPages(), which upserts every page and
 * then runs
 *
 *     prisma.marketingPageSection.deleteMany({ where: { pageId: record.id } })
 *
 * before recreating the sections from the seed definitions. That is correct for
 * a fresh environment and destructive everywhere else: on production it would
 * discard whatever the customer has authored — including the homepage — and
 * replace it with the defaults committed in the repository.
 *
 * Production reached a state where only the `home` page existed, so the admin
 * panel's page list showed a single entry. Backfilling the other pages must not
 * require risking the one page that already holds real content. This script
 * therefore only ever calls `create`, and only for a page whose key and slug are
 * both absent.
 *
 * Pages are created as DRAFT. Creating them PUBLISHED would put six pages of
 * placeholder copy on a live website the moment the script runs; a draft is
 * invisible to visitors until someone reviews it in the admin panel and presses
 * "Yayınla". That is the conservative direction: the failure mode is a page
 * nobody has published yet, rather than placeholder text in front of customers.
 *
 * Safe to run repeatedly.
 */
import { PrismaClient } from "@prisma/client";
import { marketingPages } from "./data/marketing-pages";

const DRAFT = "DRAFT" as const;

/** Pages that must never be created or touched by a backfill. */
const PROTECTED_KEYS = new Set(["home"]);

type Summary = {
  created: string[];
  skippedExisting: string[];
  skippedProtected: string[];
};

export async function backfillMarketingPages(client: PrismaClient): Promise<Summary> {
  const summary: Summary = { created: [], skippedExisting: [], skippedProtected: [] };

  for (const page of marketingPages) {
    if (PROTECTED_KEYS.has(page.key)) {
      summary.skippedProtected.push(page.key);
      continue;
    }

    // Both key and slug are unique in the schema. Checking each separately
    // means a page whose slug was changed in the admin panel is still
    // recognised, instead of failing the whole run on a constraint violation.
    const existing = await client.marketingPage.findFirst({
      where: {
        OR: [{ key: page.key }, { slug: page.slug }]
      },
      select: { key: true }
    });

    if (existing) {
      summary.skippedExisting.push(page.key);
      continue;
    }

    await client.marketingPage.create({
      data: {
        key: page.key,
        slug: page.slug,
        title: page.title,
        excerpt: page.excerpt,
        description: page.description,
        pageType: page.pageType,
        publishStatus: DRAFT,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        sections: {
          create: page.sections.map((section) => ({
            sectionKey: section.sectionKey,
            eyebrow: section.eyebrow,
            title: section.title,
            body: section.body,
            variantKey: section.variantKey,
            payload: section.payload,
            sortOrder: section.sortOrder,
            isActive: true,
            publishStatus: DRAFT
          }))
        }
      }
    });

    summary.created.push(page.key);
  }

  return summary;
}

async function main() {
  // Constructed here rather than at module scope: importing this file — which
  // the unit tests do — must never open a database connection.
  const prisma = new PrismaClient();

  try {
    const summary = await backfillMarketingPages(prisma);

    console.log(`Created:           ${summary.created.length ? summary.created.join(", ") : "(none)"}`);
    console.log(`Already present:   ${summary.skippedExisting.length ? summary.skippedExisting.join(", ") : "(none)"}`);
    console.log(`Left alone:        ${summary.skippedProtected.join(", ")}`);
    console.log("");
    console.log("New pages are DRAFT. Review each one in the admin panel and press Yayınla to publish it.");
  } finally {
    await prisma.$disconnect();
  }
}

// Anchored to the exact filename: a loose `includes` check also matches
// seed-marketing-pages.spec.ts, which made the test run execute the seed.
const isDirectRun = /[\\/]seed-marketing-pages\.ts$/.test(process.argv[1] ?? "");

if (isDirectRun) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
