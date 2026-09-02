import { FreeMaterialCard } from "../../../components/free-material-card";
import {
  FREE_MATERIALS_EMPTY_CATEGORY_MESSAGE,
  FREE_MATERIALS_UNAVAILABLE_MESSAGE,
  FreeMaterialsState
} from "../../../components/free-materials-state";
import { PublicPageLayout } from "../../../components/public-page-layout";
import { getFreeMaterialsContent } from "../../../lib/public-content-api";

const articleBlocks = [
  {
    title: "Sınav hazırlığında çalışma planı nasıl kurulmalı?",
    body:
      "İyi bir çalışma planı yalnızca ders saatlerini yazmak değildir. Öğrencinin okul temposu, eksik konusu, deneme sonucu ve günlük enerjisi birlikte değerlendirilmelidir. Eğitim Gürmesi Akademi yaklaşımında plan; konu, soru, tekrar ve analiz bloklarını dengeli biçimde birleştirir."
  },
  {
    title: "Deneme analizi neden net sayısından daha önemlidir?",
    body:
      "Deneme sonucu tek başına başarıyı açıklamaz. Aynı nete sahip iki öğrenciden biri süre yönetiminde, diğeri konu bilgisinde zorlanıyor olabilir. Bu yüzden her deneme sonrası yanlış türü, süre kaybı ve kazanım eksiği ayrı ayrı incelenmelidir."
  },
  {
    title: "Motivasyon düşüşü nasıl yönetilir?",
    body:
      "Sınav yılında motivasyonun her gün aynı kalması beklenmez. Sağlıklı süreç, motivasyon yokken de çalışmayı sürdürecek küçük hedefler kurmaktır. Haftalık takip, kısa görevler ve görünür ilerleme hissi bu noktada belirleyici olur."
  }
] as const;

export default async function BlogHubPage() {
  const content = await getFreeMaterialsContent();
  const guidanceContent = content.guidanceContent;

  return (
    <PublicPageLayout>
      <section className="ega-exam-hero">
        <div className="ega-container ega-exam-hero__inner">
          <div className="ega-exam-hero__intro">
            <h1>Blog ve rehberlik içerikleri</h1>
            <p>
              Sınav hazırlığı, çalışma planı, motivasyon, deneme analizi ve öğrenci takibi hakkında
              kısa ama uygulanabilir rehberleri incele.
            </p>
          </div>
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

      <section className="ega-section ega-container">
        {content.status === "unavailable" ? (
          <FreeMaterialsState title="Blog ve rehberlik içerikleri" message={FREE_MATERIALS_UNAVAILABLE_MESSAGE} />
        ) : guidanceContent.length === 0 ? (
          <FreeMaterialsState title="Blog ve rehberlik içerikleri" message={FREE_MATERIALS_EMPTY_CATEGORY_MESSAGE} />
        ) : (
          <div className="ega-exam-link-grid">
            {guidanceContent.map((item) => (
              <FreeMaterialCard key={item.id ?? item.title} item={item} compact />
            ))}
          </div>
        )}
      </section>
    </PublicPageLayout>
  );
}
