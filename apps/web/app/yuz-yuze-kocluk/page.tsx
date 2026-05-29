import Image from "next/image";
import { ButtonLink, SectionHeading } from "@ega/ui";
import { PublicPageLayout } from "../../components/public-page-layout";
import { buildPackagesPageHref, getPackageCategoryById } from "../../lib/package-catalog";

const whatsAppHref =
  "https://wa.me/905000000000?text=Merhaba%2C%20Ankara%20y%C3%BCz%20y%C3%BCze%20ko%C3%A7luk%20paketleri%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum.";

const inPersonCategory = getPackageCategoryById("in-person-coaching");

const inPersonHighlights = [
  {
    title: "Ön görüşme ile başla",
    description: "Öğrencinin hedefi, temposu ve beklentisi netleştirilir; sonra doğru paket önerilir."
  },
  {
    title: "Ankara merkezli görüşme akışı",
    description: "Yüz yüze buluşma ritmi, öğrencinin haftalık düzenini bozmayacak şekilde planlanır."
  },
  {
    title: "Birebir takip ve geri dönüş",
    description: "Görüşme sonrası görev, tekrar ve deneme yönü net bırakılır; süreç dağılmaz."
  }
] as const;

export default function InPersonCoachingPage() {
  return (
    <PublicPageLayout contactHref={whatsAppHref}>
      <section className="ega-coaching-topline">
        <div className="ega-container ega-coaching-topline__inner">
          <strong>+6 yıllık saha deneyimi ile Eğitim Gurmesi Akademi ekibi yanında</strong>

          <div className="ega-coaching-topline__actions">
            <a className="ega-coaching-topline__help" href={whatsAppHref} target="_blank" rel="noreferrer">
              Karar vermekte zorlanıyor musun?
            </a>
            <ButtonLink href={whatsAppHref} label="Ücretsiz Ön Görüşme" variant="ghost" target="_blank" rel="noreferrer" />
          </div>
        </div>
      </section>

      <section className="ega-coaching-hero">
        <div className="ega-container ega-coaching-hero__inner">
          <div className="ega-coaching-hero__copy">
            <span className="ega-pill ega-pill--warm">Ankara yüz yüze koçluk modeli</span>
            <h1>
              <span>"Yüz Yüze Koçluk"</span>
              <strong>Dönemi Başladı!</strong>
            </h1>
            <p>Koçum yanımda olsun diyorsan, Eğitim Gurmesi Akademi senin için doğru yer.</p>
            <b>Plan, görüşme ve öğrenci takibi aynı deneyimde kalır; paket kararı da kontrollü ilerler.</b>

            <div className="ega-coaching-hero__actions">
              <ButtonLink href={whatsAppHref} label="Detaylı Bilgi Al" target="_blank" rel="noreferrer" />
              <ButtonLink
                href={buildPackagesPageHref("in-person-coaching")}
                label="Paketleri İncele"
                variant="ghost"
              />
            </div>

            <div className="ega-coaching-hero__notice">
              <span>Yüz yüze görüşme sistemi Ankara merkezli planlanır ve öğrenciye uygun takvimle ilerler.</span>
            </div>

            <div className="ega-coaching-hero__locations">
              <span className="ega-coaching-hero__location">Ankara</span>
            </div>
          </div>

          <div className="ega-coaching-hero__visual">
            <div className="ega-coaching-hero__scene">
              <div className="ega-coaching-hero__scene-card">
                <span>Yüz Yüze Akış</span>
                <strong>Koçluk görüşmeleri, plan notları ve yönlendirme tek ekranda hissedilir.</strong>
                <p>Öğrenci deneyimi parçalanmaz; görüşme sonrası çalışma yönü net kalır.</p>
              </div>

              <div className="ega-coaching-hero__scene-mini">
                <span>Ankara görüşme düzeni</span>
                <strong>Birebir Koçluk</strong>
              </div>

              <div className="ega-coaching-hero__avatar ega-coaching-hero__avatar--left" />
              <div className="ega-coaching-hero__avatar ega-coaching-hero__avatar--right" />

              <Image
                src="/branding/ega-logo-transparent-cropped.png"
                alt=""
                width={174}
                height={174}
                className="ega-coaching-hero__watermark"
              />
            </div>

            <div className="ega-coaching-hero__floating-badge">
              <span>Ankara merkez</span>
              <strong>Birebir Koçluk</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="ega-section ega-container">
        <SectionHeading
          eyebrow="Alt Başlıklar"
          title="Yüz yüze koçluk alt başlıklarına doğrudan geç"
          description="İlgilendiğin çalışma biçimine göre doğru pakete hızlıca ulaşabilir, ayrıntıları doğrudan ilgili başlık altında inceleyebilirsin."
        />

        <div className="ega-coaching-lanes">
          {inPersonCategory?.subcategories.map((subcategory) => (
            <a
              key={subcategory.id}
              href={buildPackagesPageHref("in-person-coaching", subcategory.id)}
              className="ega-coaching-lane"
            >
              <span>{inPersonCategory.label}</span>
              <strong>{subcategory.label}</strong>
              <p>{subcategory.description}</p>
            </a>
          ))}
        </div>
      </section>

      <section className="ega-section ega-container">
        <SectionHeading
          eyebrow="Süreç"
          title="Yüz yüze koçluk akışı nasıl ilerler?"
          description="İlk görüşmeden haftalık takibe kadar süreç net adımlarla ilerler; öğrenci her aşamada neyle karşılaşacağını bilir."
        />

        <div className="ega-coaching-flow">
          {inPersonHighlights.map((item, index) => (
            <article key={item.title} className="ega-highlight-card">
              <span className="ega-pill">{String(index + 1).padStart(2, "0")}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>
    </PublicPageLayout>
  );
}
