import { ButtonLink } from "@ega/ui";
import { PublicPageLayout } from "../../../components/public-page-layout";
import { getFreeMaterialsContent } from "../../../lib/public-content-api";

const articleBlocks = [
  {
    title: "Resmi kaynakları tek yerden takip etmek neden önemli?",
    body:
      "Sınav döneminde tarih, başvuru, giriş belgesi ve sonuç bilgisi farklı platformlardan duyurulabilir. MEB, ÖSYM, ÖSYM AİS ve YÖK Atlas bağlantılarını tek sayfada toplamak bilgi dağınıklığını azaltır."
  },
  {
    title: "MEB ve ÖSYM bağlantıları hangi amaçla kullanılır?",
    body:
      "MEB özellikle LGS ve okul süreçleri için; ÖSYM ise YKS, KPSS ve merkezi sınav takvimleri için takip edilmelidir. AİS aday işlemlerinin, YÖK Atlas ise tercih araştırmasının merkezidir."
  },
  {
    title: "Bağlantıları kontrol ederken nelere dikkat edilmeli?",
    body:
      "Sosyal medya duyumları yerine resmi sayfa ve kılavuzlar esas alınmalıdır. Tarih veya saat değişikliği olduğunda öğrencinin çalışma planı da aynı gün güncellenmelidir."
  }
] as const;

export default async function UsefulLinksPage() {
  const { usefulLinks } = await getFreeMaterialsContent();

  return (
    <PublicPageLayout>
      <section className="ega-exam-hero">
        <div className="ega-container ega-exam-hero__inner">
          <div className="ega-exam-hero__intro">
            <h1>Faydalı linkler</h1>
            <p>
              MEB, ÖSYM, ÖSYM AİS ve YÖK Atlas gibi sınav sürecinde en çok ihtiyaç duyulan
              resmi bağlantılara hızlıca ulaş.
            </p>
          </div>
        </div>
      </section>

      <section className="ega-section ega-container">
        <div className="ega-exam-link-grid">
          {usefulLinks.map((item) => (
            <article key={item.title} className="ega-free-link-card ega-free-link-card--compact">
              <span className="ega-free-link-card__type">{item.type}</span>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
              <div className="ega-pack-card__actions">
                <ButtonLink href={item.href} label={item.buttonLabel ?? "Aç"} target="_blank" rel="noreferrer" />
              </div>
            </article>
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
