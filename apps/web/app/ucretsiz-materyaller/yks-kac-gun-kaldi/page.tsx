import { ButtonLink } from "@ega/ui";
import { PublicPageLayout } from "../../../components/public-page-layout";
import { getFreeMaterialsContent } from "../../../lib/public-content-api";

export default async function YksCountdownHubPage() {
  const { freeTools } = await getFreeMaterialsContent();

  const pages = [
    freeTools.find((item) => item.countdownSlug === "tyt-kac-gun-kaldi"),
    freeTools.find((item) => item.countdownSlug === "ayt-kac-gun-kaldi"),
    freeTools.find((item) => item.countdownSlug === "ydt-kac-gun-kaldi")
  ].filter(Boolean);

  return (
    <PublicPageLayout>
      <section className="ega-exam-hero">
        <div className="ega-container ega-exam-hero__inner">
          <div className="ega-exam-hero__intro">
            <h1>YKS'ye kaç gün kaldı?</h1>
            <p>
              TYT, AYT ve YDT oturumlarını tek ekrandan ayır. Her sayaç kendi resmi oturum saatine
              göre çalışır; böylece son hafta planını daha doğru kurarsın.
            </p>
          </div>
        </div>
      </section>

      <section className="ega-section ega-container">
        <div className="ega-directory-grid ega-directory-grid--three">
          {pages.map((item) =>
            item ? (
              <article key={item.href} className="ega-resource-card ega-resource-card--featured">
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
                <div className="ega-pack-card__actions">
                  <ButtonLink href={item.href} label={item.buttonLabel ?? "Sayacı Aç"} />
                </div>
              </article>
            ) : null
          )}
        </div>
      </section>
    </PublicPageLayout>
  );
}
