import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ExamCountdownGrid } from "../../../components/exam-countdown-grid";
import { ExamCountdownRingSessions, ExamCountdownRings } from "../../../components/exam-countdown-rings";
import { FreeMaterialCard } from "../../../components/free-material-card";
import {
  FREE_MATERIALS_UNAVAILABLE_MESSAGE,
  FreeMaterialsState
} from "../../../components/free-materials-state";
import { PublicPageLayout } from "../../../components/public-page-layout";
import type { ExamArticleSection, ExamCountdownPage, ExamCountdownTarget, ResourceLink } from "../../../lib/free-materials";
import { getCountdownPageBySlug, getFreeMaterialsContent } from "../../../lib/public-content-api";

const legacyCountdownRedirects: Record<string, string> = {
  "2026-yks-kac-gun-kaldi": "/ucretsiz-materyaller/yks-kac-gun-kaldi"
};

const MATERIAL_UNAVAILABLE_MESSAGE = "Bu materyal şu anda açılamıyor. İçerik bağlantısı kontrol ediliyor.";

export async function generateStaticParams() {
  const content = await getFreeMaterialsContent();
  const countdownSlugs = content.countdownPages.map((page) => page.slug);
  const managedSlugs = content.categories.flatMap((category) =>
    category.items
      .map((item) => item.slug ?? slugFromHref(item.href))
      .filter((slug): slug is string => Boolean(slug))
  );

  return Array.from(new Set([...countdownSlugs, ...managedSlugs])).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const content = await getFreeMaterialsContent();
  const managedItem = findManagedMaterial(slug, content.categories.flatMap((category) => category.items));

  if (managedItem) {
    return {
      title: managedItem.title,
      description: managedItem.summary
    };
  }

  const page = await getCountdownPageBySlug(slug);

  if (!page) {
    return {
      title: "Ücretsiz Materyal Bulunamadı"
    };
  }

  return {
    title: page.title,
    description: page.description
  };
}

export default async function FreeMaterialDynamicPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (legacyCountdownRedirects[slug]) {
    redirect(legacyCountdownRedirects[slug]);
  }

  const content = await getFreeMaterialsContent();
  const managedItem = findManagedMaterial(slug, content.categories.flatMap((category) => category.items));

  if (managedItem) {
    if (managedItem.downloadHref) {
      redirect(managedItem.downloadHref);
    }

    if (isCountdownItem(managedItem)) {
      const countdownSlug = managedItem.countdownSlug ?? slugFromHref(managedItem.href) ?? slug;
      const countdownPage = await getCountdownPageBySlug(countdownSlug);
      return countdownPage ? renderCountdownPage(countdownPage) : renderUnavailable(managedItem.title);
    }

    if (managedItem.href && managedItem.href !== `/ucretsiz-materyaller/${slug}`) {
      redirect(managedItem.href);
    }

    return renderUnavailable(managedItem.title);
  }

  const page = await getCountdownPageBySlug(slug);

  if (!page) {
    if (content.status === "unavailable") {
      return renderUnavailable("Ücretsiz materyal", FREE_MATERIALS_UNAVAILABLE_MESSAGE);
    }

    notFound();
  }

  return renderCountdownPage(page);
}

function renderCountdownPage(page: ExamCountdownPage) {
  const countdowns = safeCountdowns(page.countdowns);
  const officialLinks = safeResourceLinks(page.officialLinks);
  const articleSections = safeArticleSections(page.articleSections);

  if (countdowns.length === 0) {
    return renderUnavailable(page.title);
  }

  const useRingCounter = countdowns.length === 1 && Boolean(countdowns[0]?.targetIso);
  const useSessionRingCounters = countdowns.length > 1 && countdowns.every((countdown) => Boolean(countdown.targetIso));

  return (
    <PublicPageLayout>
      <section className="ega-exam-hero">
        <div className="ega-container ega-exam-hero__inner">
          <div className="ega-exam-hero__intro">
            <span className="ega-eyebrow">{page.eyebrow}</span>
            <h1>{page.title}</h1>
            <p>{page.description}</p>
            <div className="ega-exam-hero__update">{page.updatedLabel}</div>
          </div>

          {useRingCounter ? (
            <ExamCountdownRings countdown={countdowns[0]} />
          ) : useSessionRingCounters ? (
            <ExamCountdownRingSessions countdowns={countdowns} />
          ) : (
            <ExamCountdownGrid countdowns={countdowns} />
          )}
        </div>
      </section>

      <section className="ega-section ega-container">
        <div className="ega-exam-stack">
          <section className="ega-exam-surface ega-exam-surface--note">
            <div className="ega-free-block__head ega-free-block__head--tight">
              <h2>{page.videoTitle}</h2>
              <p>{page.videoNote}</p>
            </div>
          </section>

          {officialLinks.length > 0 ? (
            <section className="ega-exam-surface">
              <div className="ega-free-block__head ega-free-block__head--tight">
                <h2>Resmi bağlantılar ve kaynaklar</h2>
                <p>Sınav tarihi, başvuru, giriş belgesi ve tercih araştırması için takip edilmesi gereken sayfalar.</p>
              </div>

              <div className="ega-exam-link-grid">
                {officialLinks.map((item) => (
                  <FreeMaterialCard key={item.id ?? item.title} item={item} compact />
                ))}
              </div>
            </section>
          ) : null}

          {articleSections.length > 0 ? (
            <section className="ega-exam-surface ega-exam-surface--articles">
              <div className="ega-free-block__head ega-free-block__head--tight">
                <h2>Sınav tarihi, sayaç ve hazırlık rehberi</h2>
                <p>Kalan süreyi nasıl yorumlayacağını ve hazırlık planını nasıl güncelleyeceğini kısa başlıklarla incele.</p>
              </div>

              <div className="ega-faq-accordion ega-exam-accordion">
                {articleSections.map((section, index) => (
                  <details key={section.title} className="ega-faq-detail" open={index === 0}>
                    <summary>{section.title}</summary>
                    <p>{section.body}</p>
                  </details>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </PublicPageLayout>
  );
}

function renderUnavailable(title: string, message = MATERIAL_UNAVAILABLE_MESSAGE) {
  return (
    <PublicPageLayout>
      <section className="ega-section ega-container">
        <FreeMaterialsState title={title} message={message} />
      </section>
    </PublicPageLayout>
  );
}

function findManagedMaterial(slug: string, items: readonly ResourceLink[]) {
  return items.find((item) => item.slug === slug || slugFromHref(item.href) === slug || slugFromHref(item.downloadHref) === slug) ?? null;
}

function isCountdownItem(item: ResourceLink) {
  return item.destinationMode === "COUNTDOWN" || item.itemType === "COUNTDOWN" || item.itemType === "TOOL" || Boolean(item.countdownSlug);
}

function slugFromHref(href: string | undefined) {
  if (!href) {
    return null;
  }

  const match = href.match(/^\/ucretsiz-materyaller\/([a-z0-9-]+)$/);
  return match?.[1] ?? null;
}

function safeCountdowns(value: readonly ExamCountdownTarget[]) {
  return Array.isArray(value) ? value.filter((countdown) => countdown && typeof countdown.label === "string") : [];
}

function safeResourceLinks(value: readonly ResourceLink[]) {
  return Array.isArray(value) ? value.filter((item) => item && typeof item.href === "string" && typeof item.title === "string") : [];
}

function safeArticleSections(value: readonly ExamArticleSection[]) {
  return Array.isArray(value) ? value.filter((section) => section && typeof section.title === "string" && typeof section.body === "string") : [];
}