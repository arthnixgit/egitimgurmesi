import { SectionHeading } from "@ega/ui";
import { PublicPageLayout } from "../../components/public-page-layout";
import { getMarketingPageContent } from "../../lib/public-content-api";

const values = [
  {
    title: "Planlı ilerleme",
    body: "Öğrencinin haftalık çalışma düzeni, deneme analizi ve konu tekrarları görünür bir akış içinde takip edilir."
  },
  {
    title: "Kişiye özel yönlendirme",
    body: "Her öğrencinin seviyesi, hedefi ve çalışma temposu farklıdır. Bu yüzden paket ve koçluk akışı tek tip değil, ihtiyaç odaklı planlanır."
  },
  {
    title: "Dijital erişim",
    body: "Video dersler, kayıtlı içerikler ve öğrenci paneli sayesinde süreç yalnızca görüşme anına bağlı kalmaz."
  },
  {
    title: "Veli ve öğrenci şeffaflığı",
    body: "Çalışma düzeni, hedefler ve ilerleme notları anlaşılır biçimde tutulur; böylece süreç belirsiz kalmaz."
  }
] as const;

export default async function AboutPage() {
  const page = await getMarketingPageContent("hakkimizda");
  const intro = page?.sections.find((section) => section.sectionKey === "about-intro");

  return (
    <PublicPageLayout>
      <section className="ega-section ega-container">
        <SectionHeading
          title={intro?.title ?? "Eğitim Gürmesi Akademi hakkında"}
          description={
            intro?.body ??
            "Eğitim Gürmesi Akademi; öğrencinin paket seçimini, koçluk takibini, canlı ders erişimini ve çalışma düzenini daha anlaşılır hale getiren bir hazırlık platformudur."
          }
        />

        <div className="ega-story-grid ega-story-grid--two">
          <article className="ega-highlight-card ega-highlight-card--primary">
            <h2>Öğrenciye yalnızca içerik değil, düzen kazandırmayı hedefliyoruz</h2>
            <p>
              Sınav hazırlığında kaynak çokluğu tek başına yeterli değildir. Öğrencinin hangi derse
              ne zaman döneceğini, deneme sonucunu nasıl yorumlayacağını ve eksiklerini hangi sırayla
              kapatacağını bilmesi gerekir.
            </p>
          </article>

          <article className="ega-highlight-card">
            <h2>Koçluk, canlı ders ve dijital panel aynı hedefe çalışır</h2>
            <p>
              Eğitim Gürmesi Akademi'de koçluk görüşmeleri, video içerikleri, paket erişimi ve öğrenci
              paneli birbirinden kopuk parçalar olarak değil, tek hazırlık deneyimi olarak kurgulanır.
            </p>
          </article>
        </div>

        <div className="ega-values-grid">
          {values.map((value) => (
            <article key={value.title} className="ega-team-card">
              <h3>{value.title}</h3>
              <p>{value.body}</p>
            </article>
          ))}
        </div>
      </section>
    </PublicPageLayout>
  );
}
