export type PackTone = "amber" | "teal" | "blue";

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
  price: string;
  badge: string;
  features: readonly string[];
  tone: PackTone;
  categoryId: PackageCategoryId;
  subcategoryId: PackageSubcategoryId;
  provider: "local" | "redirect";
  defaultVariantId?: string | null;
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

export const packageProducts: readonly PackageProduct[] = [
  {
    id: "pkg-online-yks-core",
    slug: "online-yks-kocluk-baslangic",
    title: "Online YKS Koçluk Başlangıç",
    subtitle: "Haftalık plan, çevrim içi görüşme ve video takibi ile düzen kuran temel paket.",
    price: "Yönlendirmeli ödeme",
    badge: "Koçluk paketi",
    features: ["Haftalık takip görüşmesi", "Yerel öğrenci hesabı", "Dış ödeme yönlendirmesi"],
    tone: "teal",
    categoryId: "online-coaching",
    subcategoryId: "yks",
    provider: "redirect"
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
    provider: "redirect"
  },
  {
    id: "pkg-online-910-core",
    slug: "online-9-10-sinif-kocluk",
    title: "Online 9. ve 10. Sınıf Koçluk",
    subtitle: "Erken dönemde temel güçlendirme ve çalışma alışkanlığı inşa etmek isteyenler için.",
    price: "Yönlendirmeli ödeme",
    badge: "Koçluk paketi",
    features: ["Rutin kurma desteği", "Sınav ve okul dengesi", "Ders arşivi ile paralel takip"],
    tone: "amber",
    categoryId: "online-coaching",
    subcategoryId: "grade-9-10",
    provider: "redirect"
  },
  {
    id: "pkg-online-11-core",
    slug: "online-11-sinif-yks-gecis",
    title: "Online 11. Sınıf YKS Geçiş Programı",
    subtitle: "11. sınıfta YKS düzenine erken geçmek isteyen öğrenciler için ara model.",
    price: "Yönlendirmeli ödeme",
    badge: "Koçluk paketi",
    features: ["TYT geçiş planı", "11. sınıf konu takibi", "Verimli haftalık bloklar"],
    tone: "teal",
    categoryId: "online-coaching",
    subcategoryId: "grade-11",
    provider: "redirect"
  },
  {
    id: "pkg-online-kpss-core",
    slug: "online-kpss-kocluk-destegi",
    title: "Online KPSS Koçluk Desteği",
    subtitle: "Yoğun iş veya okul temposuyla birlikte ilerleyen yetişkin öğrenciler için plan desteği.",
    price: "Yönlendirmeli ödeme",
    badge: "Koçluk paketi",
    features: ["Haftaya göre esnek plan", "Günlük görev listesi", "Takip odaklı yönlendirme"],
    tone: "blue",
    categoryId: "online-coaching",
    subcategoryId: "kpss",
    provider: "redirect"
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
