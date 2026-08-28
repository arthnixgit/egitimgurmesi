import { FreeMaterialCard } from "../../../components/free-material-card";
import { PublicPageLayout } from "../../../components/public-page-layout";
import { getFreeMaterialsContent } from "../../../lib/public-content-api";

const articleBlocks = [
  {
    title: "PDF çalışma dokümanları ne işe yarar?",
    body:
      "PDF dokümanlar, öğrencinin planını yalnızca zihninde tutmak yerine görünür hale getirir. Haftalık ders blokları, deneme sonuçları, yanlış analizi ve hedef takibi aynı düzen içinde tutulduğunda süreç daha kontrollü ilerler."
  },
  {
    title: "Deneme analiz formu nasıl kullanılmalı?",
    body:
      "Her denemeden sonra net, süre, yanlış konusu ve hata türü işaretlenmelidir. Böylece sonraki hafta sadece daha fazla soru çözmek değil, doğru kazanıma dönmek mümkün olur."
  },
  {
    title: "Hedef takip sayfası neden motivasyonu artırır?",
    body:
      "Öğrenci ilerlemeyi gördüğünde çalışma düzenini sürdürmesi kolaylaşır. Küçük görevlerin tamamlandığını görmek, uzun sınav maratonunda motivasyonu daha gerçekçi biçimde destekler."
  }
] as const;

export default async function PdfDocumentsPage() {
  const { pdfDocuments } = await getFreeMaterialsContent();

  return (
    <PublicPageLayout>
      <section className="ega-exam-hero">
        <div className="ega-container ega-exam-hero__inner">
          <div className="ega-exam-hero__intro">
            <h1>PDF dokümanlar</h1>
            <p>
              Planlama, tekrar, deneme analizi ve hedef takibi için hazırlanan dokümanları tek
              merkezden incele.
            </p>
          </div>
        </div>
      </section>

      <section className="ega-section ega-container">
        <div className="ega-exam-link-grid">
          {pdfDocuments.map((item) => (
            <FreeMaterialCard key={item.id ?? item.title} item={item} compact />
          ))}
        </div>
      </section>

      <section className="ega-section ega-container">
        <div className="ega-exam-surface ega-exam-surface--articles">
          <div className="ega-faq-accordion ega-exam-accordion">
            {articleBlocks.map((section, index) => (
              <details key={section.title} className="ega-faq-detail" open={index === 0}>
                <summary>{section.title}</summary>
                <p>{section.body}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
}
