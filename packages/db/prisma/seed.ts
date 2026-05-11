import { PrismaClient } from "@prisma/client";
import { DEFAULT_PERMISSIONS, DEFAULT_ROLES, ROLE_KEYS } from "../src";
import { packageCategories, packageProducts } from "../../../apps/web/lib/package-catalog";

const prisma = new PrismaClient();
const PUBLISHED = "PUBLISHED" as const;
const PRIMARY = "PRIMARY" as const;

const primaryNavigationItems = [
  {
    itemKey: "packages",
    label: "Paketlerimiz",
    href: "/paketlerimiz",
    children: [
      {
        itemKey: "packages-online-coaching",
        label: "Online Koçluk",
        href: "/paketlerimiz?kategori=online-coaching",
        description: "Uzaktan takip ve haftalık koçluk akışı.",
        children: [
          { itemKey: "packages-online-coaching-yks", label: "YKS", href: "/paketlerimiz?kategori=online-coaching&alt=yks" },
          { itemKey: "packages-online-coaching-lgs", label: "LGS", href: "/paketlerimiz?kategori=online-coaching&alt=lgs" },
          { itemKey: "packages-online-coaching-grade-9-10", label: "9. ve 10. Sınıflar", href: "/paketlerimiz?kategori=online-coaching&alt=grade-9-10" },
          { itemKey: "packages-online-coaching-grade-11", label: "11. Sınıf", href: "/paketlerimiz?kategori=online-coaching&alt=grade-11" },
          { itemKey: "packages-online-coaching-kpss", label: "KPSS", href: "/paketlerimiz?kategori=online-coaching&alt=kpss" }
        ]
      },
      {
        itemKey: "packages-in-person-coaching",
        label: "Yüz Yüze Koçluk",
        href: "/yuz-yuze-kocluk",
        description: "Ankara merkezli birebir takip modeli.",
        children: [
          { itemKey: "packages-in-person-coaching-yks", label: "YKS", href: "/paketlerimiz?kategori=in-person-coaching&alt=yks" },
          { itemKey: "packages-in-person-coaching-lgs", label: "LGS", href: "/paketlerimiz?kategori=in-person-coaching&alt=lgs" },
          { itemKey: "packages-in-person-coaching-grade-9-10", label: "9. ve 10. Sınıflar", href: "/paketlerimiz?kategori=in-person-coaching&alt=grade-9-10" },
          { itemKey: "packages-in-person-coaching-grade-11", label: "11. Sınıf", href: "/paketlerimiz?kategori=in-person-coaching&alt=grade-11" },
          { itemKey: "packages-in-person-coaching-kpss", label: "KPSS", href: "/paketlerimiz?kategori=in-person-coaching&alt=kpss" }
        ]
      },
      {
        itemKey: "packages-exam-camp",
        label: "Yazılı Kampı (Hazırlık)",
        href: "/paketlerimiz?kategori=exam-camp",
        description: "Hazırlık ve kamp odaklı dönem setleri.",
        children: [
          { itemKey: "packages-exam-camp-content", label: "Kamp İçeriği", href: "/paketlerimiz?kategori=exam-camp&alt=camp-content" },
          { itemKey: "packages-exam-camp-calendar", label: "Hazırlık Takvimi", href: "/paketlerimiz?kategori=exam-camp&alt=prep-calendar" }
        ]
      },
      {
        itemKey: "packages-private-lessons",
        label: "Özel Ders",
        href: "/paketlerimiz?kategori=private-lessons",
        description: "Online veya yüz yüze birebir ders akışı.",
        children: [
          { itemKey: "packages-private-lessons-online", label: "Online", href: "/paketlerimiz?kategori=private-lessons&alt=private-online" },
          { itemKey: "packages-private-lessons-in-person", label: "Yüz Yüze", href: "/paketlerimiz?kategori=private-lessons&alt=private-in-person" }
        ]
      },
      {
        itemKey: "packages-mock-exam-club",
        label: "Deneme Kulübü",
        href: "/paketlerimiz?kategori=mock-exam-club",
        description: "Deneme, analiz ve geri bildirim düzeni.",
        children: [
          { itemKey: "packages-mock-exam-club-printed", label: "Basılı Kargo", href: "/paketlerimiz?kategori=mock-exam-club&alt=printed-cargo" },
          { itemKey: "packages-mock-exam-club-location", label: "Gerçek Mekan", href: "/paketlerimiz?kategori=mock-exam-club&alt=real-location" }
        ]
      },
      {
        itemKey: "packages-revision-camp",
        label: "Tekrar Kampı",
        href: "/paketlerimiz?kategori=revision-camp",
        description: "Son viraj tekrar ve kapanış akışı.",
        children: [
          { itemKey: "packages-revision-camp-flow", label: "Tekrar Planı", href: "/paketlerimiz?kategori=revision-camp&alt=revision-flow" },
          { itemKey: "packages-revision-camp-calendar", label: "Başvuru Takvimi", href: "/paketlerimiz?kategori=revision-camp&alt=closing-calendar" }
        ]
      }
    ]
  },
  { itemKey: "academic-staff", label: "Akademik Kadro", href: "/akademik-kadro" },
  { itemKey: "success-stories", label: "Başarılarımız", href: "/basarilarimiz" },
  { itemKey: "free-materials", label: "Ücretsiz Materyaller", href: "/ucretsiz-materyaller" },
  { itemKey: "about", label: "Hakkımızda", href: "/hakkimizda" }
] as const;

const marketingPages = [
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
        title: "Öğrencinin kayıt, paket ve çalışma düzenini tek akışta toplayan açılış alanı",
        body: "Bu bölüm, markanın satış vitrini ile öğrenci deneyimini aynı sahnede birleştirir.",
        variantKey: "showcase-hero",
        sortOrder: 10,
        payload: {
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
        eyebrow: "Paket yapısı",
        title: "Koçluk ve video ürünlerini ayrıştıran katalog alanı",
        body: "Kategori bazlı yönlendirme, öğrenciyi doğru ürün akışına alır.",
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
        eyebrow: "Katalog",
        title: "Tüm paketlerin toplandığı ürün yüzeyi",
        body: "Hepsi, kategori ve alt kategori filtreleriyle birlikte çalışır.",
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

const staffGroups = [
  {
    key: "coaches",
    label: "Koçlarımız",
    eyebrow: "Birebir Takip",
    description: "Öğrencinin haftalık ritmini ve karar yönünü taşıyan ekip.",
    sortOrder: 10,
    profiles: [
      { slug: "busra-kaya", fullName: "Büşra Kaya", title: "Akademik Planlama Koçu", city: "Ankara", sortOrder: 10 },
      { slug: "oguzhan-erdem", fullName: "Oğuzhan Erdem", title: "YKS Süreç Koçu", city: "Ankara", sortOrder: 20 },
      { slug: "zeynep-arslan", fullName: "Zeynep Arslan", title: "LGS ve Alt Sınıf Koçu", city: "Ankara", sortOrder: 30 },
      { slug: "emre-tuncel", fullName: "Emre Tuncel", title: "Deneme Analiz Koçu", city: "Ankara", sortOrder: 40 },
      { slug: "elif-cetin", fullName: "Elif Çetin", title: "Motivasyon ve Takip Koçu", city: "Ankara", sortOrder: 50 },
      { slug: "mert-yildiz", fullName: "Mert Yıldız", title: "Hedef ve Tempo Koçu", city: "Ankara", sortOrder: 60 }
    ]
  },
  {
    key: "teachers",
    label: "Öğretmenlerimiz",
    eyebrow: "Ders Omurgası",
    description: "Ders anlatımı ve kaynak ilişkisini güçlendiren öğretmen kadrosu.",
    sortOrder: 20,
    profiles: [
      { slug: "selin-ucar", fullName: "Selin Uçar", title: "TYT Türkçe Öğretmeni", city: "Ankara", sortOrder: 10 },
      { slug: "hakan-demir", fullName: "Hakan Demir", title: "AYT Matematik Öğretmeni", city: "Ankara", sortOrder: 20 },
      { slug: "doga-sahin", fullName: "Doğa Şahin", title: "Biyoloji Öğretmeni", city: "Ankara", sortOrder: 30 },
      { slug: "burak-koc", fullName: "Burak Koç", title: "Fizik Öğretmeni", city: "Ankara", sortOrder: 40 },
      { slug: "mine-acar", fullName: "Mine Acar", title: "Kimya Öğretmeni", city: "Ankara", sortOrder: 50 },
      { slug: "yigit-gunes", fullName: "Yiğit Güneş", title: "Geometri Öğretmeni", city: "Ankara", sortOrder: 60 }
    ]
  }
] as const;

const successStories = [
  {
    slug: "ayse-yks-disiplin-artisi",
    studentName: "Ayşe D.",
    city: "Ankara",
    examLabel: "2025 YKS",
    resultTitle: "Düzenli net artışı ve kontrollü süreç",
    highlight: "Haftalık takip, deneme analizi ve koçluk akışıyla istikrarlı yükseliş.",
    story: "Öğrenci önce çalışma düzensizliği sorunu yaşarken, planlı haftalık akış ve görünür takip sistemi ile süreci stabilize etti.",
    isFeatured: true,
    sortOrder: 10
  },
  {
    slug: "mert-lgs-ritim-kurulumu",
    studentName: "Mert K.",
    city: "Ankara",
    examLabel: "2025 LGS",
    resultTitle: "Ders ritmi ve sınav sabahı kontrolü",
    highlight: "Aile görünürlüğü ve rutin takibi ile daha net bir sınav hazırlığı.",
    story: "Velinin de dahil olduğu görünür takip yapısı ile ders düzeni oturtuldu ve deneme performansı toparlandı.",
    isFeatured: true,
    sortOrder: 20
  },
  {
    slug: "zeynep-ayt-kapanis-plani",
    studentName: "Zeynep A.",
    city: "Ankara",
    examLabel: "2025 AYT",
    resultTitle: "Son viraj tekrar kapanışı",
    highlight: "Tekrar kampı ve analiz bloklarıyla kapanış temposu kuruldu.",
    story: "Öğrenci son dönemde tekrar listesini netleştirerek kamp akışıyla eksiklerini görünür biçimde kapattı.",
    isFeatured: false,
    sortOrder: 30
  }
] as const;

const freeMaterialCategories = [
  { key: "free-tools", label: "Ücretsiz Araçlar", description: "Sayaçlar ve resmi yönlendirme araçları.", sortOrder: 10 },
  { key: "useful-links", label: "Faydalı Linkler", description: "Resmi ve sık kullanılan eğitim bağlantıları.", sortOrder: 20 },
  { key: "pdf-documents", label: "PDF Dökümanlar", description: "Takip ve planlama odaklı dökümanlar.", sortOrder: 30 },
  { key: "guidance-content", label: "Rehberlik İçerikleri", description: "Motivasyon, düzen ve çalışma önerileri.", sortOrder: 40 },
  { key: "speed-reading", label: "Hızlı Okuma Egzersizleri", description: "Dış bağlantılı egzersiz alanı.", sortOrder: 50 }
] as const;

const countdownPages = [
  {
    slug: "2026-yks-kac-gun-kaldi",
    eyebrow: "2026 YKS Geri Sayım",
    title: "2026 YKS oturumlarına kaç ay, kaç gün, kaç saat kaldı?",
    description: "TYT, AYT ve YDT oturumlarını ayrı ayrı takip et.",
    updatedLabel: "Son güncelleme: 9 Mayıs 2026 itibarıyla resmi ÖSYM duyuruları esas alındı",
    videoTitle: "YKS motivasyon ve son düzlüğe giriş videosu",
    videoNote: "Son haftalarda odak ve düzeni korumaya yardımcı motivasyon alanı.",
    targets: [
      { label: "TYT", targetAt: new Date("2026-06-20T10:15:00+03:00"), dateLabel: "20 Haziran 2026 Cumartesi, 10:15", note: "1. oturum: Temel Yeterlilik Testi", sortOrder: 10 },
      { label: "AYT", targetAt: new Date("2026-06-21T10:15:00+03:00"), dateLabel: "21 Haziran 2026 Pazar, 10:15", note: "2. oturum: Alan Yeterlilik Testleri", sortOrder: 20 },
      { label: "YDT", targetAt: new Date("2026-06-21T15:45:00+03:00"), dateLabel: "21 Haziran 2026 Pazar, 15:45", note: "3. oturum: Yabancı Dil Testi", sortOrder: 30 }
    ],
    officialLinks: [
      { title: "ÖSYM Takvim / OMS", linkType: "Resmi Kaynak", summary: "2026-YKS oturum tarihleri ÖSYM takvim görünümünde yer alır.", href: "https://www.osym.gov.tr/oms/", buttonLabel: "Takvimi Aç", sortOrder: 10 },
      { title: "2026-YKS Başvuru Duyurusu", linkType: "Resmi Kaynak", summary: "20-21 Haziran 2026 sınav düzeni ÖSYM duyurusunda açıklandı.", href: "https://www.osym.gov.tr/TR,33850/2026-yks-basvurularin-alinmasi-06022026.html", buttonLabel: "Duyuruyu Aç", sortOrder: 20 },
      { title: "ÖSYM AİS", linkType: "Aday İşlemleri", summary: "Başvuru ve aday işlemleri için resmi giriş sistemi.", href: "https://ais.osym.gov.tr/", buttonLabel: "Sisteme Git", sortOrder: 30 },
      { title: "YÖK Atlas", linkType: "Tercih Aracı", summary: "Bölüm ve üniversite araştırması için resmi atlas.", href: "https://yokatlas.yok.gov.tr/", buttonLabel: "Atlası Aç", sortOrder: 40 }
    ],
    articleSections: [
      { title: "2026 YKS ne zaman yapılacak?", body: "ÖSYM duyurusuna göre 2026 YKS, 20-21 Haziran 2026 tarihlerinde uygulanacak.", sortOrder: 10 },
      { title: "2026 YKS saat kaçta başlayacak?", body: "TYT 10.15, AYT 10.15, YDT 15.45 saatlerinde başlayacak şekilde işlendi.", sortOrder: 20 },
      { title: "Neden oturum bazlı sayaç kullanılmalı?", body: "TYT, AYT ve YDT farklı oturumlar olduğu için öğrencinin son hafta planı da farklılaşır.", sortOrder: 30 }
    ]
  },
  {
    slug: "2027-yks-kac-gun-kaldi",
    eyebrow: "2027 YKS Geri Sayım",
    title: "2027 YKS için resmi tarih açıklandı mı?",
    description: "Resmi tarih açıklanana kadar tahmini sayaç üretmeyen durum sayfası.",
    updatedLabel: "Son güncelleme: 9 Mayıs 2026 itibarıyla resmi tarih ilanı görünmüyor",
    videoTitle: "2027 YKS için uzun vadeli motivasyon videosu",
    videoNote: "Tarih beklenirken çalışma düzenini korumaya odaklanan video alanı.",
    targets: [
      { label: "Resmi Tarih Bekleniyor", targetAt: null, dateLabel: "ÖSYM 2027 takvimi henüz ilan edilmedi", note: "Tahmini tarih kullanılmadı.", sortOrder: 10 }
    ],
    officialLinks: [
      { title: "ÖSYM Duyurular", linkType: "Resmi Kaynak", summary: "2027 YKS ile ilgili resmi açıklamalar için ilk takip alanı.", href: "https://www.osym.gov.tr/duyurular/", buttonLabel: "Duyurulara Git", sortOrder: 10 },
      { title: "ÖSYM Takvim", linkType: "Resmi Kaynak", summary: "Yeni sınav takvimi yayımlandığında burada görünür.", href: "https://www.osym.gov.tr/TR,8797/takvim.html", buttonLabel: "Takvimi Aç", sortOrder: 20 },
      { title: "ÖSYM AİS", linkType: "Aday İşlemleri", summary: "Başvuru dönemi açıldığında kullanılacak aday işlemleri ekranı.", href: "https://ais.osym.gov.tr/", buttonLabel: "Sisteme Git", sortOrder: 30 }
    ],
    articleSections: [
      { title: "Neden tahmini sayaç kullanılmadı?", body: "Resmi tarih bulunmadığı için tahmini sayaç yerine dürüst bekleme durumu gösterilir.", sortOrder: 10 },
      { title: "Tarih açıklanmadan nasıl çalışılmalı?", body: "Bu dönem agresif takvim değil, rutin kurma ve temel güçlendirme dönemi olarak kullanılmalıdır.", sortOrder: 20 }
    ]
  },
  {
    slug: "2026-lgs-kac-gun-kaldi",
    eyebrow: "2026 LGS Geri Sayım",
    title: "2026 LGS oturumlarına kaç ay, kaç gün, kaç saat kaldı?",
    description: "Sözel ve sayısal bölümleri ayrı ayrı takip et.",
    updatedLabel: "Son güncelleme: 6 Nisan 2026 tarihli MEB güncellemesi esas alındı",
    videoTitle: "LGS motivasyon ve sınav sabahı odak videosu",
    videoNote: "Sınav sabahı odak ve sakinlik için hazırlanmış video alanı.",
    targets: [
      { label: "Sözel Bölüm", targetAt: new Date("2026-06-13T09:30:00+03:00"), dateLabel: "13 Haziran 2026 Cumartesi, 09:30", note: "1. oturum", sortOrder: 10 },
      { label: "Sayısal Bölüm", targetAt: new Date("2026-06-13T11:30:00+03:00"), dateLabel: "13 Haziran 2026 Cumartesi, 11:30", note: "2. oturum", sortOrder: 20 }
    ],
    officialLinks: [
      { title: "MEB Güncel Tarih Duyurusu", linkType: "Resmi Kaynak", summary: "LGS tarihinin 13 Haziran 2026 olarak güncellendiği resmi açıklama.", href: "https://www.meb.gov.tr/basin-aciklamasi//haber/40315/tr", buttonLabel: "Duyuruyu Aç", sortOrder: 10 },
      { title: "2026 LGS Kılavuzu", linkType: "Kılavuz", summary: "2026 LGS başvuru ve uygulama kılavuzu.", href: "https://www.meb.gov.tr/meb_iys_dosyalar/2026_04/03170012_LGS_Basvuru_ve_Uygulama_Kilavuzu_2026_.pdf", buttonLabel: "PDF Aç", sortOrder: 20 },
      { title: "MEB", linkType: "Resmi Kaynak", summary: "Milli Eğitim Bakanlığı ana sayfası.", href: "https://www.meb.gov.tr/", buttonLabel: "Resmi Sayfaya Git", sortOrder: 30 },
      { title: "e-Okul", linkType: "Aday İşlemleri", summary: "Başvuru ve öğrenci işlemleri için kullanılan sistem.", href: "https://eokul.meb.gov.tr/", buttonLabel: "Sisteme Git", sortOrder: 40 }
    ],
    articleSections: [
      { title: "2026 LGS ne zaman yapılacak?", body: "MEB açıklamasına göre sınav 13 Haziran 2026 Cumartesi günü yapılacak.", sortOrder: 10 },
      { title: "2026 LGS saat kaçta başlayacak?", body: "Sözel bölüm 09.30'da, sayısal bölüm 11.30'da başlayacak şekilde işlendi.", sortOrder: 20 },
      { title: "Neden iki ayrı sayaç kullanılıyor?", body: "Sözel ve sayısal bölümler farklı saatlerde başladığı için tek sayaç doğru değildir.", sortOrder: 30 }
    ]
  }
] as const;

const freeMaterialItems = [
  { categoryKey: "free-tools", title: "2026 YKS'ye Kaç Gün Kaldı?", itemType: "TOOL", badgeLabel: "Ücretsiz", summary: "2026 YKS oturum tarihlerini ve saatlerini tek ekranda takip etmek için canlı geri sayım.", href: "/ucretsiz-materyaller/2026-yks-kac-gun-kaldi", buttonLabel: "Ücretsiz Aç", sortOrder: 10, isFeatured: true, countdownSlug: "2026-yks-kac-gun-kaldi" },
  { categoryKey: "free-tools", title: "2027 YKS'ye Kaç Gün Kaldı?", itemType: "TOOL", badgeLabel: "Ücretsiz", summary: "Resmi tarih ilanını bekleyenler için güncel durum sayfası.", href: "/ucretsiz-materyaller/2027-yks-kac-gun-kaldi", buttonLabel: "Ücretsiz Aç", sortOrder: 20, isFeatured: true, countdownSlug: "2027-yks-kac-gun-kaldi" },
  { categoryKey: "free-tools", title: "2026 LGS'ye Kaç Gün Kaldı?", itemType: "TOOL", badgeLabel: "Ücretsiz", summary: "LGS tarih ve saatlerini oturum bazında takip etmek için sayaç alanı.", href: "/ucretsiz-materyaller/2026-lgs-kac-gun-kaldi", buttonLabel: "Ücretsiz Aç", sortOrder: 30, isFeatured: true, countdownSlug: "2026-lgs-kac-gun-kaldi" },
  { categoryKey: "free-tools", title: "YKS Puan Hesapla", itemType: "LINK", badgeLabel: "Ücretsiz", summary: "YKS hedefi için net ve bölüm araştırmasını destekleyen resmi kaynaklara yönlen.", href: "https://yokatlas.yok.gov.tr/netler-tablo.php?b=10103", buttonLabel: "Aracı Aç", sortOrder: 40, opensInNewTab: true },
  { categoryKey: "free-tools", title: "YKS Atlas", itemType: "LINK", badgeLabel: "Ücretsiz", summary: "Bölüm ve üniversite araştırmasını resmi atlas verileri üzerinden yürüt.", href: "https://yokatlas.yok.gov.tr/", buttonLabel: "Resmi Sayfaya Git", sortOrder: 50, opensInNewTab: true },
  { categoryKey: "free-tools", title: "Maarif Simülasyonları", itemType: "LINK", badgeLabel: "Ücretsiz", summary: "Etkileşimli ders içerikleri için EBA üzerinden yönlendirme alanı.", href: "https://www.eba.gov.tr/", buttonLabel: "İçeriği Aç", sortOrder: 60, opensInNewTab: true },
  { categoryKey: "useful-links", title: "MEB", itemType: "LINK", badgeLabel: "Resmi Kaynak", summary: "Milli Eğitim Bakanlığı duyuruları ve takvimleri.", href: "https://www.meb.gov.tr/", buttonLabel: "Resmi Sayfaya Git", sortOrder: 10, opensInNewTab: true },
  { categoryKey: "useful-links", title: "ÖSYM", itemType: "LINK", badgeLabel: "Resmi Kaynak", summary: "Sınav takvimi ve resmi duyurular için temel kaynak.", href: "https://www.osym.gov.tr/", buttonLabel: "Resmi Sayfaya Git", sortOrder: 20, opensInNewTab: true },
  { categoryKey: "useful-links", title: "ÖSYM AİS", itemType: "LINK", badgeLabel: "Aday İşlemleri", summary: "Başvuru, sonuç ve belge işlemleri için giriş alanı.", href: "https://ais.osym.gov.tr/", buttonLabel: "Sisteme Git", sortOrder: 30, opensInNewTab: true },
  { categoryKey: "useful-links", title: "YÖK Atlas", itemType: "LINK", badgeLabel: "Tercih Aracı", summary: "Program ve üniversite araştırması için resmi atlas verisi.", href: "https://yokatlas.yok.gov.tr/", buttonLabel: "Atlası Aç", sortOrder: 40, opensInNewTab: true },
  { categoryKey: "pdf-documents", title: "TYT Çalışma Planı PDF", itemType: "PDF", badgeLabel: "PDF Döküman", summary: "Haftalık bloklar ve tekrar zamanlarını planlamak için TYT çalışma şablonu.", href: "/ucretsiz-materyaller/2026-yks-kac-gun-kaldi", buttonLabel: "İçeriği İncele", sortOrder: 10 },
  { categoryKey: "pdf-documents", title: "AYT Tekrar Çizelgesi PDF", itemType: "PDF", badgeLabel: "PDF Döküman", summary: "AYT konu tekrarlarını haftalara ayıran sade çizelge.", href: "/ucretsiz-materyaller/2026-yks-kac-gun-kaldi", buttonLabel: "İçeriği İncele", sortOrder: 20 },
  { categoryKey: "pdf-documents", title: "Deneme Analiz Formu PDF", itemType: "PDF", badgeLabel: "PDF Döküman", summary: "Net, süre ve eksik konu değerlendirmesi için analiz formu.", href: "/ucretsiz-materyaller/2026-lgs-kac-gun-kaldi", buttonLabel: "İçeriği İncele", sortOrder: 30 },
  { categoryKey: "pdf-documents", title: "Hedef Takip Sayfası PDF", itemType: "PDF", badgeLabel: "PDF Döküman", summary: "Aylık hedefleri ve tamamlanan görevleri işlemek için takip sayfası.", href: "/ucretsiz-materyaller/2027-yks-kac-gun-kaldi", buttonLabel: "İçeriği İncele", sortOrder: 40 },
  { categoryKey: "guidance-content", title: "Blog", itemType: "GUIDANCE", badgeLabel: "Rehberlik İçeriği", summary: "Sınav dönemi, motivasyon ve çalışma düzeni odaklı yazı alanı.", href: "/ucretsiz-materyaller/2026-yks-kac-gun-kaldi", buttonLabel: "Yazıyı Aç", sortOrder: 10 },
  { categoryKey: "guidance-content", title: "Ücretsiz Araçlarımız", itemType: "GUIDANCE", badgeLabel: "Rehberlik İçeriği", summary: "Araçların nasıl kullanılacağına dair yönlendirici alan.", href: "/ucretsiz-materyaller", buttonLabel: "Alanı Aç", sortOrder: 20 },
  { categoryKey: "guidance-content", title: "Ücretsiz Kamplar", itemType: "GUIDANCE", badgeLabel: "Rehberlik İçeriği", summary: "Sömestr, yaz ve tekrar dönemleri için kamp düzenlerini tanıtan içerikler.", href: "/ucretsiz-materyaller/2026-yks-kac-gun-kaldi", buttonLabel: "İçeriği Aç", sortOrder: 30 },
  { categoryKey: "guidance-content", title: "Çalışma Tüyoları", itemType: "GUIDANCE", badgeLabel: "Rehberlik İçeriği", summary: "Rutin, tempo ve odak geliştirmeye yönelik pratik içerikler.", href: "/ucretsiz-materyaller/2026-lgs-kac-gun-kaldi", buttonLabel: "İçeriği Aç", sortOrder: 40 },
  { categoryKey: "speed-reading", title: "Hızlı Okuma Egzersizleri", itemType: "EXTERNAL", badgeLabel: "Ücretsiz", summary: "Okuma hızını ve paragraf ritmini geliştirmeye yönelik egzersiz bağlantısı.", href: "https://www.m5bilisim.com/tr/hizli-okuma/", buttonLabel: "Egzersizi Aç", sortOrder: 10, opensInNewTab: true }
] as const;

async function createNavigationItems(
  menuId: string,
  items: readonly {
    itemKey: string;
    label: string;
    href: string;
    description?: string;
    children?: readonly any[];
  }[],
  parentId?: string
) {
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];

    const record = await prisma.navigationMenuItem.create({
      data: {
        menuId,
        parentId,
        itemKey: item.itemKey,
        label: item.label,
        href: item.href,
        description: item.description,
        sortOrder: (index + 1) * 10,
        isActive: true
      }
    });

    if (item.children?.length) {
      await createNavigationItems(menuId, item.children, record.id);
    }
  }
}

async function seedPermissions() {
  for (const permission of DEFAULT_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: {
        name: permission.name,
        description: permission.description
      },
      create: {
        key: permission.key,
        name: permission.name,
        description: permission.description
      }
    });
  }
}

async function seedRoles() {
  const permissions = await prisma.permission.findMany();
  const permissionIdByKey = new Map(permissions.map((permission) => [permission.key, permission.id]));

  for (const role of DEFAULT_ROLES) {
    await prisma.role.upsert({
      where: { key: role.key },
      update: {
        name: role.name,
        description: role.description
      },
      create: {
        key: role.key,
        name: role.name,
        description: role.description
      }
    });
  }

  const roles = await prisma.role.findMany({
    where: {
      key: {
        in: DEFAULT_ROLES.map((role) => role.key)
      }
    }
  });

  for (const role of roles) {
    const roleDefinition = DEFAULT_ROLES.find((item) => item.key === role.key);

    if (!roleDefinition) {
      continue;
    }

    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id }
    });

    if (roleDefinition.permissions.length === 0) {
      continue;
    }

    await prisma.rolePermission.createMany({
      data: roleDefinition.permissions.map((permissionKey) => ({
        roleId: role.id,
        permissionId: permissionIdByKey.get(permissionKey)!
      }))
    });
  }
}

async function seedSuperAdminPlaceholder() {
  const existingSuperAdmin = await prisma.staffUser.findFirst({
    where: {
      roles: {
        some: {
          role: {
            key: ROLE_KEYS.superAdmin
          }
        }
      }
    }
  });

  if (existingSuperAdmin) {
    return;
  }

  console.info(
    "No super-admin staff account exists yet. Create one manually after initial migration and password setup."
  );
}

async function seedSiteSettings() {
  await prisma.siteSetting.upsert({
    where: { key: "default" },
    update: {
      siteName: "Eğitim Gurmesi Akademi",
      siteTitle: "EĞİTİM GURMESİ AKADEMİ",
      tagline: "Video paketleri, koçluk akışı ve öğrenci paneli",
      logoPrimaryUrl: "/branding/ega-logo-primary.png",
      logoMarkUrl: "/branding/ega-mark-transparent.png",
      defaultSeoTitle: "Eğitim Gurmesi Akademi",
      defaultSeoDescription: "Video paketleri, koçluk programları ve ücretsiz öğrenci kaynakları."
    },
    create: {
      key: "default",
      siteName: "Eğitim Gurmesi Akademi",
      siteTitle: "EĞİTİM GURMESİ AKADEMİ",
      tagline: "Video paketleri, koçluk akışı ve öğrenci paneli",
      logoPrimaryUrl: "/branding/ega-logo-primary.png",
      logoMarkUrl: "/branding/ega-mark-transparent.png",
      defaultSeoTitle: "Eğitim Gurmesi Akademi",
      defaultSeoDescription: "Video paketleri, koçluk programları ve ücretsiz öğrenci kaynakları."
    }
  });
}

async function seedNavigationMenus() {
  const menu = await prisma.navigationMenu.upsert({
    where: { key: "primary" },
    update: {
      name: "Primary Navigation",
      location: PRIMARY,
      isActive: true
    },
    create: {
      key: "primary",
      name: "Primary Navigation",
      location: PRIMARY,
      isActive: true
    }
  });

  await prisma.navigationMenuItem.deleteMany({
    where: { menuId: menu.id }
  });

  await createNavigationItems(menu.id, primaryNavigationItems);
}

async function seedMarketingPages() {
  for (const page of marketingPages) {
    const record = await prisma.marketingPage.upsert({
      where: { key: page.key },
      update: {
        slug: page.slug,
        title: page.title,
        excerpt: page.excerpt,
        description: page.description,
        pageType: page.pageType,
        publishStatus: PUBLISHED,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription
      },
      create: {
        key: page.key,
        slug: page.slug,
        title: page.title,
        excerpt: page.excerpt,
        description: page.description,
        pageType: page.pageType,
        publishStatus: PUBLISHED,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription
      }
    });

    await prisma.marketingPageSection.deleteMany({
      where: { pageId: record.id }
    });

    if (page.sections.length > 0) {
      await prisma.marketingPageSection.createMany({
        data: page.sections.map((section) => ({
          pageId: record.id,
          sectionKey: section.sectionKey,
          eyebrow: section.eyebrow,
          title: section.title,
          body: section.body,
          variantKey: section.variantKey,
          payload: section.payload,
          sortOrder: section.sortOrder,
          isActive: true,
          publishStatus: PUBLISHED
        }))
      });
    }
  }
}

async function seedStaffProfiles() {
  for (const group of staffGroups) {
    const record = await prisma.staffProfileGroup.upsert({
      where: { key: group.key },
      update: {
        label: group.label,
        eyebrow: group.eyebrow,
        description: group.description,
        sortOrder: group.sortOrder,
        publishStatus: PUBLISHED
      },
      create: {
        key: group.key,
        label: group.label,
        eyebrow: group.eyebrow,
        description: group.description,
        sortOrder: group.sortOrder,
        publishStatus: PUBLISHED
      }
    });

    await prisma.staffProfile.deleteMany({
      where: { groupId: record.id }
    });

    await prisma.staffProfile.createMany({
      data: group.profiles.map((profile) => ({
        groupId: record.id,
        slug: profile.slug,
        fullName: profile.fullName,
        title: profile.title,
        city: profile.city,
        sortOrder: profile.sortOrder,
        publishStatus: PUBLISHED
      }))
    });
  }
}

async function seedSuccessStories() {
  await prisma.successStory.deleteMany();

  await prisma.successStory.createMany({
    data: successStories.map((story) => ({
      slug: story.slug,
      studentName: story.studentName,
      city: story.city,
      examLabel: story.examLabel,
      resultTitle: story.resultTitle,
      highlight: story.highlight,
      story: story.story,
      isFeatured: story.isFeatured,
      sortOrder: story.sortOrder,
      publishStatus: PUBLISHED
    }))
  });
}

async function seedFreeMaterials() {
  const categoryIdByKey = new Map<string, string>();

  for (const category of freeMaterialCategories) {
    const record = await prisma.freeMaterialCategory.upsert({
      where: { key: category.key },
      update: {
        label: category.label,
        description: category.description,
        sortOrder: category.sortOrder,
        publishStatus: PUBLISHED
      },
      create: {
        key: category.key,
        label: category.label,
        description: category.description,
        sortOrder: category.sortOrder,
        publishStatus: PUBLISHED
      }
    });

    categoryIdByKey.set(category.key, record.id);
  }

  const countdownIdBySlug = new Map<string, string>();

  for (const page of countdownPages) {
    const record = await prisma.countdownPage.upsert({
      where: { slug: page.slug },
      update: {
        eyebrow: page.eyebrow,
        title: page.title,
        description: page.description,
        updatedLabel: page.updatedLabel,
        videoTitle: page.videoTitle,
        videoNote: page.videoNote,
        publishStatus: PUBLISHED
      },
      create: {
        slug: page.slug,
        eyebrow: page.eyebrow,
        title: page.title,
        description: page.description,
        updatedLabel: page.updatedLabel,
        videoTitle: page.videoTitle,
        videoNote: page.videoNote,
        publishStatus: PUBLISHED
      }
    });

    countdownIdBySlug.set(page.slug, record.id);

    await prisma.countdownTarget.deleteMany({
      where: { countdownPageId: record.id }
    });
    await prisma.countdownOfficialLink.deleteMany({
      where: { countdownPageId: record.id }
    });
    await prisma.countdownArticleSection.deleteMany({
      where: { countdownPageId: record.id }
    });

    await prisma.countdownTarget.createMany({
      data: page.targets.map((target) => ({
        countdownPageId: record.id,
        label: target.label,
        targetAt: target.targetAt,
        dateLabel: target.dateLabel,
        note: target.note,
        sortOrder: target.sortOrder
      }))
    });

    await prisma.countdownOfficialLink.createMany({
      data: page.officialLinks.map((link) => ({
        countdownPageId: record.id,
        title: link.title,
        linkType: link.linkType,
        summary: link.summary,
        href: link.href,
        buttonLabel: link.buttonLabel,
        sortOrder: link.sortOrder
      }))
    });

    await prisma.countdownArticleSection.createMany({
      data: page.articleSections.map((section) => ({
        countdownPageId: record.id,
        title: section.title,
        body: section.body,
        sortOrder: section.sortOrder
      }))
    });
  }

  await prisma.freeMaterialItem.deleteMany();

  await prisma.freeMaterialItem.createMany({
    data: freeMaterialItems.map((item) => ({
      categoryId: categoryIdByKey.get(item.categoryKey)!,
      title: item.title,
      itemType: item.itemType,
      badgeLabel: item.badgeLabel,
      summary: item.summary,
      href: item.href,
      buttonLabel: item.buttonLabel,
      opensInNewTab: item.opensInNewTab ?? false,
      sortOrder: item.sortOrder,
      isFeatured: item.isFeatured ?? false,
      publishStatus: PUBLISHED,
      countdownPageId: item.countdownSlug ? countdownIdBySlug.get(item.countdownSlug)! : undefined
    }))
  });
}

function parseSeedPrice(value: string) {
  const numericValue = value.replace(/[^0-9,.-]/g, "").replace(/\./g, "").replace(",", ".");

  if (!numericValue) {
    return "0.00";
  }

  const parsed = Number.parseFloat(numericValue);

  if (!Number.isFinite(parsed)) {
    return "0.00";
  }

  return parsed.toFixed(2);
}

function mapSeedProductType(provider: (typeof packageProducts)[number]["provider"]) {
  return provider === "redirect" ? "COACHING_PACKAGE" : "VIDEO_PACKAGE";
}

function mapSeedProvider(provider: (typeof packageProducts)[number]["provider"]) {
  return provider === "redirect" ? "UNIKAZAN" : "LOCAL";
}

async function seedCatalog() {
  await prisma.externalProviderProduct.deleteMany();
  await prisma.productFeature.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productCategory.deleteMany();

  const topCategoryIdBySlug = new Map<string, string>();
  const childCategoryIdByComposite = new Map<string, string>();

  for (let categoryIndex = 0; categoryIndex < packageCategories.length; categoryIndex += 1) {
    const category = packageCategories[categoryIndex];

    const topCategory = await prisma.productCategory.create({
      data: {
        name: category.label,
        slug: category.id,
        description: category.description,
        ctaHref: `/paketlerimiz?kategori=${category.id}`,
        sortOrder: (categoryIndex + 1) * 10,
        isActive: true
      }
    });

    topCategoryIdBySlug.set(category.id, topCategory.id);

    for (let subcategoryIndex = 0; subcategoryIndex < category.subcategories.length; subcategoryIndex += 1) {
      const subcategory = category.subcategories[subcategoryIndex];

      const childCategory = await prisma.productCategory.create({
        data: {
          parentCategoryId: topCategory.id,
          name: subcategory.label,
          slug: `${category.id}--${subcategory.id}`,
          description: subcategory.description,
          ctaHref: `/paketlerimiz?kategori=${category.id}&alt=${subcategory.id}`,
          sortOrder: (subcategoryIndex + 1) * 10,
          isActive: true
        }
      });

      childCategoryIdByComposite.set(
        `${category.id}:${subcategory.id}`,
        childCategory.id
      );
    }
  }

  for (let productIndex = 0; productIndex < packageProducts.length; productIndex += 1) {
    const product = packageProducts[productIndex];
    const childCategoryId = childCategoryIdByComposite.get(
      `${product.categoryId}:${product.subcategoryId}`
    );

    if (!childCategoryId) {
      throw new Error(`Seed catalog category mapping missing for ${product.slug}.`);
    }

    const createdProduct = await prisma.product.create({
      data: {
        categoryId: childCategoryId,
        name: product.title,
        slug: product.slug,
        shortDescription: product.subtitle,
        description: [
          product.subtitle,
          "",
          ...product.features.map((feature) => `- ${feature}`)
        ].join("\n"),
        type: mapSeedProductType(product.provider),
        provider: mapSeedProvider(product.provider),
        publishStatus: PUBLISHED,
        isFeatured: productIndex < 6,
        sortOrder: (productIndex + 1) * 10,
        accentColor: product.tone,
        seoTitle: product.title,
        seoDescription: product.subtitle
      }
    });

    const variant = await prisma.productVariant.create({
      data: {
        productId: createdProduct.id,
        title: "Standart",
        sku: product.id.toUpperCase().replace(/[^A-Z0-9]+/g, "-"),
        billingLabel: product.price,
        price: parseSeedPrice(product.price),
        currency: "TRY",
        isDefault: true,
        isActive: true,
        sortOrder: 10
      }
    });

    if (product.features.length > 0) {
      await prisma.productFeature.createMany({
        data: product.features.map((feature, featureIndex) => ({
          productId: createdProduct.id,
          title: feature,
          sortOrder: (featureIndex + 1) * 10
        }))
      });
    }

    if (product.provider === "redirect") {
      await prisma.externalProviderProduct.create({
        data: {
          productId: createdProduct.id,
          variantId: variant.id,
          provider: "UNIKAZAN",
          externalProductId: product.id,
          externalVariantId: "standard",
          isActive: true
        }
      });
    }
  }
}

async function main() {
  await seedPermissions();
  await seedRoles();
  await seedSuperAdminPlaceholder();
  await seedSiteSettings();
  await seedNavigationMenus();
  await seedMarketingPages();
  await seedStaffProfiles();
  await seedSuccessStories();
  await seedFreeMaterials();
  await seedCatalog();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
