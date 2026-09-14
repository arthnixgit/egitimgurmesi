/**
 * Marketing page definitions shared by the full seed and the additive
 * page-backfill script.
 *
 * These lived inside seed.ts, which meant the only way to create a missing page
 * was to run the whole seed — and seedMarketingPages() deletes and recreates the
 * sections of every page it touches. On an environment where a customer has
 * already edited the homepage that is destructive. Sharing the data lets a
 * create-only script add the pages that are absent without going near the ones
 * that exist.
 */
export const marketingPages = [
  {
    key: "home",
    slug: "home",
    title: "Ana Sayfa",
    excerpt: "Kayıt, paket seçimi, ücretsiz materyaller ve koçluk vitrini.",
    description: "Eğitim Gurmesi Akademi ana sayfa içerikleri.",
    pageType: "HOME",
    seoTitle: "Eğitim Gurmesi Akademi",
    seoDescription: "Video paketleri, koçluk programları ve ücretsiz öğrenci kaynakları.",
    sections: [
      {
        sectionKey: "showcase-hero",
        eyebrow: "Eğitim Gurmesi Akademi",
        title: "Başarıya giden yolu ilk ekranda sadeleştiriyoruz",
        body: "Öğrenciye doğru paket, net takip ve güven veren çalışma düzenini tek vitrin içinde anlatır.",
        variantKey: "showcase-hero",
        sortOrder: 10,
        payload: {
          slides: [
            {
              id: "showcase-plan",
              label: "Başarıya Hazırlık",
              title: "Başarı planı ilk günden hazır",
              description:
                "Kayıttan sonra öğrenci; hedefe uygun paket, haftalık çalışma ritmi ve takip ekranı ile ne yapacağını net biçimde görür.",
              tone: "amber",
              mediaType: "IMAGE",
              mediaUrl: "/homepage/showcase-plan.png",
              mediaAlt: "Düzenli çalışan başarılı öğrenci"
            },
            {
              id: "showcase-coach",
              label: "Birebir Yönlendirme",
              title: "Koçlukla karar süreci sadeleşir",
              description:
                "Öğrenci ve veli; hedefleri, eksikleri ve doğru çalışma temposunu anlaşılır bir görüşme akışıyla netleştirir.",
              tone: "teal",
              mediaType: "IMAGE",
              mediaUrl: "/homepage/showcase-coach.png",
              mediaAlt: "Koçluk desteğiyle hedef belirleyen başarılı öğrenci"
            },
            {
              id: "showcase-library",
              label: "Dijital Çalışma Alanı",
              title: "Ders arşivi tek panelde hazır",
              description:
                "Canlı ders, video tekrar ve kaynak erişimi aynı hesapta toplanır; öğrenci kaldığı yerden güvenle devam eder.",
              tone: "blue",
              mediaType: "IMAGE",
              mediaUrl: "/homepage/showcase-library.png",
              mediaAlt: "Online ders izleyen başarılı öğrenci"
            }
          ],
          ctaPrimary: { label: "Paketleri İncele", href: "/paketlerimiz" },
          ctaSecondary: { label: "Ücretsiz Materyaller", href: "/ucretsiz-materyaller" }
        }
      },
      {
        sectionKey: "logo-rail",
        eyebrow: "Canlı akış",
        title: "Hareketli logo ve alan ritmi",
        body: "Kurumsal vitrin, kamp ve içerik akışının arasında nefes alan alan.",
        variantKey: "logo-rail",
        sortOrder: 20,
        payload: {
          items: ["Fen Sprinti", "Koçluk Takibi", "Deneme Analizi", "Tekrar Serisi", "Temel Hazırlık"]
        }
      },
      {
        sectionKey: "package-surface",
        eyebrow: "",
        title: "Sana En Uygun Paketi Seç",
        body: "",
        variantKey: "packages-surface",
        sortOrder: 30,
        payload: {
          featuredCategories: ["online-coaching", "in-person-coaching", "exam-camp"]
        }
      }
    ]
  },
  {
    key: "packages",
    slug: "paketlerimiz",
    title: "Paketlerimiz",
    excerpt: "Kategori ve alt kategori bazlı ürün dizini.",
    description: "Koçluk, kamp, özel ders ve video paketi içerikleri.",
    pageType: "DIRECTORY",
    seoTitle: "Paketlerimiz",
    seoDescription: "Koçluk, kamp ve video paketlerini kategori bazında inceleyin.",
    sections: [
      {
        sectionKey: "packages-directory-intro",
        eyebrow: "",
        title: "Sana En Uygun Paketi Seç",
        body: "",
        variantKey: "directory-intro",
        sortOrder: 10,
        payload: {}
      }
    ]
  },
  {
    key: "in-person-coaching",
    slug: "yuz-yuze-kocluk",
    title: "Yüz Yüze Koçluk",
    excerpt: "Ankara merkezli yüz yüze koçluk vitrini.",
    description: "Koçluk ürünleri, süreç anlatımı ve yönlendirme akışı.",
    pageType: "LANDING",
    seoTitle: "Yüz Yüze Koçluk",
    seoDescription: "Ankara merkezli yüz yüze koçluk akışını inceleyin.",
    sections: [
      {
        sectionKey: "coaching-hero",
        eyebrow: "Yüz Yüze Koçluk",
        title: "Birebir takip modeli ve paket akışı",
        body: "Koçluk görüşmesi, yönlendirme ve süreç takibi aynı landing sayfasında toplanır.",
        variantKey: "coaching-hero",
        sortOrder: 10,
        payload: {
          city: "Ankara",
          ctaPrimary: { label: "Detaylı Bilgi Al", href: "#" },
          ctaSecondary: { label: "Paketleri İncele", href: "/paketlerimiz?kategori=in-person-coaching" }
        }
      }
    ]
  },
  {
    key: "academic-staff",
    slug: "akademik-kadro",
    title: "Akademik Kadro",
    excerpt: "Koçlarımız ve öğretmenlerimiz için dikey akış sayfası.",
    description: "Koçlarımız ve öğretmenlerimiz alanı.",
    pageType: "CONTENT",
    seoTitle: "Akademik Kadro",
    seoDescription: "Koçlarımızı ve öğretmenlerimizi inceleyin.",
    sections: []
  },
  {
    key: "success-stories",
    slug: "basarilarimiz",
    title: "Başarılarımız",
    excerpt: "Öğrenci dönüşümleri ve başarı hikâyeleri.",
    description: "Başarı hikâyeleri ve öne çıkan sonuçlar.",
    pageType: "CONTENT",
    seoTitle: "Başarılarımız",
    seoDescription: "Öğrenci başarı hikâyelerini inceleyin.",
    sections: []
  },
  {
    key: "free-materials",
    slug: "ucretsiz-materyaller",
    title: "Ücretsiz Materyaller",
    excerpt: "Açık erişimli araçlar, PDF içerikler ve rehberlik kaynakları.",
    description: "Ücretsiz öğrenci kaynakları alanı.",
    pageType: "DIRECTORY",
    seoTitle: "Ücretsiz Materyaller",
    seoDescription: "Ücretsiz araçlar, PDF dökümanlar ve rehberlik içerikleri.",
    sections: []
  },
  {
    key: "about",
    slug: "hakkimizda",
    title: "Hakkımızda",
    excerpt: "Marka yaklaşımı, ekip ve sistem vizyonu.",
    description: "Eğitim Gurmesi Akademi marka ve yaklaşım sayfası.",
    pageType: "CONTENT",
    seoTitle: "Hakkımızda",
    seoDescription: "Eğitim Gurmesi Akademi hakkında daha fazla bilgi alın.",
    sections: [
      {
        sectionKey: "about-intro",
        eyebrow: "Yaklaşımımız",
        title: "Koçluk, içerik ve öğrenci düzenini aynı sistemde topluyoruz",
        body: "Marka yaklaşımı; düzen, görünür takip ve kontrollü öğrenci akışı üzerine kurulur.",
        variantKey: "about-intro",
        sortOrder: 10,
        payload: {}
      }
    ]
  }
] as const;
