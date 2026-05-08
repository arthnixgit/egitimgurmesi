"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ButtonLink, SectionHeading } from "@ega/ui";
import { PublicNavbar } from "../components/public-navbar";

type FilterMode = "grade" | "preference";

type HeroSlide = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  badge: string;
  stats: readonly string[];
  theme: "amber" | "teal" | "blue";
};

type FilterOption = {
  id: string;
  label: string;
  hint: string;
};

type PackCardData = {
  title: string;
  subtitle: string;
  price: string;
  badge: string;
  features: readonly string[];
  ctaLabel: string;
  ctaHref: string;
  tone: "amber" | "teal" | "blue";
};

type VideoCardData = {
  title: string;
  category: string;
  duration: string;
  teacher: string;
  summary: string;
  tone: "amber" | "teal" | "blue";
};

type ShowcaseSlide = {
  id: string;
  label: string;
  title: string;
  description: string;
  chips: readonly string[];
  tone: "amber" | "teal" | "blue";
};

const heroSlides: readonly HeroSlide[] = [
  {
    id: "yks-master",
    eyebrow: "2026 YKS Programları",
    title: "Koçluk, video dersler ve haftalık planlama tek ekranda ilerlesin.",
    description:
      "Öğrenci önce doğru paketi seçsin, sonra sistemli ders akışıyla sürece girsin. Karmaşık değil, güven veren bir başlangıç deneyimi.",
    badge: "Yeni dönem kayıtları açık",
    stats: ["Haftalık takip", "Kayıtlı ders arşivi", "Öğrenci hesabı zorunlu"],
    theme: "amber"
  },
  {
    id: "coach-flow",
    eyebrow: "Koçluk Akışı",
    title: "Koçluk ürünleri burada anlatılsın, ödeme kontrollü yönlendirmeyle tamamlansın.",
    description:
      "Bizim sistemimiz siparişi ve kullanıcıyı kayıt altına alır; dış ödeme adımı ise net ve güvenli şekilde ayrıştırılır.",
    badge: "Unikazan yönlendirme modeli",
    stats: ["Yerel sipariş kaydı", "Yönlendirme takibi", "Temiz muhasebe izi"],
    theme: "teal"
  },
  {
    id: "video-lms",
    eyebrow: "Video Paketleri",
    title: "Satın alınan video paketleri doğrudan öğrenci paneline düşsün.",
    description:
      "Ders, modül, tekrar ve kaynak erişimi tek hesap içinde düzenli görünsün. Satış sonrası kopukluk bırakmayan LMS omurgası.",
    badge: "LMS merkezli kurgu",
    stats: ["Anında erişim", "Mobil uyum", "Ders bazlı ilerleme"],
    theme: "blue"
  }
] as const;

const logoRailItems = [
  { short: "TYT", label: "Temel Hazırlık" },
  { short: "AYT", label: "Alan Derinleşme" },
  { short: "PAR", label: "Paragraf Rutini" },
  { short: "MAT", label: "Matematik Kampı" },
  { short: "FEN", label: "Fen Sprinti" },
  { short: "KOÇ", label: "Koçluk Takibi" },
  { short: "DEN", label: "Deneme Analizi" },
  { short: "TEK", label: "Tekrar Serisi" }
] as const;

const filterOptions: Record<FilterMode, readonly FilterOption[]> = {
  grade: [
    { id: "grade-9-10", label: "9 ve 10. Sınıf", hint: "Temel güçlendirme" },
    { id: "grade-11", label: "11. Sınıf", hint: "Düzen kurma" },
    { id: "grade-12", label: "12. Sınıf", hint: "Yoğun hazırlık" },
    { id: "graduate", label: "Mezun", hint: "Tam odak" }
  ],
  preference: [
    { id: "tyt-camp", label: "TYT Kampı", hint: "Hız ve rutin" },
    { id: "ayt-focus", label: "AYT Odak", hint: "Derin konu çalışması" },
    { id: "coaching", label: "Koçluk", hint: "Birebir takip" },
    { id: "repeat", label: "Tekrar Programı", hint: "Son viraj" }
  ]
};

const packLibrary: Record<string, readonly PackCardData[]> = {
  "grade-9-10": [
    {
      title: "Temel Güçlendirme Paketi",
      subtitle: "Ders düzeni kurmak ve eksikleri erken kapatmak isteyen öğrenciler için",
      price: "₺2.490",
      badge: "Video ağırlıklı",
      features: ["Haftalık ders akışı", "Kayıtlı konu anlatımı", "Paragraf ve problem rutini"],
      ctaLabel: "Paketi İncele",
      ctaHref: "/kayit",
      tone: "teal"
    },
    {
      title: "Okul Destek Paketi",
      subtitle: "Okul temposunu toparlayan, düzenli tekrar ve mini kamp düzeni",
      price: "₺3.150",
      badge: "Ders + kaynak",
      features: ["Sınıf seviyesine göre yol", "Konu tekrar akışı", "Ders notu erişimi"],
      ctaLabel: "İçeriği Gör",
      ctaHref: "/kayit",
      tone: "blue"
    },
    {
      title: "Hızlandırılmış Başlangıç",
      subtitle: "Sene içinde ritim kaçıran öğrenciler için toparlayıcı paket",
      price: "₺3.790",
      badge: "Hızlı toparlama",
      features: ["Kısa dönem hedef planı", "Takvimli video listesi", "Ölçümlü tekrar akışı"],
      ctaLabel: "Başvuru Yap",
      ctaHref: "#iletisim",
      tone: "amber"
    }
  ],
  "grade-11": [
    {
      title: "11. Sınıf Strateji Paketi",
      subtitle: "Temeli güçlendirirken YKS disiplinine erken geçmek isteyenler için",
      price: "₺3.490",
      badge: "Sistem kuran paket",
      features: ["TYT rutin başlangıcı", "11. sınıf konu takibi", "Video + çalışma planı"],
      ctaLabel: "Paketi İncele",
      ctaHref: "/kayit",
      tone: "blue"
    },
    {
      title: "11. Sınıf Koçluk Destekli",
      subtitle: "Video paketi yanında haftalık yönlendirme isteyen öğrenciler için",
      price: "Koçluk yönlendirmeli",
      badge: "Dış ödeme akışı",
      features: ["Yerel hesap zorunlu", "Koçluk sipariş kaydı", "Güvenli yönlendirme"],
      ctaLabel: "Koçluk Detayı",
      ctaHref: "#iletisim",
      tone: "teal"
    },
    {
      title: "11. Sınıf Yaz Hazırlığı",
      subtitle: "Yaz dönemini boş geçmek istemeyen öğrenciler için yoğun tekrar akışı",
      price: "₺2.990",
      badge: "Yaz kampı",
      features: ["Programlı tekrar", "Video kamp listesi", "Çalışma blokları"],
      ctaLabel: "Kampı Gör",
      ctaHref: "/kayit",
      tone: "amber"
    }
  ],
  "grade-12": [
    {
      title: "12. Sınıf Ana Paket",
      subtitle: "Sınav yılı boyunca konu, tekrar ve video akışını merkezde tutan yapı",
      price: "₺4.290",
      badge: "En çok tercih edilen",
      features: ["TYT ve AYT akışı", "Kayıtlı ders arşivi", "Ders bazlı takip ekranı"],
      ctaLabel: "Paketi İncele",
      ctaHref: "/kayit",
      tone: "blue"
    },
    {
      title: "12. Sınıf Koçluk Paketi",
      subtitle: "Haftalık takip, düzen ve birebir yön ihtiyacı olan öğrenciler için",
      price: "Koçluk yönlendirmeli",
      badge: "Koçluk akışı",
      features: ["Yerel sipariş kaydı", "Dış ödeme yönlendirmesi", "Takip için öğrenci hesabı"],
      ctaLabel: "Koçluk İçin Başla",
      ctaHref: "#iletisim",
      tone: "teal"
    },
    {
      title: "12. Sınıf Son Viraj",
      subtitle: "Deneme analizi, tekrar düzeni ve sıkı çalışma temposu isteyenler için",
      price: "₺3.690",
      badge: "Hızlı kapanış",
      features: ["Sık tekrar listeleri", "Deneme ritmi", "Bitirme kampı planı"],
      ctaLabel: "Programı Gör",
      ctaHref: "/kayit",
      tone: "amber"
    }
  ],
  graduate: [
    {
      title: "Mezun Full Program",
      subtitle: "Günü tamamen sınav düzenine göre kurmak isteyen mezun öğrenciler için",
      price: "₺4.690",
      badge: "Yoğun sistem",
      features: ["Tam gün plan mantığı", "Video + tekrar omurgası", "Düzenli ders erişimi"],
      ctaLabel: "Detayları Gör",
      ctaHref: "/kayit",
      tone: "blue"
    },
    {
      title: "Mezun Koçluk Takibi",
      subtitle: "Dış disiplin ve birebir yön ihtiyacı olan mezun öğrencilere uygun akış",
      price: "Koçluk yönlendirmeli",
      badge: "Takip merkezli",
      features: ["Koçluk için yönlendirme", "Yerel kullanıcı ve sipariş kaydı", "Düzenli süreç izi"],
      ctaLabel: "Koçluk Paketi",
      ctaHref: "#iletisim",
      tone: "teal"
    },
    {
      title: "Mezun Tekrar ve Deneme",
      subtitle: "Büyük kısmı bitirmiş, son bölümde hızlanmak isteyen öğrenciler için",
      price: "₺3.290",
      badge: "Tekrar odaklı",
      features: ["Deneme ritmi", "Video tekrar listeleri", "Yoğunlaştırılmış haftalar"],
      ctaLabel: "Programı İncele",
      ctaHref: "/kayit",
      tone: "amber"
    }
  ],
  "tyt-camp": [
    {
      title: "TYT Başlangıç Kampı",
      subtitle: "Rutin kurmak, paragraf ve problem hızını artırmak isteyen öğrenciler için",
      price: "₺2.890",
      badge: "TYT odak",
      features: ["Paragraf disiplini", "Problem blokları", "Günlük akış kartları"],
      ctaLabel: "Kampı İncele",
      ctaHref: "/kayit",
      tone: "amber"
    },
    {
      title: "TYT Hızlandırma",
      subtitle: "Süre yönetimi ve deneme ritmi üzerine kurulu yoğun model",
      price: "₺3.250",
      badge: "Tempo artırır",
      features: ["Süre odaklı çözüm", "Hız takibi", "Kısa döngü tekrar"],
      ctaLabel: "İçeriği Gör",
      ctaHref: "/kayit",
      tone: "blue"
    },
    {
      title: "TYT Koçluk Destekli",
      subtitle: "Ritmi tek başına koruyamayan öğrenciler için yönlendirmeli koçluk akışı",
      price: "Koçluk yönlendirmeli",
      badge: "Takipli model",
      features: ["Koçluk için dış ödeme", "Yerel sipariş takibi", "Hedef odaklı yön"],
      ctaLabel: "Koçluk Hakkında",
      ctaHref: "#iletisim",
      tone: "teal"
    }
  ],
  "ayt-focus": [
    {
      title: "AYT Derinleşme Paketi",
      subtitle: "Alan derslerinde net artırmak isteyen öğrenciler için yoğun konu takibi",
      price: "₺3.990",
      badge: "Alan odak",
      features: ["Ders bazlı derinleşme", "Konu listesi akışı", "Video tekrar planı"],
      ctaLabel: "Paketi Gör",
      ctaHref: "/kayit",
      tone: "blue"
    },
    {
      title: "AYT Son Tekrar",
      subtitle: "Bitirmiş ama unutma yaşayan öğrenciler için sıklaştırılmış dönüş planı",
      price: "₺2.790",
      badge: "Son tekrar",
      features: ["Kısa dönüş döngüsü", "Yüksek verimli videolar", "Hedef konu kapanışı"],
      ctaLabel: "Programı Gör",
      ctaHref: "/kayit",
      tone: "amber"
    },
    {
      title: "AYT Koçluk Akışı",
      subtitle: "Net takibi ve program disiplini için koçluk yönlendirmesi gereken öğrenciler",
      price: "Koçluk yönlendirmeli",
      badge: "Birebir yön",
      features: ["Yerel kullanıcı kaydı", "Koçluk yönlendirmesi", "Muhasebe için temiz iz"],
      ctaLabel: "Başvuru Aç",
      ctaHref: "#iletisim",
      tone: "teal"
    }
  ],
  coaching: [
    {
      title: "YKS Koçluk Başlangıç",
      subtitle: "Dış destekle ritim kurmak ve program disiplinini korumak isteyenler için",
      price: "Yönlendirmeli ödeme",
      badge: "Koçluk",
      features: ["Haftalık takip mantığı", "Yerel sipariş başlangıcı", "Unikazan yönlendirmesi"],
      ctaLabel: "Detay Al",
      ctaHref: "#iletisim",
      tone: "teal"
    },
    {
      title: "Yoğun Takip Programı",
      subtitle: "Hedefi yüksek olan ve sık geri bildirim isteyen öğrenciler için",
      price: "Yönlendirmeli ödeme",
      badge: "Yoğun model",
      features: ["Sık yönlendirme", "Çalışma düzeni kontrolü", "Koçluk odaklı süreç"],
      ctaLabel: "Başvuru Yap",
      ctaHref: "#iletisim",
      tone: "blue"
    },
    {
      title: "Koçluk + Video Hibrit",
      subtitle: "Video altyapısını koçluk takibiyle desteklemek isteyenler için",
      price: "Karma model",
      badge: "Hibrit",
      features: ["Video paketi entegrasyonu", "Koçluk yönlendirmesi", "Öğrenci hesabında tek görünüm"],
      ctaLabel: "Karma Paketi Sor",
      ctaHref: "#iletisim",
      tone: "amber"
    }
  ],
  repeat: [
    {
      title: "Büyük Tekrar Kampı",
      subtitle: "Biriken konuları planlı şekilde bitirmek isteyen öğrenciler için",
      price: "₺2.590",
      badge: "Kamp",
      features: ["Liste bazlı tekrar", "Yoğun video seti", "Kontrollü kapanış akışı"],
      ctaLabel: "Kampı Gör",
      ctaHref: "/kayit",
      tone: "amber"
    },
    {
      title: "Deneme Kulübü",
      subtitle: "Deneme sonrası eksik tespiti ve geri dönüş için düzen kuran yapı",
      price: "₺1.990",
      badge: "Deneme odak",
      features: ["Analiz rutini", "Eksik konu dönüşü", "Haftalık tempo kartları"],
      ctaLabel: "Kulübü İncele",
      ctaHref: "/kayit",
      tone: "blue"
    },
    {
      title: "Son Viraj Koçluk Akışı",
      subtitle: "Kapanışta dış disiplin ve koç takibi ihtiyacı olan öğrenciler için",
      price: "Yönlendirmeli ödeme",
      badge: "Son dönem",
      features: ["Takip gerektiren süreç", "Koçluk yönlendirmesi", "Yerel sipariş izi"],
      ctaLabel: "İletişime Geç",
      ctaHref: "#iletisim",
      tone: "teal"
    }
  ]
};

const sampleVideos: readonly VideoCardData[] = [
  {
    title: "TYT Türkçe Paragraf Hızlandırma",
    category: "TYT Türkçe",
    duration: "18 dk",
    teacher: "Eğitim Gurmesi Ekibi",
    summary: "Soru okuma ritmini ve paragraf akışını güçlendiren hızlı bir ön izleme dersi.",
    tone: "amber"
  },
  {
    title: "AYT Matematik Limitte Sık Yapılan Hatalar",
    category: "AYT Matematik",
    duration: "24 dk",
    teacher: "Kayıtlı Ders",
    summary: "Hızlı çözüm mantığı değil, doğru düşünme akışı üzerinden ilerleyen örnek ders kartı.",
    tone: "blue"
  },
  {
    title: "Biyoloji Tekrar Dersi: Hücre ve Bölünme",
    category: "AYT Biyoloji",
    duration: "16 dk",
    teacher: "Video Kütüphanesi",
    summary: "Tekrar döneminde öğrencinin kaybolmadan izleyeceği daha kısa ve yoğun içerik örneği.",
    tone: "teal"
  },
  {
    title: "Koçluk Görüşmesine Hazırlık Mini Videosu",
    category: "Koçluk Süreci",
    duration: "11 dk",
    teacher: "Hazırlık İçeriği",
    summary: "Koçluk öğrencisinin haftalık görüşmeye nasıl hazırlanacağına dair açıklayıcı giriş kartı.",
    tone: "amber"
  }
] as const;

const featureHighlights = [
  "Kişiye göre ürün anlatımı",
  "Canlı ve kayıtlı ders omurgası",
  "Yerel öğrenci hesabı ve sipariş kaydı",
  "Koçlukta kontrollü dış ödeme akışı",
  "WhatsApp ile hızlı temas",
  "Kolay öğrenilen yönetim paneli"
] as const;

const quickStats = [
  { value: "7/24", label: "Kayıtlı ders erişimi" },
  { value: "2", label: "Ayrı satış mantığı" },
  { value: "4", label: "Operasyon rolü" }
] as const;

const faqs = [
  {
    question: "Video paketi satın alındığında erişim hemen açılır mı?",
    answer:
      "Evet. Video paketleri için ödeme tamamlandığında erişim öğrenci hesabına açılır ve içerikler panel üzerinden görüntülenir."
  },
  {
    question: "Koçluk paketinde neden farklı bir ödeme akışı var?",
    answer:
      "Koçluk ürünleri bu sitede anlatılır ve yerel sipariş kaydı burada açılır. Ödeme adımı ise kontrollü yönlendirme ile dış sağlayıcıya aktarılır."
  },
  {
    question: "Paket seçmeden önce kayıt olmak zorunlu mu?",
    answer:
      "Satın alma adımında kayıt zorunludur. Bu hem video erişimini açmak hem de koçluk siparişini izlemek için gereklidir."
  },
  {
    question: "WhatsApp üzerinden yönlendirme alabilir miyim?",
    answer:
      "Evet. Karar veremeyen öğrenci veya veli için hızlı iletişim kanalı olarak WhatsApp çağrısı görünür tutulur."
  }
] as const;

const showcaseSlides: readonly ShowcaseSlide[] = [
  {
    id: "showcase-plan",
    label: "Kayıttan Sonraki Akış",
    title: "Öğrenciyi ilk günden planlı bir çalışma düzenine sokan görsel alan",
    description:
      "Bu bölüm; kayıt, paket seçimi, ders planı ve öğrenci hesabı mantığını daha vitrine yakın şekilde anlatan sabit afiş yapısında kurgulandı.",
    chips: ["Haftalık plan", "Net takip", "Tek hesap akışı"],
    tone: "amber"
  },
  {
    id: "showcase-coach",
    label: "Koçluk Tanıtımı",
    title: "Koçluk sürecini ayrı ama deneyimi bölmeden anlatan ikinci görsel slayt",
    description:
      "Koçluk ürünleri içeride tanıtılır; yerel sipariş kaydı burada tutulur, ödeme ise kontrollü yönlendirmeyle dış sağlayıcıya aktarılır.",
    chips: ["Yerel sipariş izi", "Yönlendirme kontrolü", "Net süreç ayrımı"],
    tone: "teal"
  },
  {
    id: "showcase-library",
    label: "Video Kütüphanesi",
    title: "Satın alınan video paketlerinin nasıl bir öğrenme alanına dönüştüğünü gösteren slayt",
    description:
      "Öğrenci; modül, ders, tekrar ve ilerleme kartlarını tek panel mantığında görür. Satış sonrası his burada güçlenir.",
    chips: ["Ders modülleri", "İlerleme görünümü", "Mobil erişim"],
    tone: "blue"
  }
] as const;

function PackCard({ title, subtitle, price, badge, features, ctaLabel, ctaHref, tone }: PackCardData) {
  return (
    <article className="ega-pack-card" data-tone={tone}>
      <div className="ega-pack-card__top">
        <span className="ega-pack-card__badge">{badge}</span>
        <strong className="ega-pack-card__price">{price}</strong>
      </div>
      <h3 className="ega-pack-card__title">{title}</h3>
      <p className="ega-pack-card__subtitle">{subtitle}</p>

      <ul className="ega-pack-card__features">
        {features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>

      <div className="ega-pack-card__actions">
        <ButtonLink href={ctaHref} label={ctaLabel} />
      </div>
    </article>
  );
}

function VideoCard({ title, category, duration, teacher, summary, tone }: VideoCardData) {
  return (
    <article className="ega-video-card" data-tone={tone}>
      <div className="ega-video-card__cover">
        <span className="ega-video-card__tag">{category}</span>
        <button className="ega-video-card__play" type="button" aria-label={`${title} ön izleme kartı`}>
          ▶
        </button>
        <div className="ega-video-card__pulse" />
      </div>

      <div className="ega-video-card__body">
        <div className="ega-video-card__meta">
          <span>{duration}</span>
          <span>{teacher}</span>
        </div>
        <h3>{title}</h3>
        <p>{summary}</p>
        <a href="/kayit" className="ega-video-card__link">
          Ön izleme akışını incele
        </a>
      </div>
    </article>
  );
}

export default function HomePage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [filterMode, setFilterMode] = useState<FilterMode>("grade");
  const [activeOption, setActiveOption] = useState(filterOptions.grade[0].id);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 4800);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    setActiveOption(filterOptions[filterMode][0].id);
  }, [filterMode]);

  const currentSlide = heroSlides[activeSlide];
  const currentShowcase = showcaseSlides[activeSlide];
  const currentPacks = packLibrary[activeOption];

  return (
    <main className="ega-page">
      <PublicNavbar />

      <section className="ega-hero ega-container" id="anasayfa">
        <div className="ega-hero__copy">
          <span className="ega-eyebrow">Lise öğrencileri için planlı, canlı ve güven veren başlangıç deneyimi</span>
          <h1 className="ega-hero__title">
            Kayıttan paket seçimine, öğrenciyi düzenli çalışmaya taşıyan güçlü bir başlangıç alanı.
          </h1>
          <p className="ega-hero__lead">
            Eğitim Gurmesi Akademi; kayıtlı video paketlerini, koçluk ürünlerini ve öğrenci hesabını
            tek vitrinde buluşturur. Koçlukta yönlendirme akışı ayrı yönetilir, öğrenci deneyimi ise tek parça kalır.
          </p>

          <div className="ega-actions">
            <ButtonLink href="#paketler" label="Paketleri İncele" />
            <ButtonLink
              href="https://wa.me/905000000000?text=Merhaba%2C%20paketler%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum."
              label="WhatsApp ile Sor"
              variant="ghost"
              target="_blank"
              rel="noreferrer"
            />
          </div>

          <div className="ega-hero__quick-stats">
            {quickStats.map((item) => (
              <div key={item.label} className="ega-hero__quick-stat">
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ega-slide-shell" data-theme={currentSlide.theme}>
          <div className="ega-slide-shell__main">
            <div className="ega-slide-shell__badge">{currentSlide.badge}</div>
            <div className="ega-slide-shell__photo">
              <div className="ega-slide-shell__photo-card">
                <span>{currentSlide.eyebrow}</span>
                <strong>{currentSlide.title}</strong>
                <small>{currentSlide.description}</small>
              </div>
              <div className="ega-slide-shell__photo-mini">
                <span>Haftalık akış</span>
                <strong>Video + koçluk yapısı</strong>
              </div>
              <Image
                src="/branding/ega-mark-transparent.png"
                alt=""
                width={220}
                height={117}
                className="ega-slide-shell__watermark"
              />
            </div>

            <div className="ega-slide-shell__stats">
              {currentSlide.stats.map((stat) => (
                <span key={stat}>{stat}</span>
              ))}
            </div>
          </div>

          <div className="ega-slide-shell__thumbs">
            {heroSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                className="ega-slide-shell__thumb"
                data-active={index === activeSlide}
                onClick={() => setActiveSlide(index)}
              >
                <span>{slide.badge}</span>
                <strong>{slide.eyebrow}</strong>
                <small>{slide.stats[0]}</small>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="ega-hero-gallery ega-container" aria-label="Öne çıkan görsel anlatım alanı">
        <div className="ega-hero-gallery__main" data-tone={currentShowcase.tone}>
          <div className="ega-hero-gallery__badge">{currentShowcase.label}</div>

          <div className="ega-hero-gallery__content">
            <div className="ega-hero-gallery__copy">
              <h2>{currentShowcase.title}</h2>
              <p>{currentShowcase.description}</p>

              <div className="ega-hero-gallery__chips">
                {currentShowcase.chips.map((chip) => (
                  <span key={chip}>{chip}</span>
                ))}
              </div>
            </div>

            <div className="ega-hero-gallery__visual" aria-hidden="true">
              <div className="ega-hero-gallery__poster">
                <div className="ega-hero-gallery__poster-head">
                  <span>Eğitim Gurmesi Akademi</span>
                  <strong>{currentShowcase.label}</strong>
                </div>

                <div className="ega-hero-gallery__poster-grid">
                  <div className="ega-hero-gallery__poster-card ega-hero-gallery__poster-card--wide">
                    <span>Haftalık Akış</span>
                    <strong>Planlı ders blokları</strong>
                  </div>
                  <div className="ega-hero-gallery__poster-card">
                    <span>Öğrenci</span>
                    <strong>Hesap zorunlu</strong>
                  </div>
                  <div className="ega-hero-gallery__poster-card">
                    <span>Satın Alma</span>
                    <strong>Net ürün ayrımı</strong>
                  </div>
                  <div className="ega-hero-gallery__poster-card ega-hero-gallery__poster-card--accent">
                    <span>Koçluk</span>
                    <strong>Kontrollü yönlendirme</strong>
                  </div>
                </div>
              </div>

              <Image
                src="/branding/ega-logo-transparent-cropped.png"
                alt=""
                width={220}
                height={144}
                className="ega-hero-gallery__watermark"
              />
            </div>
          </div>
        </div>

        <div className="ega-hero-gallery__thumbs">
          {showcaseSlides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              className="ega-hero-gallery__thumb"
              data-active={index === activeSlide}
              onClick={() => setActiveSlide(index)}
            >
              <span>{slide.label}</span>
              <strong>{slide.title}</strong>
            </button>
          ))}
        </div>
      </section>

      <section className="ega-logo-rail-section ega-container">
        <div className="ega-logo-rail-section__head">
          <span className="ega-pill ega-pill--warm">Canlı ve hareketli alan hissi</span>
          <p>
            Referanstaki kayan logo duygusunu koruyan, fakat tamamen bize ait bir akış. Hover ile durur.
          </p>
        </div>

        <div className="ega-logo-rail">
          <div className="ega-logo-rail__track">
            {[...logoRailItems, ...logoRailItems].map((item, index) => (
              <div key={`${item.short}-${index}`} className="ega-logo-chip">
                <strong>{item.short}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ega-section ega-container" id="paketler">
        <SectionHeading
          eyebrow="Sana En Uygun Paketi Seç"
          title="Paketleri sınıfa göre ya da ihtiyaca göre ayırarak sun"
          description="Bu bölüm referanstaki kategori mantığını korur. Kullanıcı önce bakış açısını seçer, sonra ona uygun paket kartları arasında dolaşır."
        />

        <div className="ega-filter-shell">
          <div className="ega-filter-shell__mode">
            <button
              type="button"
              className="ega-filter-mode"
              data-active={filterMode === "grade"}
              onClick={() => setFilterMode("grade")}
            >
              Sınıfa Göre
            </button>
            <button
              type="button"
              className="ega-filter-mode"
              data-active={filterMode === "preference"}
              onClick={() => setFilterMode("preference")}
            >
              İhtiyaca Göre
            </button>
          </div>

          <div className="ega-filter-shell__options">
            {filterOptions[filterMode].map((option) => (
              <button
                key={option.id}
                type="button"
                className="ega-filter-option"
                data-active={option.id === activeOption}
                onClick={() => setActiveOption(option.id)}
              >
                <strong>{option.label}</strong>
                <span>{option.hint}</span>
              </button>
            ))}
          </div>

          <div className="ega-pack-grid">
            {currentPacks.map((pack) => (
              <PackCard key={pack.title} {...pack} />
            ))}
          </div>
        </div>
      </section>

      <section className="ega-section ega-container" id="videolar">
        <SectionHeading
          eyebrow="Örnek Ders Kartları"
          title="Ön izleme video kartlarıyla ürünün havasını erkenden göster"
          description="Gerçek video altyapısı sonradan bağlanacak olsa da, kart dili ve etkileşim yapısı en baştan canlı hissedilmeli."
        />

        <div className="ega-video-grid">
          {sampleVideos.map((video) => (
            <VideoCard key={video.title} {...video} />
          ))}
        </div>
      </section>

      <section className="ega-section ega-container" id="neler-var">
        <SectionHeading
          eyebrow="Platformda Seni Neler Bekliyor"
          title="Sadece ürün kartı değil, güven ve sistem duygusu da göster"
          description="Bu bölüm referanstaki fayda anlatımını korur, ama kendi renk dili ve kart düzenimizle yeniden yorumlar."
        />

        <div className="ega-feature-band">
          {featureHighlights.map((item) => (
            <div key={item} className="ega-feature-band__item">
              <span className="ega-feature-band__dot" />
              <strong>{item}</strong>
            </div>
          ))}
        </div>

        <div className="ega-highlight-grid">
          <article className="ega-highlight-card ega-highlight-card--primary">
            <span className="ega-pill ega-pill--darkish">Öğrenci deneyimi</span>
            <h3>Video paketi, koçluk yönlendirmesi ve öğrenci paneli tek mantıkta görünür.</h3>
            <p>
              Kullanıcı neyi içeride tamamladığını, neyin dış ödeme adımı olduğunu karıştırmaz. Bu netlik
              güven hissini yükseltir.
            </p>
          </article>

          <article className="ega-highlight-card">
            <span className="ega-pill">Yönetim kolaylığı</span>
            <h3>Kartlar, ürünler ve yönlendirmeler arka tarafta kolay yönetilir.</h3>
            <p>
              Profesyonel görünümlü ama hızlı öğrenilen bir kontrol merkezi mantığı öne çıkarılır.
            </p>
          </article>

          <article className="ega-highlight-card">
            <span className="ega-pill ega-pill--warm">WhatsApp hazır</span>
            <h3>Kararsız kullanıcıya sürtünmesiz temas alanı verilir.</h3>
            <p>
              Öğrenci ve veli çoğu zaman önce soru sormak ister. Bu yüzden iletişim çağrısı tasarımın parçası olur.
            </p>
          </article>
        </div>
      </section>

      <section className="ega-section ega-container" id="sss">
        <SectionHeading
          eyebrow="Sık Sorulan Sorular"
          title="Click davranışında canlı, içerikte net bir soru-cevap alanı"
          description="Detay açılır yapıda çalışan bu bölüm, kullanıcıyı sıkmadan gerekli farkları anlatır."
        />

        <div className="ega-faq-accordion">
          {faqs.map((item) => (
            <details key={item.question} className="ega-faq-detail">
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="ega-section ega-container ega-cta-section" id="iletisim">
        <div className="ega-cta-panel">
          <div className="ega-cta-panel__copy">
            <span className="ega-pill ega-pill--warm">Bize Ulaşın</span>
            <h2>Kararsız kalan kullanıcıyı sayfa sonunda sessizce değil, net biçimde çağır.</h2>
            <p>
              Paket seçimi, koçluk süreci veya kayıt konusunda yardıma ihtiyacı olan kullanıcı için WhatsApp
              ve hesap oluşturma çağrıları görünür tutulur.
            </p>
          </div>

          <div className="ega-cta-panel__actions">
            <ButtonLink
              href="https://wa.me/905000000000?text=Merhaba%2C%20paketler%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum."
              label="WhatsApp ile Başla"
              target="_blank"
              rel="noreferrer"
            />
            <ButtonLink href="/kayit" label="Hesap Oluştur" variant="ghost" />
          </div>
        </div>
      </section>

      <footer className="ega-footer">
        <div className="ega-footer__inner">
          <div className="ega-footer__brand">
            <Image
              src="/branding/ega-logo-transparent-cropped.png"
              alt="Eğitim Gurmesi Akademi logosu"
              width={188}
              height={122}
              className="ega-footer__logo"
            />
            <p>
              Eğitim Gurmesi Akademi; kayıtlı video paketlerini, koçluk yönlendirme mantığını ve öğrenci
              hesap disiplinini tek çatı altında birleştiren yeni nesil bir eğitim satış platformu olarak kurgulanıyor.
            </p>
          </div>

          <div className="ega-footer__links">
            <a href="#paketler">Paketler</a>
            <a href="#videolar">Videolar</a>
            <a href="#neler-var">Neler Var</a>
            <a href="/giris">Öğrenci Girişi</a>
          </div>
        </div>
      </footer>

      <a className="ega-contact-bookmark" href="#iletisim" aria-label="İletişim bölümüne git">
        <span>Bize Ulaşın</span>
      </a>
    </main>
  );
}
