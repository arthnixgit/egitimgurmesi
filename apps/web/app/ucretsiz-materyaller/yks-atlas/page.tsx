import { ButtonLink } from "@ega/ui";
import { PublicPageLayout } from "../../../components/public-page-layout";

const atlasUses = [
  {
    title: "Bölüm araştırması",
    body: "Hedeflediğin bölümün hangi üniversitelerde olduğunu, kontenjanını ve geçmiş yıllardaki başarı sırası aralığını inceleyebilirsin."
  },
  {
    title: "Başarı sırası karşılaştırması",
    body: "Deneme ve puan hesaplama sonuçlarını geçmiş yerleştirme verileriyle karşılaştırarak hedefinin ne kadar gerçekçi olduğunu görebilirsin."
  },
  {
    title: "Tercih listesi hazırlığı",
    body: "Tercih dönemine kalmadan şehir, üniversite türü, burs durumu ve bölüm alternatiflerini daha erken süzebilirsin."
  }
] as const;

const tips = [
  "Sadece taban puana değil başarı sırasına bak.",
  "Tek yıl verisine göre karar verme; birkaç yılı birlikte incele.",
  "Kontenjan değişimini ve bölümün yerleşme eğilimini not al.",
  "Hedef, güvenli ve alternatif bölümleri ayrı listelerde tut."
] as const;

export default function YksAtlasGuidePage() {
  return (
    <PublicPageLayout>
      <section className="ega-exam-hero">
        <div className="ega-container ega-exam-hero__inner">
          <div className="ega-exam-hero__intro">
            <h1>YKS Atlas rehberi</h1>
            <p>
              Üniversite ve bölüm araştırmasını resmi verilerle yapmak isteyen öğrenciler için YÖK Atlas
              kullanımını sade bir rehberle özetledik.
            </p>
          </div>
        </div>
      </section>

      <section className="ega-section ega-container">
        <div className="ega-directory-grid ega-directory-grid--three">
          {atlasUses.map((item) => (
            <article key={item.title} className="ega-resource-card ega-resource-card--featured">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="ega-section ega-container">
        <div className="ega-exam-surface">
          <div className="ega-free-block__head ega-free-block__head--tight">
            <h2>YÖK Atlas kullanırken dikkat edilecek noktalar</h2>
            <p>Tercih araştırmasını daha güvenli yapmak için bu kontrol listesini kullan.</p>
          </div>
          <div className="ega-directory-grid ega-directory-grid--two">
            {tips.map((tip) => (
              <article key={tip} className="ega-resource-card">
                <h3>{tip}</h3>
              </article>
            ))}
          </div>
          <div className="ega-pack-card__actions">
            <ButtonLink href="https://yokatlas.yok.gov.tr/" label="YÖK Atlas'ı Aç" target="_blank" rel="noreferrer" />
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
}
