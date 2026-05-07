import { SectionCard, SectionTitle, SplitPanel, StatCard } from "@ega/ui";

const featuredPackages = [
  {
    title: "YKS Video Paketleri",
    description:
      "Konu anlatımı, soru çözümü, tekrar akışı ve modül bazlı ilerleme ile tam dönem çalışma modeli."
  },
  {
    title: "Koçluk Programları",
    description:
      "Öğrenciyi disiplinli takip eden, haftalık yön veren ve dış ödeme akışıyla Unikazan'a bağlanan koçluk ürünleri."
  },
  {
    title: "Karma Paketler",
    description:
      "Video erişimi ile bireysel yönlendirmeyi bir araya getiren, ileride genişletilebilecek hibrit ürün yapısı."
  }
];

const valueCards = [
  {
    eyebrow: "Sistemli Çalışma",
    title: "Sadece içerik değil, çalışma ritmi.",
    description:
      "Platform mimarisi, öğrencinin satın aldıktan sonra kaybolmadığı bir deneyim kurmak için tasarlanıyor."
  },
  {
    eyebrow: "Ölçülebilirlik",
    title: "Sipariş, erişim ve ilerleme tek yerde.",
    description:
      "Hem öğrenci paneli hem admin tarafı, ürün erişiminden finansal kayda kadar aynı omurgaya bağlanacak."
  },
  {
    eyebrow: "Dış Entegrasyon Disiplini",
    title: "Unikazan sadece koçluk ödemesinde devrede.",
    description:
      "Ana kullanıcı sistemi, LMS ve admin paneli tamamen Eğitim Gurmesi Akademi tarafında kalacak."
  }
];

const splitPanels = [
  {
    label: "Kayıtlı Eğitim Paketleri",
    title: "Kendi ödeme ve kendi erişim yapımız",
    description:
      "Video ürünlerinde kullanıcı, ödeme, erişim ve içerik takibi tamamen platform içinde yönetilecek."
  },
  {
    label: "Koçluk Paketleri",
    title: "Yerel sipariş kaydı + kontrollü dış yönlendirme",
    description:
      "Koçluk satın alımlarında kullanıcı önce bizim sistemimizde doğrulanacak, sonra Unikazan ödeme akışına yönlendirilecek."
  }
];

export default function HomePage() {
  return (
    <main className="ega-page">
      <header className="ega-header">
        <div className="ega-header__inner">
          <div className="ega-brand">
            <div className="ega-brand__mark">EGA</div>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "1.04rem" }}>
                Eğitim Gurmesi Akademi
              </div>
              <div style={{ color: "var(--ega-muted)", fontSize: ".88rem" }}>
                Lise ve sınav hazırlık platformu
              </div>
            </div>
          </div>

          <nav className="ega-nav">
            <a href="#paketler">Paketler</a>
            <a href="#sistem">Sistem</a>
            <a href="#sss">SSS</a>
            <a href="#iletisim">İletişim</a>
          </nav>

          <a className="ega-button--ghost" href="#paketler">
            Paketleri İncele
          </a>
        </div>
      </header>

      <section className="ega-hero">
        <div className="ega-hero__copy">
          <span className="ega-eyebrow">Yeni Nesil Eğitim Satış ve LMS Altyapısı</span>
          <h1 style={{ fontFamily: "var(--font-display)" }}>
            Video paketlerini ve koçluk ürünlerini tek omurgada yöneten eğitim platformu.
          </h1>
          <p className="ega-lead">
            Eğitim Gurmesi Akademi için kurulan bu yapı, halka açık satış sitesini, öğrenci panelini,
            yönetim panelini ve ödeme kayıt disiplinini tek sistemde toplar.
          </p>

          <div className="ega-actions">
            <a className="ega-button" href="#paketler">
              Paket Yapısını Gör
            </a>
            <a className="ega-button--ghost" href="#iletisim">
              WhatsApp Hazırlığı
            </a>
          </div>

          <div className="ega-stats">
            <StatCard value="3 Alan" label="Web, admin ve API katmanı ayrı kuruluyor." />
            <StatCard value="2 Satış Akışı" label="Yerel ödeme ve Unikazan yönlendirme birlikte çalışıyor." />
            <StatCard value="4 Rol" label="Super-admin, admin, accounting ve technician matrisi hazır." />
          </div>
        </div>

        <aside className="ega-hero__panel">
          <div className="ega-pill" style={{ background: "rgba(255,255,255,.14)", color: "white" }}>
            Faz 0 Kilitlendi
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", marginBottom: 10 }}>
            Kurgu artık belirsiz değil.
          </h2>
          <p style={{ color: "rgba(255,255,255,.84)", lineHeight: 1.7 }}>
            İlk iskelet; marka, teknik stack, admin ayrımı, rol sınırları ve dış ödeme mimarisi
            netleştirilerek kuruluyor.
          </p>

          <div className="ega-list">
            <div className="ega-list__item">
              <strong>01</strong>
              <span>Öğrenci kayıt ve erişim yönetimi tamamen içeride kalır.</span>
            </div>
            <div className="ega-list__item">
              <strong>02</strong>
              <span>Koçluk ödemesinde önce yerel sipariş açılır, sonra dış sağlayıcıya gidilir.</span>
            </div>
            <div className="ega-list__item">
              <strong>03</strong>
              <span>Admin paneli ayrı alan adı üzerinde, daha sıkı güvenlikle çalışır.</span>
            </div>
          </div>
        </aside>
      </section>

      <section className="ega-section ega-container" id="paketler">
        <SectionTitle
          title="Ana sayfa bilgi mimarisi ürünleri merkeze koyuyor"
          description="İlk tasarım yönü; güçlü açılış, ürün ayrımı, güven blokları, çalışma sistemi anlatımı ve sık sorulan sorular üzerine kuruldu."
        />
      </section>

      <section className="ega-grid">
        {featuredPackages.map((item) => (
          <SectionCard key={item.title} eyebrow="Paket Yapısı" title={item.title} description={item.description} />
        ))}
      </section>

      <section className="ega-section ega-container" id="sistem">
        <SectionTitle
          title="Mimari kararlar satış tarafını da operasyon tarafını da temiz tutuyor"
          description="Platform, müşteri deneyimi ile arka ofis operasyonunu aynı kalite çizgisinde ilerletmek için katmanlara ayrıldı."
        />
      </section>

      <section className="ega-grid">
        {valueCards.map((item) => (
          <SectionCard
            key={item.title}
            eyebrow={item.eyebrow}
            title={item.title}
            description={item.description}
          />
        ))}
      </section>

      <section className="ega-dual">
        {splitPanels.map((item) => (
          <SplitPanel
            key={item.title}
            label={item.label}
            title={item.title}
            description={item.description}
          />
        ))}
      </section>

      <section className="ega-section ega-container" id="sss">
        <SectionTitle
          title="Başlangıçta açılacak temel bölümler"
          description="Canlıya yakın ilk ana sayfa; hero, güven göstergeleri, paket kartları, sistem açıklaması, yorumlar, SSS ve güçlü çağrı alanı ile açılmalı."
        />
      </section>

      <section className="ega-footer" id="iletisim">
        <div className="ega-footer__panel">
          <div>
            <div className="ega-pill">Hazır Bekleyen Son Kararlar</div>
            <h2 style={{ fontFamily: "var(--font-display)", margin: "14px 0 8px" }}>
              Ödeme sağlayıcısı, video servisi ve kesin domain geldiğinde entegrasyon katmanını bağlarız.
            </h2>
            <p style={{ color: "var(--ega-muted)", lineHeight: 1.7 }}>
              Şu aşamada iskelet bunun için hazırlandı. Dış servis kararları sadece bağlantı
              noktalarını etkiler, temel mimariyi bozmaz.
            </p>
          </div>

          <a className="ega-button" href="https://wa.me/905000000000" target="_blank" rel="noreferrer">
            WhatsApp Akışını Hazırla
          </a>
        </div>
      </section>
    </main>
  );
}
