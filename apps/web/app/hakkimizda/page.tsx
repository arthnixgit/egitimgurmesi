import { SectionHeading } from "@ega/ui";
import { PublicPageLayout } from "../../components/public-page-layout";
import { getMarketingPageContent } from "../../lib/public-content-api";

const values = [
  "Öğrenci deneyimini keşiften öğrenme erişimine kadar koparmadan kurmak",
  "Koçluk ürünleri ile yerel video ürünlerini net biçimde ayırmak",
  "Yönetim yüzeyini teknik olmayan ekipler için de kolay öğrenilir tutmak",
  "Yerel kullanıcı, sipariş ve öğrenci kayıtlarını temiz ve izlenebilir tutmak"
] as const;

export default async function AboutPage() {
  const page = await getMarketingPageContent("hakkimizda");
  const intro = page?.sections.find((section) => section.sectionKey === "about-intro");

  return (
    <PublicPageLayout>
      <section className="ega-page-banner">
        <div className="ega-container ega-page-banner__inner">
          <div className="ega-page-banner__copy">
            <span className="ega-eyebrow">{intro?.eyebrow ?? "Yaklaşımımız"}</span>
            <h1>{intro?.title ?? "Koçluk, içerik ve öğrenci düzenini aynı sistemde topluyoruz."}</h1>
            <p>
              {intro?.body ??
                "Platform; düzen, görünür takip ve kayıt sonrasında parçalanmayan kontrollü öğrenci akışı üzerine kurulur."}
            </p>
          </div>

          <div className="ega-page-banner__panel">
            <span>Kurgu ilkesi</span>
            <strong>Tek deneyim, net sınırlar</strong>
            <p>Öğrenci için tek yüz, ekip için temiz operasyon ayrımı.</p>
          </div>
        </div>
      </section>

      <section className="ega-section ega-container">
        <SectionHeading
          eyebrow="Yapı Mantığı"
          title="Satış akışı, öğrenci paneli ve dış sağlayıcı sınırları baştan tanımlı"
          description="Öğrencinin gördüğü deneyim ile ekiplerin yönettiği operasyon alanı birbirine karışmadan aynı sistem içinde ilerler."
        />

        <div className="ega-story-grid ega-story-grid--two">
          <article className="ega-highlight-card ega-highlight-card--primary">
            <span className="ega-pill ega-pill--dark">Misyon</span>
            <h3>Öğrenciyi karar anından çalışma düzenine kadar dağılmadan taşımak</h3>
            <p>
              Kullanıcı paketleri incelerken, hesap oluştururken, video erişimi alırken ve koçluk akışına girerken tek
              parça bir ürün deneyimi hissetmelidir.
            </p>
          </article>

          <article className="ega-highlight-card">
            <span className="ega-pill ega-pill--warm">Operasyon</span>
            <h3>Arka tarafta ise her akış kendi sınırını korur</h3>
            <p>
              Video ürünleri yerel platformda kalır. Koçluk ürünleri yerelde anlatılır, yerelde izlenir ve ardından
              kontrollü bir dış ödeme/sağlayıcı adımına yönlendirilir.
            </p>
          </article>
        </div>

        <div className="ega-values-grid">
          {values.map((value) => (
            <article key={value} className="ega-team-card">
              <div className="ega-team-card__badge">Temel İlke</div>
              <p>{value}</p>
            </article>
          ))}
        </div>
      </section>
    </PublicPageLayout>
  );
}
