import {
  FreeMaterialsDirectoryShowcase,
  type FreeMaterialsDirectoryCategory
} from "../../components/free-materials-directory-showcase";
import {
  FREE_MATERIALS_EMPTY_MESSAGE,
  FREE_MATERIALS_UNAVAILABLE_MESSAGE,
  FreeMaterialsState
} from "../../components/free-materials-state";
import { PublicPageLayout } from "../../components/public-page-layout";
import { getFreeMaterialsContent } from "../../lib/public-content-api";

export default async function FreeMaterialsPage() {
  const content = await getFreeMaterialsContent();

  if (content.status === "unavailable") {
    return (
      <PublicPageLayout>
        <section className="ega-section ega-container">
          <FreeMaterialsState title="Ücretsiz Materyaller" message={FREE_MATERIALS_UNAVAILABLE_MESSAGE} />
        </section>
      </PublicPageLayout>
    );
  }

  const categories = content.categories
    .map((category, index): FreeMaterialsDirectoryCategory => ({
      id: category.key,
      title: category.label,
      badge: "Ücretsiz",
      summary:
        category.description ??
        `${category.items.length} yayında materyal bu başlık altında yönetiliyor.`,
      href: routeForCategory(category.key, category.items[0]?.href ?? "/ucretsiz-materyaller"),
      buttonLabel: "İçerikleri Aç",
      opensInNewTab: false,
      links: category.items,
      tone: toneForCategory(category.key, index),
      previewLabel: category.label
    }));

  if (categories.length === 0) {
    return (
      <PublicPageLayout>
        <section className="ega-section ega-container">
          <FreeMaterialsState title="Ücretsiz Materyaller" message={FREE_MATERIALS_EMPTY_MESSAGE} />
        </section>
      </PublicPageLayout>
    );
  }

  return (
    <PublicPageLayout>
      <section className="ega-section ega-section--free-directory">
        <FreeMaterialsDirectoryShowcase categories={categories} />
      </section>
    </PublicPageLayout>
  );
}

function routeForCategory(key: string, fallback: string) {
  const routes: Record<string, string> = {
    "pdf-documents": "/ucretsiz-materyaller/pdf-dokumanlar",
    "useful-links": "/ucretsiz-materyaller/faydali-linkler",
    "guidance-content": "/ucretsiz-materyaller/blog"
  };

  return routes[key] ?? fallback;
}

function toneForCategory(
  key: string,
  index: number
): FreeMaterialsDirectoryCategory["tone"] {
  const tones: FreeMaterialsDirectoryCategory["tone"][] = [
    "amber",
    "blue",
    "teal",
    "violet",
    "green",
    "orange",
    "pink",
    "navy",
    "gold"
  ];
  const mapped: Partial<Record<string, FreeMaterialsDirectoryCategory["tone"]>> = {
    "free-tools": "amber",
    "useful-links": "pink",
    "pdf-documents": "navy",
    "guidance-content": "orange",
    "speed-reading": "green"
  };

  return mapped[key] ?? tones[index % tones.length];
}
