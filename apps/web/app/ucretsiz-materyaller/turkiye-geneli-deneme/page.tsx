import { ButtonLink } from "@ega/ui";
import { PublicPageLayout } from "../../../components/public-page-layout";

const benefitItems = [
  "Optik okuma",
  "Türkiye sıralaması",
  "YKS yıl karşılaştırması",
  "Kazanım analizi",
  "Video çözüm yönlendirmesi"
] as const;

const stepItems = [
  {
    title: "Kitapçık türünü seç",
    body: "Denemeyi A veya B kitapçığına göre işaretle. Cevap anahtarı ve video çözüm akışı bu seçime göre düzenlenir."
  },
  {
    title: "Cevaplarını gir veya optik yükle",
    body: "Optik formunun fotoğrafını yükleyebilir ya da cevaplarını ders ders elle girebilirsin. Böylece netlerin hızlıca hesaplanır."
  },
  {
    title: "OBP ile sonucunu yorumla",
    body: "Diploma notunu veya OBP değerini ekleyerek tahmini puan ve sıralama görünümünü daha anlamlı hale getirebilirsin."
  }
] as const;

const faqItems = [
  {
    question: "Türkiye Geneli TYT Denemesi ücretsiz mi?",
    answer:
      "Evet. Eğitim Gürmesi Akademi bu sayfayı öğrencilerin deneme sonucunu, net dağılımını ve gelişim alanlarını daha düzenli takip edebilmesi için ücretsiz olarak kurgular."
  },
  {
    question: "Optik yüklemeden sonuç alabilir miyim?",
    answer:
      "Evet. Optik yüklemek süreci hızlandırır; ancak istersen Türkçe, sosyal, matematik ve fen cevaplarını elle girerek de sonuç ekranına ilerleyebilirsin."
  },
  {
    question: "Kazanım analizi ne işe yarar?",
    answer:
      "Kazanım analizi, yanlışların hangi konu veya beceride yoğunlaştığını gösterir. Böylece sadece kaç yanlış yaptığını değil, hangi eksikten başlaman gerektiğini de görürsün."
  },
  {
    question: "Video çözümler nasıl kullanılmalı?",
    answer:
      "Video çözüm, sadece doğru cevabı görmek için değil, yanlış yaptığın sorunun mantığını anlamak için izlenmelidir. Her çözümden sonra benzer soru pratiği yapılması önerilir."
  }
] as const;

export default function TurkiyeGeneliDenemePage() {
  return (
    <PublicPageLayout>
      <section className="ega-exam-hero">
        <div className="ega-container ega-exam-hero__inner">
          <div className="ega-exam-hero__intro">
            <h1>Türkiye Geneli TYT Denemesi</h1>
            <p>
              Ücretsiz TYT denemeni çöz, cevaplarını kontrol et, netlerini yorumla ve hangi kazanımdan
              başlarsan daha hızlı ilerleyeceğini tek sayfada gör.
            </p>
            <div className="ega-exam-hero__update">
              120 soru · net analizi · kazanım önceliği · video çözüm akışı
            </div>
          </div>
        </div>
      </section>

      <section className="ega-section ega-container">
        <div className="ega-resource-card ega-resource-card--featured ega-deneme-hero-card">
          <h2>Denemeyi çözdükten sonra seni ne bekliyor?</h2>
          <p>
            Deneme sonrası en değerli şey yalnızca toplam net değildir. Hangi derste süre kaybettiğin,
            hangi kazanımda hata yaptığın ve sonraki hafta hangi konuya döneceğin netleşmelidir.
          </p>
          <div className="ega-bullet-row">
            {benefitItems.map((item) => (
              <span key={item} className="ega-success-bullet-chip">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="ega-section ega-container">
        <div className="ega-directory-grid ega-directory-grid--three">
          {stepItems.map((item) => (
            <article key={item.title} className="ega-resource-card">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="ega-section ega-container">
        <div className="ega-cta-panel">
          <div className="ega-cta-panel__copy">
            <h2>Deneme sonucunu çalışma planına dönüştür</h2>
            <p>
              Sonuç ekranını sadece puan görmek için değil, sonraki hafta çalışmanı planlamak için kullan.
              Yanlışların konuya, süreye ve dikkat hatasına göre ayrıldığında gelişim daha görünür olur.
            </p>
          </div>
          <div className="ega-pack-card__actions">
            <ButtonLink href="/giris" label="Giriş Yap" />
            <ButtonLink href="/giris" label="Hesap Oluştur" variant="ghost" />
          </div>
        </div>
      </section>

      <section className="ega-section ega-container">
        <div className="ega-faq-accordion">
          {faqItems.map((item, index) => (
            <details key={item.question} className="ega-faq-detail" open={index === 0}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </PublicPageLayout>
  );
}
