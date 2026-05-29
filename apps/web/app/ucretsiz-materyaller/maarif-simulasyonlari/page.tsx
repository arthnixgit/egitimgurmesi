import { ButtonLink } from "@ega/ui";
import { PublicPageLayout } from "../../../components/public-page-layout";

const simulationBenefits = [
  {
    title: "Soyut kavramları görünür yapar",
    body: "Fizik, kimya ve fen konularında yalnızca formül ezberlemek yerine kavramın nasıl çalıştığını görsel olarak izlemeyi sağlar."
  },
  {
    title: "Konu tekrarını hızlandırır",
    body: "Özellikle grafik, hareket, enerji, basınç, elektrik ve kimyasal etkileşim gibi konularda kısa tekrar için güçlü bir destek sunar."
  },
  {
    title: "Soru çözümünden önce zemini güçlendirir",
    body: "Simülasyonla kavramı oturtan öğrenci, soru çözümünde hangi değişkenin neyi etkilediğini daha kolay fark eder."
  }
] as const;

const usageSteps = [
  "Önce konunun kısa özetini oku.",
  "Simülasyonda değişkenleri tek tek değiştir.",
  "Gözlemlediğin sonucu defterine bir cümleyle yaz.",
  "Ardından aynı kazanımdan soru çözerek bilgiyi pekiştir."
] as const;

export default function MaarifSimulationsGuidePage() {
  return (
    <PublicPageLayout>
      <section className="ega-exam-hero">
        <div className="ega-container ega-exam-hero__inner">
          <div className="ega-exam-hero__intro">
            <h1>Maarif simülasyonları</h1>
            <p>
              Etkileşimli simülasyonları kullanarak fen ve sayısal derslerde kavramları daha net gör,
              denemelerde kaçırdığın kazanımları daha hızlı toparla.
            </p>
          </div>
        </div>
      </section>

      <section className="ega-section ega-container">
        <div className="ega-directory-grid ega-directory-grid--three">
          {simulationBenefits.map((item) => (
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
            <h2>Simülasyonu verimli kullanma sırası</h2>
            <p>Simülasyon sayfasını yalnızca izleme alanı değil, aktif öğrenme aracı olarak kullan.</p>
          </div>
          <div className="ega-directory-grid ega-directory-grid--two">
            {usageSteps.map((step) => (
              <article key={step} className="ega-resource-card">
                <h3>{step}</h3>
              </article>
            ))}
          </div>
          <div className="ega-pack-card__actions">
            <ButtonLink href="https://www.eba.gov.tr/" label="EBA İçeriklerini Aç" target="_blank" rel="noreferrer" />
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
}
