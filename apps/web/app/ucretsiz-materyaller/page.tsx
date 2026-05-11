import { ButtonLink } from "@ega/ui";
import { ClosestExamFlipCounter } from "../../components/closest-exam-flip-counter";
import { FreeToolCard } from "../../components/free-tool-card";
import { PublicPageLayout } from "../../components/public-page-layout";
import { getFreeMaterialsContent } from "../../lib/public-content-api";
import type { ResourceLink } from "../../lib/free-materials";

function getActionLabel(item: ResourceLink) {
  return item.buttonLabel ?? (item.opensInNewTab || item.href.startsWith("http") ? "Sayfayı Aç" : "İçeriği Aç");
}

function LinkCard({
  item,
  compact = false
}: {
  item: ResourceLink;
  compact?: boolean;
}) {
  const isExternal = item.opensInNewTab || item.href.startsWith("http");

  return (
    <article className={`ega-free-link-card${compact ? " ega-free-link-card--compact" : ""}`}>
      <span className="ega-free-link-card__type">{item.type}</span>
      <h3>{item.title}</h3>
      <p>{item.summary}</p>
      <div className="ega-pack-card__actions">
        <ButtonLink
          href={item.href}
          label={getActionLabel(item)}
          target={isExternal ? "_blank" : "_self"}
          rel={isExternal ? "noreferrer" : undefined}
        />
      </div>
    </article>
  );
}

export default async function FreeMaterialsPage() {
  const { freeTools, usefulLinks, pdfDocuments, guidanceContent, speedReading, countdownPages } =
    await getFreeMaterialsContent();
  const countdownPagesBySlug = new Map(countdownPages.map((page) => [page.slug, page]));

  return (
    <PublicPageLayout>
      <section className="ega-free-hero ega-free-hero--directory">
        <div className="ega-container ega-free-hero__inner">
          <ClosestExamFlipCounter pages={countdownPages} />
        </div>
      </section>

      <section className="ega-section ega-container">
        <div className="ega-free-section-head">
          <div>
            <span className="ega-free-section-head__eyebrow">Ücretsiz Araçlar</span>
            <h2>Sık aranan geri sayım ve hedef araçları</h2>
          </div>
          <p>
            2026 YKS ve 2026 LGS sayaçları resmî takvimlere göre güncellenir. 2027 YKS için ise tarih
            açıklanana kadar yalnızca durum bilgisi gösterilir.
          </p>
        </div>

        <div className="ega-free-tools-grid">
          {freeTools.map((tool, index) => (
            <FreeToolCard
              key={tool.title}
              item={{ ...tool, buttonLabel: getActionLabel(tool) }}
              index={index}
              countdownPage={tool.countdownSlug ? countdownPagesBySlug.get(tool.countdownSlug) ?? null : null}
            />
          ))}
        </div>
      </section>

      <section className="ega-section ega-container">
        <div className="ega-free-columns">
          <div className="ega-free-block">
            <div className="ega-free-block__head">
              <span className="ega-free-section-head__eyebrow">Faydalı Linkler</span>
              <h2>Resmî ve güvenilir bağlantılar</h2>
              <p>Başvuru, duyuru ve tercih döneminde en çok ihtiyaç duyulan temel kurum sayfaları burada toplanır.</p>
            </div>

            <div className="ega-free-link-grid">
              {usefulLinks.map((item) => (
                <LinkCard key={item.title} item={item} compact />
              ))}
            </div>
          </div>

          <div className="ega-free-block">
            <div className="ega-free-block__head">
              <span className="ega-free-section-head__eyebrow">PDF Dökümanlar</span>
              <h2>İndirilebilir plan ve takip setleri</h2>
              <p>Çalışma planları, tekrar çizelgeleri ve takip formları öğrencinin günlük düzenini somutlaştırır.</p>
            </div>

            <div className="ega-free-link-grid">
              {pdfDocuments.map((item) => (
                <LinkCard key={item.title} item={item} compact />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="ega-section ega-container">
        <div className="ega-free-columns ega-free-columns--asymmetric">
          <div className="ega-free-block">
            <div className="ega-free-block__head">
              <span className="ega-free-section-head__eyebrow">Rehberlik İçerikleri</span>
              <h2>Yön veren içerikler</h2>
              <p>Öğrenci sadece sayaç değil, çalışma yönü de bulsun. Yazı blokları bu yüzden açık erişimde kalır.</p>
            </div>

            <div className="ega-free-link-grid">
              {guidanceContent.map((item) => (
                <LinkCard key={item.title} item={item} compact />
              ))}
            </div>
          </div>

          <div className="ega-free-feature">
            <span className="ega-free-link-card__type">{speedReading.type}</span>
            <h2>{speedReading.title}</h2>
            <p>{speedReading.summary}</p>
            <div className="ega-free-feature__badge">Paragraf ritmi, dikkat ve göz taraması için açık kaynak egzersiz</div>
            <div className="ega-pack-card__actions">
              <ButtonLink
                href={speedReading.href}
                label={getActionLabel(speedReading)}
                target="_blank"
                rel="noreferrer"
              />
            </div>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
}
