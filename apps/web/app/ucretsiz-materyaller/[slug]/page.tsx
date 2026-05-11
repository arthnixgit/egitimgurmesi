import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ButtonLink } from "@ega/ui";
import { ExamCountdownGrid } from "../../../components/exam-countdown-grid";
import { PublicPageLayout } from "../../../components/public-page-layout";
import { getCountdownPageBySlug, getFreeMaterialsContent } from "../../../lib/public-content-api";

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
    notFound();
  }

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

          <ExamCountdownGrid countdowns={page.countdowns} />
        </div>
      </section>

      <section className="ega-section ega-container">
        <div className="ega-exam-stack">
          <section className="ega-exam-surface ega-exam-surface--video">
            <div className="ega-free-block__head ega-free-block__head--tight">
              <span className="ega-free-section-head__eyebrow">Motivasyon Videosu</span>
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
              <div className="ega-exam-video-meta">
                <strong>Yakında video anlatım eklenecek</strong>
                <span>Bu alanda sınava özel kısa motivasyon ve hazırlık videoları yayınlanacak.</span>
              </div>
            </div>
          </section>

          <section className="ega-exam-surface">
            <div className="ega-free-block__head ega-free-block__head--tight">
              <span className="ega-free-section-head__eyebrow">Resmî Bağlantılar</span>
              <h2>Kurumsal sayfaları tek yerde tut</h2>
              <p>Tarih, saat, başvuru ve kılavuz kontrolü için resmî bağlantılar burada toplandı.</p>
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
              <span className="ega-free-section-head__eyebrow">Bilmeniz Gerekenler</span>
              <h2>Sınav tarihi, saatler ve hazırlık düzeni hakkında kısa açıklamalar</h2>
              <p>En çok merak edilen başlıklar tek tek cevaplanır; böylece öğrenci tarih ve süreç bilgisini dağılmadan bulur.</p>
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

          <section className="ega-exam-surface ega-exam-surface--note">
            <span className="ega-free-section-head__eyebrow">Açık Erişim</span>
            <h2>Bu içerik herkese açık tutuldu.</h2>
            <p>
              Sayaçlar, duyurular ve temel rehber içerikler giriş zorunluluğu olmadan erişilebilir; öğrencinin ihtiyaç duyduğu bilgiye hızlıca ulaşması hedeflenir.
            </p>
          </section>
        </div>
      </section>
    </PublicPageLayout>
  );
}
