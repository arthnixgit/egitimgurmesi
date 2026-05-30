import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ButtonLink } from "@ega/ui";
import { ExamCountdownGrid } from "../../../components/exam-countdown-grid";
import { ExamCountdownRingSessions, ExamCountdownRings } from "../../../components/exam-countdown-rings";
import { PublicPageLayout } from "../../../components/public-page-layout";
import { getCountdownPageBySlug, getFreeMaterialsContent } from "../../../lib/public-content-api";

const legacyCountdownRedirects: Record<string, string> = {
  "2026-yks-kac-gun-kaldi": "/ucretsiz-materyaller/yks-kac-gun-kaldi"
};

export async function generateStaticParams() {
  const { countdownPages } = await getFreeMaterialsContent();

  return countdownPages.map((page) => ({
    slug: page.slug
  }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
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

export default async function FreeMaterialCountdownPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getCountdownPageBySlug(slug);

  if (!page) {
    if (legacyCountdownRedirects[slug]) {
      redirect(legacyCountdownRedirects[slug]);
    }

    notFound();
  }

  const useRingCounter = page.countdowns.length === 1 && Boolean(page.countdowns[0]?.targetIso);
  const useSessionRingCounters =
    page.countdowns.length > 1 && page.countdowns.every((countdown) => Boolean(countdown.targetIso));

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
            <ExamCountdownRings countdown={page.countdowns[0]} />
          ) : useSessionRingCounters ? (
            <ExamCountdownRingSessions countdowns={page.countdowns} />
          ) : (
            <ExamCountdownGrid countdowns={page.countdowns} />
          )}
        </div>
      </section>

      <section className="ega-section ega-container">
        <div className="ega-exam-stack">
          <section className="ega-exam-surface ega-exam-surface--video">
            <div className="ega-free-block__head ega-free-block__head--tight">
              <h2>{page.videoTitle}</h2>
              <p>{page.videoNote}</p>
            </div>

            <div className="ega-exam-video-shell">
              <video
                className="ega-exam-video-player"
                controls
                playsInline
                preload="none"
                poster="/branding/ega-logo-transparent-cropped.png"
              >
                <source src="" type="video/mp4" />
                Tarayıcınız video oynatmayı desteklemiyor.
              </video>
            </div>
          </section>

          <section className="ega-exam-surface">
            <div className="ega-free-block__head ega-free-block__head--tight">
              <h2>Resmi bağlantılar ve kaynaklar</h2>
              <p>Sınav tarihi, başvuru, giriş belgesi ve tercih araştırması için takip edilmesi gereken sayfalar.</p>
            </div>

            <div className="ega-exam-link-grid">
              {page.officialLinks.map((item) => (
                <article key={item.title} className="ega-free-link-card ega-free-link-card--compact">
                  <span className="ega-free-link-card__type">{item.type}</span>
                  <h3>{item.title}</h3>
                  <p>{item.summary}</p>
                  <div className="ega-pack-card__actions">
                    <ButtonLink
                      href={item.href}
                      label={item.buttonLabel ?? "Bağlantıyı Aç"}
                      target="_blank"
                      rel="noreferrer"
                    />
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="ega-exam-surface ega-exam-surface--articles">
            <div className="ega-free-block__head ega-free-block__head--tight">
              <h2>Sınav tarihi, sayaç ve hazırlık rehberi</h2>
              <p>Kalan süreyi nasıl yorumlayacağını ve hazırlık planını nasıl güncelleyeceğini kısa başlıklarla incele.</p>
            </div>

            <div className="ega-faq-accordion ega-exam-accordion">
              {page.articleSections.map((section, index) => (
                <details key={section.title} className="ega-faq-detail" open={index === 0}>
                  <summary>{section.title}</summary>
                  <p>{section.body}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </section>
    </PublicPageLayout>
  );
}
