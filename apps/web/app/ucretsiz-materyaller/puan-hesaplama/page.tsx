import { ButtonLink } from "@ega/ui";
import { PublicPageLayout } from "../../../components/public-page-layout";

const sections = [
  {
    title: "YKS puan hesaplama nasıl yorumlanmalı?",
    body:
      "YKS puanı yalnızca netlerin toplamından oluşmaz. TYT ve AYT netleri, diploma notundan gelen OBP katkısı ve tercih edeceğin puan türü birlikte değerlendirilmelidir. Bu yüzden puan hesaplama ekranı hedef belirlemek için kullanılmalı, kesin sonuç gibi görülmemelidir."
  },
  {
    title: "TYT puanı hangi derslerden etkilenir?",
    body:
      "TYT'de Türkçe, temel matematik, sosyal bilimler ve fen bilimleri testleri birlikte etki eder. Paragraf, problem ve temel işlem becerileri düzenli tekrar ister; çünkü TYT'de hız ve dikkat en az bilgi kadar önemlidir."
  },
  {
    title: "AYT puanı neden alanlara göre değişir?",
    body:
      "AYT'de sayısal, eşit ağırlık, sözel ve dil puan türleri farklı test ağırlıklarıyla hesaplanır. Hedef bölümün hangi puan türünden aldığını bilmek, çalışma süresini doğru derse ayırmanın ilk adımıdır."
  },
  {
    title: "OBP puana nasıl eklenir?",
    body:
      "Ortaöğretim Başarı Puanı, yerleştirme puanına katkı sağlar. Diploma notu yüksek olan öğrenciler avantaj elde eder; ancak tercih stratejisi yalnızca OBP'ye değil, net dağılımı ve başarı sırasına göre kurulmalıdır."
  }
] as const;

const mistakes = [
  "Sadece toplam nete bakıp ders dağılımını ihmal etmek",
  "OBP katkısını hesaba katmadan hedef belirlemek",
  "Başarı sırası yerine yalnızca puan karşılaştırması yapmak",
  "Aynı netin her yıl aynı puanı getireceğini düşünmek"
] as const;

export default function ScoreCalculatorGuidePage() {
  return (
    <PublicPageLayout>
      <section className="ega-exam-hero">
        <div className="ega-container ega-exam-hero__inner">
          <div className="ega-exam-hero__intro">
            <h1>YKS puan hesaplama rehberi</h1>
            <p>
              TYT, AYT, YDT ve OBP verilerini doğru okuyarak hedef bölümüne ne kadar yaklaştığını
              daha sağlıklı yorumla.
            </p>
            <div className="ega-exam-hero__update">Puan, net ve başarı sırası birlikte değerlendirilmelidir.</div>
          </div>
        </div>
      </section>

      <section className="ega-section ega-container">
        <div className="ega-exam-stack">
          <section className="ega-exam-surface ega-exam-surface--articles">
            <div className="ega-free-block__head ega-free-block__head--tight">
              <h2>YKS puan hesaplama hakkında bilmen gerekenler</h2>
              <p>Netlerini daha doğru yorumlamak ve tercih hedefini gerçekçi kurmak için temel başlıklar.</p>
            </div>

            <div className="ega-faq-accordion ega-exam-accordion">
              {sections.map((section, index) => (
                <details key={section.title} className="ega-faq-detail" open={index === 0}>
                  <summary>{section.title}</summary>
                  <p>{section.body}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="ega-exam-surface">
            <div className="ega-free-block__head ega-free-block__head--tight">
              <h2>Sık yapılan hesaplama hataları</h2>
              <p>Puan hesabı yaparken bu hataları önlersen hedefini daha gerçekçi yorumlarsın.</p>
            </div>

            <div className="ega-directory-grid ega-directory-grid--two">
              {mistakes.map((mistake) => (
                <article key={mistake} className="ega-resource-card">
                  <h3>{mistake}</h3>
                </article>
              ))}
            </div>
          </section>

          <section className="ega-exam-surface">
            <div className="ega-free-block__head ega-free-block__head--tight">
              <h2>Resmi tercih verisiyle birlikte kullan</h2>
              <p>
                Puan hesabını yaptıktan sonra YÖK Atlas üzerinden bölüm ve başarı sırası verilerini incelemek,
                tercih listesini daha sağlıklı kurmanı sağlar.
              </p>
            </div>
            <div className="ega-pack-card__actions">
              <ButtonLink
                href="https://yokatlas.yok.gov.tr/netler-tablo.php?b=10103"
                label="YÖK Atlas Net Tablosunu Aç"
                target="_blank"
                rel="noreferrer"
              />
            </div>
          </section>
        </div>
      </section>
    </PublicPageLayout>
  );
}
