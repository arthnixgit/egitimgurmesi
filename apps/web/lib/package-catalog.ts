export type PackTone = "amber" | "teal" | "blue";
export type ProductIntroVideoSourceType = "DIRECT" | "EMBED";
export type PackageFeatureSpec = {
  title: string;
  description?: string;
  iconKey?: string | null;
};

export type PackageCategoryId =
  | "online-coaching"
  | "in-person-coaching"
  | "exam-camp"
  | "private-lessons"
  | "mock-exam-club"
  | "revision-camp";

export type PackageSubcategoryId =
  | "yks"
  | "lgs"
  | "grade-9-10"
  | "grade-11"
  | "kpss"
  | "camp-content"
  | "prep-calendar"
  | "private-online"
  | "private-in-person"
  | "printed-cargo"
  | "real-location"
  | "revision-flow"
  | "closing-calendar";

export type PackageSubcategory = {
  id: PackageSubcategoryId;
  label: string;
  description: string;
};

export type PackageCategory = {
  id: PackageCategoryId;
  label: string;
  description: string;
  subcategories: readonly PackageSubcategory[];
};

export type PackageProduct = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description?: string;
  price: string;
  compareAtPrice?: string | null;
  hasInstallments?: boolean;
  installmentLabel?: string | null;
  badge: string;
  features: readonly string[];
  featureDetails?: readonly PackageFeatureSpec[];
  tone: PackTone;
  categoryId: PackageCategoryId;
  subcategoryId: PackageSubcategoryId;
  provider: "local" | "redirect";
  defaultVariantId?: string | null;
  introVideoSourceType?: ProductIntroVideoSourceType | null;
  introVideoUrl?: string | null;
  introVideoPosterUrl?: string | null;
  introVideoTitle?: string | null;
  externalProductId?: string | null;
  externalVariantId?: string | null;
};

const coachingTracks: readonly PackageSubcategory[] = [
  { id: "yks", label: "YKS", description: "Yoğun sınav hazırlığı ve haftalık takip akışı." },
  { id: "lgs", label: "LGS", description: "Ortaokul çıkış sürecine uygun kontrollü koçluk düzeni." },
  { id: "grade-9-10", label: "9. ve 10. Sınıflar", description: "Temel güçlendirme ve rutin kurma." },
  { id: "grade-11", label: "11. Sınıf", description: "YKS düzenine erken geçiş ve seviye sabitleme." },
  { id: "kpss", label: "KPSS", description: "Yetişkin öğrenci temposuna göre planlanan destek." }
] as const;

export const packageCategories: readonly PackageCategory[] = [
  {
    id: "online-coaching",
    label: "Online Koçluk",
    description: "Uzaktan takip, görüntülü görüşme ve plan odaklı koçluk paketleri.",
    subcategories: coachingTracks
  },
  {
    id: "in-person-coaching",
    label: "Yüz Yüze Koçluk",
    description: "Fiziksel görüşme ve birebir temas isteyen öğrenciler için saha bazlı akış.",
    subcategories: coachingTracks
  },
  {
    id: "exam-camp",
    label: "Yazılı Kampı (Hazırlık)",
    description: "Hazırlık, tekrar ve kamp bloklarıyla hızlandırılmış dönem paketleri.",
    subcategories: [
      { id: "camp-content", label: "Kamp İçeriği", description: "Konu, video ve kaynak seti." },
      { id: "prep-calendar", label: "Hazırlık Takvimi", description: "Kamp öncesi ve kamp sırası plan akışı." }
    ]
  },
  {
    id: "private-lessons",
    label: "Özel Ders",
    description: "Tek ders veya ders grubu bazında birebir destek seçenekleri.",
    subcategories: [
      { id: "private-online", label: "Online", description: "Canlı bağlantı üzerinden birebir ders." },
      { id: "private-in-person", label: "Yüz Yüze", description: "Fiziksel ortamda işlenen birebir ders." }
    ]
  },
  {
    id: "mock-exam-club",
    label: "Deneme Kulübü",
    description: "Deneme çözümü, analiz ve geri dönüş takibini düzenleyen kulüp yapısı.",
    subcategories: [
      { id: "printed-cargo", label: "Basılı Kargo", description: "Deneme setlerinin kargo ile gönderildiği akış." },
      { id: "real-location", label: "Gerçek Mekan", description: "Gerçek sınav ortamında uygulanan denemeler." }
    ]
  },
  {
    id: "revision-camp",
    label: "Tekrar Kampı",
    description: "Son düzlüğe uygun tekrar blokları ve kapanış takvimleri.",
    subcategories: [
      { id: "revision-flow", label: "Tekrar Planı", description: "Liste bazlı tekrar ve konu kapanış akışı." },
      { id: "closing-calendar", label: "Başvuru Takvimi", description: "Kamp başlangıcı ve kapanış tarih planı." }
    ]
  }
] as const;

const unikazanYks2026FeatureDetails = [
  {
    title: "⭐️ 2025 YKS 1. 2. ve 3.sünden özel taktikleri alma imkanı",
    description: ""
  },
  {
    title: "✔️ Koçunla her hafta 2 birebir görüşme",
    description:
      "Sınav yalnız geçilmez. Alanında uzman koçunla haftada iki kez birebir görüşme yap, hedeflerine özel yol haritanı birlikte oluştur."
  },
  {
    title: "📅 Kişiye özel günlük program",
    description:
      "Her gün ne yapacağını bilmek özgürlüktür. Zaman yönetimini senin yerine biz planlıyoruz, sen sadece uygulamaya odaklanıyorsun."
  },
  {
    title:
      "📚 Canlı ders ve kayıt erişimi → Orijinal, Bilgi Sarmal, Orbital, Coğrafya'nın Gurmesi, Biyotik ve daha fazlası",
    description:
      "Yayınların en iyileri, şimdi ekranında. Orijinal, Orbital, Biyotik, Bilgi Sarmal gibi yayınların yazarlarından canlı dersler ve tekrar kayıtları elinin altında."
  },
  {
    title: "🧠 Türkçe, Matematik, Geometri ve Fizik her hafta canlı ders",
    description:
      "Temel derslerde haftalık destek. Her hafta düzenli yapılan canlı derslerle konuları sağlamlaştır, eksiklerini anında kapat."
  },
  {
    title: "🔄 Sınırsız soru çözdürme hakkı",
    description:
      "Takıldığın her soru, çözülmeyi bekler. İster koçuna, ister yapay zekaya sor. Cevapsız soru kalmaz."
  },
  {
    title: "📄 100+ deneme PDF'ine erişim",
    description:
      "Hazır mısın? Deneyerek gör. Yüzlerce denemeye anında eriş, farklı yayınlardan farklı tarz sorularla sınav pratiği kazan."
  },
  {
    title: "🎙️ Derece öğrencileriyle soru-cevap yayınları",
    description:
      "Türkiye derecesinden birebir deneyim aktarımı. En başarılı öğrencilerle canlı yayınlarda buluş, taktiklerini dinle, motivasyonunu artır."
  },
  {
    title: "🏆 Son Viraj Kampı Hediye",
    description:
      "Şampiyonlar Kampı kapsamında özel dersler, canlı anlatımlar ve strateji odaklı içeriklere ücretsiz erişim sağlanır. Sınav sürecini doğru planla, eksiklerini bilinçli şekilde kapat."
  },
  {
    title: "🌟 Hem PDR hem derece öğrencileriyle rehberlik",
    description:
      "Rehberlik hizmetimizde hem Psikolojik Danışmanlık ve Rehberlik (PDR) alanında uzman koçlarımız hem de derece yapmış öğrencilerimizle, sınav sürecinde ihtiyaç duyduğun akademik ve motivasyonel destek bir arada sunulmaktadır."
  },
  {
    title: "♾️ Derece öğrencilerine sınırsız soru sorma hakkı",
    description:
      "Çözemediğin sorular seni durdurmasın! Derece yapmış öğrenciler, takıldığın her soruyu senin için adım adım çözüyor."
  },
  {
    title: "🏆 Şampiyonlar Kampı Ve Özel Ders Kayıtlarına Erişim",
    description:
      "Şampiyonlar Kampı kapsamındaki özel ders kayıtlarına, canlı anlatımlara ve strateji odaklı içeriklere ücretsiz erişim sağlarsın. Sınav sürecini doğru planlayarak eksiklerini bilinçli şekilde kapatabilirsin."
  }
] satisfies readonly PackageFeatureSpec[];

const unikazanYks2027FeatureDetails = [
  ...unikazanYks2026FeatureDetails.slice(0, 8),
  {
    title: "📦 15'li Kurumsal Deneme Paketi",
    description:
      "Gerçek sınav ortamı deneyimi. Evine kadar gönderilen denemelerle kendini ölç, eksiklerini belirle, her çözüme ulaş."
  },
  unikazanYks2026FeatureDetails[9],
  unikazanYks2026FeatureDetails[10],
  {
    title: "🎁 Deneme Kulübü ve Sanal Dershane Hediyesi",
    description:
      "Evinden çıkmadan, seviyene ve hedefine özel hazırlanmış sanal dershaneye ücretsiz erişim! Hedef odaklı kaynaklar, ders programı ve takip sistemiyle tam destek."
  }
] satisfies readonly PackageFeatureSpec[];

const unikazanMaarifYillikFeatureDetails = [
  {
    title: "✔️ Koçunla her hafta 2 birebir görüşme",
    description:
      "Sınav yalnız geçilmez. Alanında uzman koçunla haftada iki kez birebir görüşme yap, hedeflerine özel yol haritanı birlikte oluştur."
  },
  {
    title: "📅 Kişiye özel günlük program",
    description:
      "Her gün ne yapacağını bilmek özgürlüktür. Zaman yönetimini senin yerine biz planlıyoruz, sen sadece uygulamaya odaklanıyorsun."
  },
  {
    title: "🔄 Sınırsız soru çözdürme hakkı",
    description:
      "Takıldığın her soru, çözülmeyi bekler. İster koçuna, ister yapay zekaya sor. Cevapsız soru kalmaz."
  },
  {
    title: "📄 100+ özel PDF'e erişim",
    description:
      "Hazır mısın? Deneyerek gör. Yüzlerce denemeye anında eriş, farklı yayınlardan farklı tarz sorularla sınav pratiği kazan."
  },
  {
    title: "🎙️ Derece öğrencileriyle soru-cevap",
    description:
      "Türkiye derecesinden birebir deneyim aktarımı. En başarılı öğrencilerle canlı yayınlarda buluş, taktiklerini dinle, motivasyonunu artır."
  },
  {
    title: "🌟 Hem PDR hem derece öğrencileriyle rehberlik",
    description:
      "Rehberlik hizmetimizde hem Psikolojik Danışmanlık ve Rehberlik (PDR) alanında uzman koçlarımız hem de derece yapmış öğrencilerimizle, sınav sürecinde ihtiyaç duyduğun akademik ve motivasyonel destek bir arada sunulmaktadır."
  },
  {
    title: "♾️ Derece öğrencilerine sınırsız soru sorma hakkı",
    description:
      "Çözemediğin sorular seni durdurmasın! Derece yapmış öğrenciler, takıldığın her soruyu senin için adım adım çözüyor."
  }
] satisfies readonly PackageFeatureSpec[];

const unikazanGrade11FeatureDetails = [
  {
    title: "✔️ Koçunla her hafta 2 birebir görüşme",
    description:
      "Sınav yalnız geçilmez. Alanında uzman koçunla haftada iki kez birebir görüşme yap, hedeflerine özel yol haritanı birlikte oluştur."
  },
  {
    title: "📅 Kişiye özel günlük program",
    description:
      "Her gün ne yapacağını bilmek özgürlüktür. Zaman yönetimini senin yerine biz planlıyoruz, sen sadece uygulamaya odaklanıyorsun."
  },
  {
    title: "📚 Canlı ders ve kayıt erişimi → Orijinal, Bilgi Sarmal, Orbital, Coğrafya'nın Gurmesi, Biyotik ve daha fazlası",
    description:
      "Yayınların en iyileri, şimdi ekranında. Orijinal, Orbital, Biyotik, Bilgi Sarmal gibi yayınların yazarlarından canlı dersler ve tekrar kayıtları elinin altında."
  },
  {
    title: "🧠 Türkçe, Matematik, Geometri ve Fizik her hafta canlı ders",
    description:
      "Temel derslerde haftalık destek. Her hafta düzenli yapılan canlı derslerle konuları sağlamlaştır, eksiklerini anında kapat."
  },
  {
    title: "🔄 Sınırsız soru çözdürme hakkı",
    description:
      "Takıldığın her soru, çözülmeyi bekler. İster koçuna, ister yapay zekaya sor. Cevapsız soru kalmaz."
  },
  {
    title: "📄 100+ deneme PDF'ine erişim",
    description:
      "Hazır mısın? Deneyerek gör. Yüzlerce denemeye anında eriş, farklı yayınlardan farklı tarz sorularla sınav pratiği kazan."
  },
  {
    title: "🎙️ Derece öğrencileriyle soru-cevap",
    description:
      "Türkiye derecesinden birebir deneyim aktarımı. En başarılı öğrencilerle canlı yayınlarda buluş, taktiklerini dinle, motivasyonunu artır."
  },
  {
    title: "🌟 Hem PDR hem derece öğrencileriyle rehberlik",
    description:
      "Rehberlik hizmetimizde hem Psikolojik Danışmanlık ve Rehberlik (PDR) alanında uzman koçlarımız hem de derece yapmış öğrencilerimizle, sınav sürecinde ihtiyaç duyduğun akademik ve motivasyonel destek bir arada sunulmaktadır."
  },
  {
    title: "♾️ Derece öğrencilerine sınırsız soru sorma hakkı",
    description:
      "Çözemediğin sorular seni durdurmasın! Derece yapmış öğrenciler, takıldığın her soruyu senin için adım adım çözüyor."
  }
] satisfies readonly PackageFeatureSpec[];

const unikazanKpssAylikFeatureDetails = [
  { title: "🤝 Koçunla Her Hafta 2 Birebir Görüşme", description: "" },
  { title: "🗓️ Her Hafta Size Özel Hazırlanacak Ders Çalışma Programı", description: "" },
  {
    title: "📊 Deneme sonuçlarını koçunla analiz etme, deneme sonuçlarına göre yönlendirme",
    description: ""
  },
  { title: "📝 Sınırsız Soru Çözdürme Hakkı", description: "" },
  { title: "💬 WhatsApp Soru Çözüm Grubu", description: "" },
  { title: "🔥 Çalışmalarda Motivasyon Sağlama ve Kaygı Yönetimini Destekleme", description: "" },
  { title: "📚 Planlı ve Disiplinli Çalışma Alışkanlığı Kazandırma", description: "" }
] satisfies readonly PackageFeatureSpec[];

export const packageProducts: readonly PackageProduct[] = [
  {
    id: "pkg-unikazan-yks-2026-full",
    slug: "yks-sinava-kadar-full-paket",
    title: "YKS Sınava Kadar Full Paket",
    subtitle:
      "Haftada 2 birebir görüşme, kişiye özel günlük program, canlı ders ve kayıt erişimiyle YKS hazırlık paketi.",
    description:
      "Unikazan YKS koçluk paketi; birebir görüşme, kişiye özel günlük program, canlı ders kayıtları, deneme PDF erişimi, derece öğrencileriyle soru-cevap yayınları ve rehberlik desteğini tek pakette toplar.",
    price: "3.599 TRY",
    compareAtPrice: "4.800 TRY",
    hasInstallments: true,
    installmentLabel: "12 Aya Varan Taksit",
    badge: "Koçluk paketi",
    features: unikazanYks2026FeatureDetails.map((feature) => feature.title),
    featureDetails: unikazanYks2026FeatureDetails,
    tone: "teal",
    categoryId: "online-coaching",
    subcategoryId: "yks",
    provider: "redirect",
    defaultVariantId: "pkg-unikazan-yks-2026-full-standard",
    introVideoSourceType: "DIRECT",
    introVideoTitle: "YKS Sınava Kadar Full Paket tanıtım videosu",
    externalProductId: "11",
    externalVariantId: "standard"
  },
  {
    id: "pkg-unikazan-yks-2027-full",
    slug: "2027-yks-sinava-kadar-full-paket",
    title: "2027 YKS Sınava Kadar Full Paket",
    subtitle:
      "2027 YKS süreci için birebir koçluk, günlük program, canlı ders, deneme ve sanal dershane desteği.",
    description:
      "Unikazan 2027 YKS koçluk paketi; haftalık birebir koçluk, kişiye özel günlük program, canlı ders kayıtları, 15'li kurumsal deneme paketi, deneme kulübü ve sanal dershane hediyesiyle uzun dönem hazırlık akışı sunar.",
    price: "49.999 TRY",
    compareAtPrice: "74.999 TRY",
    hasInstallments: true,
    installmentLabel: "12 Aya Varan Taksit",
    badge: "Koçluk paketi",
    features: unikazanYks2027FeatureDetails.map((feature) => feature.title),
    featureDetails: unikazanYks2027FeatureDetails,
    tone: "blue",
    categoryId: "online-coaching",
    subcategoryId: "yks",
    provider: "redirect",
    defaultVariantId: "pkg-unikazan-yks-2027-full-standard",
    introVideoSourceType: "DIRECT",
    introVideoTitle: "2027 YKS Sınava Kadar Full Paket tanıtım videosu",
    externalProductId: "25",
    externalVariantId: "standard"
  },
  {
    id: "pkg-online-lgs-core",
    slug: "online-lgs-kocluk-duzeni",
    title: "Online LGS Koçluk Düzeni",
    subtitle: "Ders rutini kurmak ve veliyle görünür takip yapmak isteyen öğrenciler için.",
    price: "Yönlendirmeli ödeme",
    badge: "Koçluk paketi",
    features: ["LGS odaklı görüşme akışı", "Aile bilgilendirme notları", "Plan ve tempo takibi"],
    tone: "blue",
    categoryId: "online-coaching",
    subcategoryId: "lgs",
    provider: "redirect",
    introVideoSourceType: "DIRECT",
    introVideoTitle: "Online LGS Koçluk Düzeni tanıtım videosu",
    externalProductId: "13",
    externalVariantId: "media"
  },
  {
    id: "pkg-online-910-core",
    slug: "online-9-10-sinif-kocluk",
    title: "Maarif Eğitim Modeli (Yıllık Koçluk Paketi)",
    subtitle: "En Çok Tercih Edilen · Sınava Kadar",
    price: "3.599 TRY",
    compareAtPrice: "4.800 TRY",
    hasInstallments: true,
    installmentLabel: "12 Aya Varan Taksit",
    badge: "Koçluk paketi",
    features: unikazanMaarifYillikFeatureDetails.map((feature) => feature.title),
    featureDetails: unikazanMaarifYillikFeatureDetails,
    tone: "amber",
    categoryId: "online-coaching",
    subcategoryId: "grade-9-10",
    provider: "redirect",
    introVideoSourceType: "DIRECT",
    introVideoTitle: "Online 9. ve 10. Sınıf Koçluk tanıtım videosu",
    externalProductId: "21",
    externalVariantId: "media"
  },
  {
    id: "pkg-online-11-core",
    slug: "online-11-sinif-yks-gecis",
    title: "11.Sınıf Senelik Full Paket",
    subtitle: "✦ 2026 YKS · Sınava Kadar",
    price: "3.599 TRY",
    compareAtPrice: "4.800 TRY",
    hasInstallments: true,
    installmentLabel: "12 Aya Varan Taksit",
    badge: "Koçluk paketi",
    features: unikazanGrade11FeatureDetails.map((feature) => feature.title),
    featureDetails: unikazanGrade11FeatureDetails,
    tone: "teal",
    categoryId: "online-coaching",
    subcategoryId: "grade-11",
    provider: "redirect",
    introVideoSourceType: "DIRECT",
    introVideoTitle: "Online 11. Sınıf YKS Geçiş Programı tanıtım videosu",
    externalProductId: "18",
    externalVariantId: "media"
  },
  {
    id: "pkg-online-kpss-core",
    slug: "online-kpss-kocluk-destegi",
    title: "KPSS Aylık Paket",
    subtitle: "1 Aylık Koçluk · Aylık",
    price: "3.599 TRY",
    compareAtPrice: "4.800 TRY",
    hasInstallments: false,
    installmentLabel: null,
    badge: "Koçluk paketi",
    features: unikazanKpssAylikFeatureDetails.map((feature) => feature.title),
    featureDetails: unikazanKpssAylikFeatureDetails,
    tone: "blue",
    categoryId: "online-coaching",
    subcategoryId: "kpss",
    provider: "redirect",
    introVideoSourceType: "DIRECT",
    introVideoTitle: "Online KPSS Koçluk Desteği tanıtım videosu",
    externalProductId: "23",
    externalVariantId: "media"
  },
  {
    id: "pkg-inperson-yks-core",
    slug: "yuz-yuze-yks-kocluk",
    title: "Yüz Yüze YKS Koçluk",
    subtitle: "Fiziksel görüşme ve sahada daha yakın takip isteyen öğrenciler için birebir model.",
    price: "Yönlendirmeli ödeme",
    badge: "Koçluk paketi",
    features: ["Yüz yüze görüşme planı", "Hedef kontrol listesi", "Düzenli performans notları"],
    tone: "teal",
    categoryId: "in-person-coaching",
    subcategoryId: "yks",
    provider: "redirect"
  },
  {
    id: "pkg-inperson-lgs-core",
    slug: "yuz-yuze-lgs-kocluk",
    title: "Yüz Yüze LGS Koçluk",
    subtitle: "Ortaokul öğrencisine yakın temas ve disiplin desteği sağlamak için hazırlanan akış.",
    price: "Yönlendirmeli ödeme",
    badge: "Koçluk paketi",
    features: ["Veli kontrollü görüşme notları", "Ders ve deneme rutini", "Yakın takip modeli"],
    tone: "amber",
    categoryId: "in-person-coaching",
    subcategoryId: "lgs",
    provider: "redirect"
  },
  {
    id: "pkg-inperson-910-core",
    slug: "yuz-yuze-9-10-sinif-kocluk",
    title: "Yüz Yüze 9. ve 10. Sınıf Koçluk",
    subtitle: "Erken dönemde çalışma kültürünü yerleştirmek isteyen lise öğrencileri için saha paketi.",
    price: "Yönlendirmeli ödeme",
    badge: "Koçluk paketi",
    features: ["Okul uyumlu ders planı", "Sınav öncesi mini kontroller", "Alışkanlık takibi"],
    tone: "blue",
    categoryId: "in-person-coaching",
    subcategoryId: "grade-9-10",
    provider: "redirect"
  },
  {
    id: "pkg-inperson-11-core",
    slug: "yuz-yuze-11-sinif-kocluk",
    title: "Yüz Yüze 11. Sınıf Koçluk",
    subtitle: "11. sınıfta net bir hedef sistemi kurmak isteyen öğrencilere uygun takip modeli.",
    price: "Yönlendirmeli ödeme",
    badge: "Koçluk paketi",
    features: ["YKS geçiş ritmi", "Yakın görüşme planı", "Haftalık gelişim kontrolü"],
    tone: "teal",
    categoryId: "in-person-coaching",
    subcategoryId: "grade-11",
    provider: "redirect"
  },
  {
    id: "pkg-inperson-kpss-core",
    slug: "yuz-yuze-kpss-kocluk",
    title: "Yüz Yüze KPSS Koçluk",
    subtitle: "Yoğun program içindeki yetişkin öğrenciye düzenli saha disiplini veren model.",
    price: "Yönlendirmeli ödeme",
    badge: "Koçluk paketi",
    features: ["Birebir görüşme günü", "Süreç notu", "Hedef bazlı tekrar sistemi"],
    tone: "amber",
    categoryId: "in-person-coaching",
    subcategoryId: "kpss",
    provider: "redirect"
  },
  {
    id: "pkg-camp-content",
    slug: "yazili-kampi-icerik-paketi",
    title: "Yazılı Kampı İçerik Paketi",
    subtitle: "Kamp boyunca izlenecek video seti, kaynak akışı ve günlük çalışma blokları.",
    price: "₺2.690",
    badge: "Video + kaynak",
    features: ["Kamp video listesi", "Konu bazlı tekrar kartları", "Hazır görev akışı"],
    tone: "amber",
    categoryId: "exam-camp",
    subcategoryId: "camp-content",
    provider: "local"
  },
  {
    id: "pkg-camp-calendar",
    slug: "yazili-kampi-hazirlik-takvimi",
    title: "Yazılı Kampı Hazırlık Takvimi",
    subtitle: "Kamp öncesi eksikleri kapatıp kampı verimli geçirmek isteyenlere uygun hazırlık seti.",
    price: "₺1.990",
    badge: "Hazırlık programı",
    features: ["Ön hazırlık haftası", "Kamp giriş ölçümü", "Takvim odaklı ilerleme"],
    tone: "blue",
    categoryId: "exam-camp",
    subcategoryId: "prep-calendar",
    provider: "local"
  },
  {
    id: "pkg-private-online",
    slug: "online-ozel-ders",
    title: "Online Özel Ders",
    subtitle: "Tek ders veya konu bazında birebir çevrim içi çalışma yapmak isteyenler için.",
    price: "₺1.250 / ders",
    badge: "Birebir ders",
    features: ["Canlı bağlantı", "Konuya özel hazırlık", "Ders sonrası not paylaşımı"],
    tone: "teal",
    categoryId: "private-lessons",
    subcategoryId: "private-online",
    provider: "local"
  },
  {
    id: "pkg-private-inperson",
    slug: "yuz-yuze-ozel-ders",
    title: "Yüz Yüze Özel Ders",
    subtitle: "Fiziksel ortamda, konuya göre özelleştirilmiş birebir çalışma isteyen öğrenciler için.",
    price: "₺1.650 / ders",
    badge: "Birebir ders",
    features: ["Saha bazlı ders planı", "Ders öncesi hedef belirleme", "Takipli çalışma özeti"],
    tone: "blue",
    categoryId: "private-lessons",
    subcategoryId: "private-in-person",
    provider: "local"
  },
  {
    id: "pkg-mock-printed",
    slug: "deneme-kulubu-basili-kargo",
    title: "Deneme Kulübü Basılı Kargo",
    subtitle: "Denemelerin eve ulaştığı, çözüm ve geri dönüşün düzenli takip edildiği kulüp modeli.",
    price: "₺1.990",
    badge: "Deneme kulübü",
    features: ["Basılı deneme kargosu", "Çözüm planı", "Eksik konu listesi"],
    tone: "amber",
    categoryId: "mock-exam-club",
    subcategoryId: "printed-cargo",
    provider: "local"
  },
  {
    id: "pkg-mock-location",
    slug: "deneme-kulubu-gercek-mekan",
    title: "Deneme Kulübü Gerçek Mekan",
    subtitle: "Gerçek sınav hissini koruyan fiziksel uygulama ve sonrasında analiz desteği.",
    price: "₺2.290",
    badge: "Deneme kulübü",
    features: ["Gerçek salon deneyimi", "Sınav sonrası analiz", "Net artışına dönük geri dönüş"],
    tone: "teal",
    categoryId: "mock-exam-club",
    subcategoryId: "real-location",
    provider: "local"
  },
  {
    id: "pkg-revision-flow",
    slug: "tekrar-kampi-plani",
    title: "Tekrar Kampı Planı",
    subtitle: "Konu kapanışlarını net bir tekrar sırasına oturtmak isteyenler için hızlı paket.",
    price: "₺2.350",
    badge: "Tekrar kampı",
    features: ["Liste bazlı tekrar", "Kısa video dönüşleri", "Son viraj tempo akışı"],
    tone: "blue",
    categoryId: "revision-camp",
    subcategoryId: "revision-flow",
    provider: "local"
  },
  {
    id: "pkg-revision-calendar",
    slug: "tekrar-kampi-basvuru-takvimi",
    title: "Tekrar Kampı Başvuru Takvimi",
    subtitle: "Kamp tarihleri, grup yapısı ve başvuru planıyla birlikte ilerleyen düzenli kapanış paketi.",
    price: "₺1.790",
    badge: "Takvimli kapanış",
    features: ["Başlangıç ve kapanış tarihleri", "Grup düzeni", "Takvim odaklı çalışma blokları"],
    tone: "amber",
    categoryId: "revision-camp",
    subcategoryId: "closing-calendar",
    provider: "local"
  }
] as const;

export function buildPackagesPageHref(
  categoryId?: PackageCategoryId | null,
  subcategoryId?: PackageSubcategoryId | null
) {
  const params = new URLSearchParams();

  if (categoryId) {
    params.set("kategori", categoryId);
  }

  if (subcategoryId) {
    params.set("alt", subcategoryId);
  }

  const query = params.toString();
  return query ? `/paketlerimiz?${query}` : "/paketlerimiz";
}

export function getPackageCategoryById(categoryId: string | null | undefined) {
  return packageCategories.find((category) => category.id === categoryId) ?? null;
}

export function getPackageSubcategoryById(subcategoryId: string | null | undefined) {
  for (const category of packageCategories) {
    const subcategory = category.subcategories.find((item) => item.id === subcategoryId);

    if (subcategory) {
      return subcategory;
    }
  }

  return null;
}

export function getCategoryBySubcategoryId(subcategoryId: string | null | undefined) {
  for (const category of packageCategories) {
    if (category.subcategories.some((item) => item.id === subcategoryId)) {
      return category;
    }
  }

  return null;
}

export function getPackagesForFilter(
  categoryId?: string | null,
  subcategoryId?: string | null
) {
  return packageProducts.filter((pack) => {
    if (categoryId && pack.categoryId !== categoryId) {
      return false;
    }

    if (subcategoryId && pack.subcategoryId !== subcategoryId) {
      return false;
    }

    return true;
  });
}

export function getPackageBySlug(slug: string) {
  return packageProducts.find((pack) => pack.slug === slug) ?? null;
}
