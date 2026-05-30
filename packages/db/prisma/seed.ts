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

const staffGroups = [
  {
    key: "coaches",
    label: "Koçlarımız",
    eyebrow: "Birebir Takip",
    description: "",
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
    description: "",
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

const staffPhotoUrls: Record<string, string> = {
  "busra-kaya": "/staff/coach-busra-kaya.png",
  "oguzhan-erdem": "/staff/coach-oguzhan-erdem.png",
  "zeynep-arslan": "/staff/coach-zeynep-arslan.png",
  "emre-tuncel": "/staff/coach-emre-tuncel.png",
  "elif-cetin": "/staff/coach-elif-cetin.png",
  "mert-yildiz": "/staff/coach-mert-yildiz.png",
  "selin-ucar": "/staff/teacher-selin-ucar.png",
  "hakan-demir": "/staff/teacher-hakan-demir.png",
  "doga-sahin": "/staff/teacher-doga-sahin.png",
  "burak-koc": "/staff/teacher-burak-koc.png",
  "mine-acar": "/staff/teacher-mine-acar.png",
  "yigit-gunes": "/staff/teacher-yigit-gunes.png"
};

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
    slug: "tyt-kac-gun-kaldi",
    eyebrow: "2026 TYT Sayacı",
    title: "TYT'ye kaç gün kaldı?",
    description: "2026 TYT oturumuna kalan süreyi tek sayaç alanında takip et.",
    updatedLabel: "Son güncelleme: 9 Mayıs 2026 itibarıyla resmî ÖSYM duyuruları esas alındı",
    videoTitle: "TYT motivasyon ve son hafta odak videosu",
    videoNote: "TYT öncesi paragraf ritmi, süre yönetimi ve deneme düzenini korumaya yardımcı video alanı.",
    targets: [
      { label: "TYT", targetAt: new Date("2026-06-20T10:15:00+03:00"), dateLabel: "20 Haziran 2026 Cumartesi, 10:15", note: "1. oturum: Temel Yeterlilik Testi", sortOrder: 10 }
    ],
    officialLinks: [
      { title: "ÖSYM Takvim / OMS", linkType: "Resmî Kaynak", summary: "2026-YKS oturum tarihleri ÖSYM takvim görünümünde yer alır.", href: "https://www.osym.gov.tr/oms/", buttonLabel: "Takvimi Aç", sortOrder: 10 },
      { title: "2026-YKS Başvuru Duyurusu", linkType: "Resmî Kaynak", summary: "20-21 Haziran 2026 sınav düzeni ÖSYM duyurusunda açıklandı.", href: "https://www.osym.gov.tr/TR,33850/2026-yks-basvurularin-alinmasi-06022026.html", buttonLabel: "Duyuruyu Aç", sortOrder: 20 },
      { title: "ÖSYM AİS", linkType: "Aday İşlemleri", summary: "Başvuru ve aday işlemleri için resmî giriş sistemi.", href: "https://ais.osym.gov.tr/", buttonLabel: "Sisteme Git", sortOrder: 30 },
      { title: "YÖK Atlas", linkType: "Tercih Aracı", summary: "Bölüm ve üniversite araştırması için resmî atlas.", href: "https://yokatlas.yok.gov.tr/", buttonLabel: "Atlası Aç", sortOrder: 40 }
    ],
    articleSections: [
      { title: "2026 TYT ne zaman yapılacak?", body: "ÖSYM duyurusuna göre 2026 TYT, 20 Haziran 2026 Cumartesi günü uygulanacak.", sortOrder: 10 },
      { title: "2026 TYT saat kaçta başlayacak?", body: "ÖSYM'nin 26 Mart 2026 açıklamasına göre TYT başlangıç saati 10.15 olarak işlendi.", sortOrder: 20 },
      { title: "TYT sayacını ayrı takip etmek neden önemli?", body: "Paragraf, problem ve süre yönetimi ağırlıklı son hafta planı için TYT'nin ayrı sayaçla izlenmesi daha net yön verir.", sortOrder: 30 }
    ]
  },
  {
    slug: "ayt-kac-gun-kaldi",
    eyebrow: "2026 AYT Sayacı",
    title: "AYT'ye kaç gün kaldı?",
    description: "2026 AYT oturumuna kalan süreyi tek sayaç alanında takip et.",
    updatedLabel: "Son güncelleme: 9 Mayıs 2026 itibarıyla resmî ÖSYM duyuruları esas alındı",
    videoTitle: "AYT kapanış temposu ve tekrar planı videosu",
    videoNote: "AYT öncesi son tekrar listesi ve deneme sıklığını toparlayan video alanı.",
    targets: [
      { label: "AYT", targetAt: new Date("2026-06-21T10:15:00+03:00"), dateLabel: "21 Haziran 2026 Pazar, 10:15", note: "2. oturum: Alan Yeterlilik Testleri", sortOrder: 10 }
    ],
    officialLinks: [
      { title: "ÖSYM Takvim / OMS", linkType: "Resmî Kaynak", summary: "2026-YKS oturum tarihleri ÖSYM takvim görünümünde yer alır.", href: "https://www.osym.gov.tr/oms/", buttonLabel: "Takvimi Aç", sortOrder: 10 },
      { title: "2026-YKS Başvuru Duyurusu", linkType: "Resmî Kaynak", summary: "20-21 Haziran 2026 sınav düzeni ÖSYM duyurusunda açıklandı.", href: "https://www.osym.gov.tr/TR,33850/2026-yks-basvurularin-alinmasi-06022026.html", buttonLabel: "Duyuruyu Aç", sortOrder: 20 },
      { title: "ÖSYM AİS", linkType: "Aday İşlemleri", summary: "Başvuru ve aday işlemleri için resmî giriş sistemi.", href: "https://ais.osym.gov.tr/", buttonLabel: "Sisteme Git", sortOrder: 30 },
      { title: "YÖK Atlas", linkType: "Tercih Aracı", summary: "Bölüm ve üniversite araştırması için resmî atlas.", href: "https://yokatlas.yok.gov.tr/", buttonLabel: "Atlası Aç", sortOrder: 40 }
    ],
    articleSections: [
      { title: "2026 AYT ne zaman yapılacak?", body: "ÖSYM duyurusuna göre 2026 AYT, 21 Haziran 2026 Pazar günü uygulanacak.", sortOrder: 10 },
      { title: "2026 AYT saat kaçta başlayacak?", body: "ÖSYM'nin 26 Mart 2026 açıklamasına göre AYT başlangıç saati 10.15 olarak işlendi.", sortOrder: 20 },
      { title: "AYT için ayrı sayaç neden daha doğru?", body: "AYT'de son tekrar listesi, konu kapanışı ve deneme temposu TYT'den ayrıldığı için ayrı sayaç daha doğru yön verir.", sortOrder: 30 }
    ]
  },
  {
    slug: "ydt-kac-gun-kaldi",
    eyebrow: "2026 YDT Sayacı",
    title: "YDT'ye kaç gün kaldı?",
    description: "2026 YDT oturumuna kalan süreyi tek sayaç alanında takip et.",
    updatedLabel: "Son güncelleme: 9 Mayıs 2026 itibarıyla resmî ÖSYM duyuruları esas alındı",
    videoTitle: "YDT odak ve son oturum hazırlık videosu",
    videoNote: "YDT öncesi kelime tekrarı, paragraf akışı ve gün içi enerji yönetimini destekleyen video alanı.",
    targets: [
      { label: "YDT", targetAt: new Date("2026-06-21T15:45:00+03:00"), dateLabel: "21 Haziran 2026 Pazar, 15:45", note: "3. oturum: Yabancı Dil Testi", sortOrder: 10 }
    ],
    officialLinks: [
      { title: "ÖSYM Takvim / OMS", linkType: "Resmî Kaynak", summary: "2026-YKS oturum tarihleri ÖSYM takvim görünümünde yer alır.", href: "https://www.osym.gov.tr/oms/", buttonLabel: "Takvimi Aç", sortOrder: 10 },
      { title: "2026-YKS Başvuru Duyurusu", linkType: "Resmî Kaynak", summary: "20-21 Haziran 2026 sınav düzeni ÖSYM duyurusunda açıklandı.", href: "https://www.osym.gov.tr/TR,33850/2026-yks-basvurularin-alinmasi-06022026.html", buttonLabel: "Duyuruyu Aç", sortOrder: 20 },
      { title: "ÖSYM AİS", linkType: "Aday İşlemleri", summary: "Başvuru ve aday işlemleri için resmî giriş sistemi.", href: "https://ais.osym.gov.tr/", buttonLabel: "Sisteme Git", sortOrder: 30 },
      { title: "YÖK Atlas", linkType: "Tercih Aracı", summary: "Bölüm ve üniversite araştırması için resmî atlas.", href: "https://yokatlas.yok.gov.tr/", buttonLabel: "Atlası Aç", sortOrder: 40 }
    ],
    articleSections: [
      { title: "2026 YDT ne zaman yapılacak?", body: "ÖSYM duyurusuna göre 2026 YDT, 21 Haziran 2026 Pazar günü uygulanacak.", sortOrder: 10 },
      { title: "2026 YDT saat kaçta başlayacak?", body: "ÖSYM'nin 26 Mart 2026 açıklamasında YDT başlangıç saati 15.45 olarak duyuruldu.", sortOrder: 20 },
      { title: "YDT için ayrı sayaç neden gerekir?", body: "YDT günün son oturumu olduğu için enerji, mola ve odak planı diğer oturumlardan ayrılır; ayrı sayaç bunu görünür kılar.", sortOrder: 30 }
    ]
  },
  {
    slug: "2027-yks-kac-gun-kaldi",
    eyebrow: "2027 YKS Geri Sayım",
    title: "2027 YKS için resmî tarih açıklandı mı?",
    description: "Resmî tarih açıklanana kadar tahmini sayaç üretmeyen durum sayfası.",
    updatedLabel: "Son güncelleme: 9 Mayıs 2026 itibarıyla resmî tarih ilanı görünmüyor",
    videoTitle: "2027 YKS için uzun vadeli motivasyon videosu",
    videoNote: "Tarih beklenirken çalışma düzenini korumaya odaklanan video alanı.",
    targets: [
      { label: "Resmî Tarih Bekleniyor", targetAt: null, dateLabel: "ÖSYM 2027 takvimi henüz ilan edilmedi", note: "Tahmini tarih kullanılmadı.", sortOrder: 10 }
    ],
    officialLinks: [
      { title: "ÖSYM Duyurular", linkType: "Resmî Kaynak", summary: "2027 YKS ile ilgili resmî açıklamalar için ilk takip alanı.", href: "https://www.osym.gov.tr/duyurular/", buttonLabel: "Duyurulara Git", sortOrder: 10 },
      { title: "ÖSYM Takvim", linkType: "Resmî Kaynak", summary: "Yeni sınav takvimi yayımlandığında burada görünür.", href: "https://www.osym.gov.tr/TR,8797/takvim.html", buttonLabel: "Takvimi Aç", sortOrder: 20 },
      { title: "ÖSYM AİS", linkType: "Aday İşlemleri", summary: "Başvuru dönemi açıldığında kullanılacak aday işlemleri ekranı.", href: "https://ais.osym.gov.tr/", buttonLabel: "Sisteme Git", sortOrder: 30 }
    ],
    articleSections: [
      { title: "Neden tahmini sayaç kullanılmadı?", body: "Resmî tarih bulunmadığı için tahmini sayaç yerine dürüst bekleme durumu gösterilir.", sortOrder: 10 },
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
  { categoryKey: "free-tools", title: "TYT", itemType: "TOOL", badgeLabel: "Ücretsiz", summary: "2026 TYT için canlı geri sayım ve resmî oturum bilgileri.", href: "/ucretsiz-materyaller/tyt-kac-gun-kaldi", buttonLabel: "TYT Sayacını Aç", sortOrder: 10, isFeatured: true, countdownSlug: "tyt-kac-gun-kaldi" },
  { categoryKey: "free-tools", title: "AYT", itemType: "TOOL", badgeLabel: "Ücretsiz", summary: "2026 AYT için ayrı sayaç alanı ve oturum saati.", href: "/ucretsiz-materyaller/ayt-kac-gun-kaldi", buttonLabel: "AYT Sayacını Aç", sortOrder: 20, isFeatured: true, countdownSlug: "ayt-kac-gun-kaldi" },
  { categoryKey: "free-tools", title: "YDT", itemType: "TOOL", badgeLabel: "Ücretsiz", summary: "2026 YDT için ayrı geri sayım ve son oturum bilgisi.", href: "/ucretsiz-materyaller/ydt-kac-gun-kaldi", buttonLabel: "YDT Sayacını Aç", sortOrder: 30, isFeatured: true, countdownSlug: "ydt-kac-gun-kaldi" },
  { categoryKey: "free-tools", title: "2026 LGS'ye Kaç Gün Kaldı?", itemType: "TOOL", badgeLabel: "Ücretsiz", summary: "LGS tarih ve saatlerini oturum bazında takip etmek için sayaç alanı.", href: "/ucretsiz-materyaller/2026-lgs-kac-gun-kaldi", buttonLabel: "LGS Sayacını Aç", sortOrder: 40, isFeatured: true, countdownSlug: "2026-lgs-kac-gun-kaldi" },
  { categoryKey: "free-tools", title: "Puan Hesapla", itemType: "LINK", badgeLabel: "Ücretsiz", summary: "LGS, TYT, AYT ve YDT netlerini platform içinde hesapla; tahmini puanını ve ders bazlı netlerini gör.", href: "/ucretsiz-materyaller/puan-hesapla", buttonLabel: "Puan Hesapla", sortOrder: 50, opensInNewTab: false },
  { categoryKey: "free-tools", title: "YKS Atlas", itemType: "LINK", badgeLabel: "Ücretsiz", summary: "Bölüm, üniversite, kontenjan ve başarı sırası araştırmasını resmi atlas verileriyle planla.", href: "/ucretsiz-materyaller/yks-atlas", buttonLabel: "Atlas Rehberini Aç", sortOrder: 60, opensInNewTab: false },
  { categoryKey: "free-tools", title: "Maarif Simülasyonları", itemType: "LINK", badgeLabel: "Ücretsiz", summary: "Fizik, kimya ve fen kazanımlarını etkileşimli simülasyonlarla görselleştirerek konu tekrarını güçlendir.", href: "/ucretsiz-materyaller/maarif-simulasyonlari", buttonLabel: "Simülasyon Rehberini Aç", sortOrder: 70, opensInNewTab: false },
  { categoryKey: "useful-links", title: "MEB", itemType: "LINK", badgeLabel: "Resmi Kaynak", summary: "Milli Eğitim Bakanlığı duyuruları ve takvimleri.", href: "https://www.meb.gov.tr/", buttonLabel: "Resmi Sayfaya Git", sortOrder: 10, opensInNewTab: true },
  { categoryKey: "useful-links", title: "ÖSYM", itemType: "LINK", badgeLabel: "Resmi Kaynak", summary: "Sınav takvimi ve resmi duyurular için temel kaynak.", href: "https://www.osym.gov.tr/", buttonLabel: "Resmi Sayfaya Git", sortOrder: 20, opensInNewTab: true },
  { categoryKey: "useful-links", title: "ÖSYM AİS", itemType: "LINK", badgeLabel: "Aday İşlemleri", summary: "Başvuru, sonuç ve belge işlemleri için giriş alanı.", href: "https://ais.osym.gov.tr/", buttonLabel: "Sisteme Git", sortOrder: 30, opensInNewTab: true },
  { categoryKey: "useful-links", title: "YÖK Atlas", itemType: "LINK", badgeLabel: "Tercih Aracı", summary: "Program ve üniversite araştırması için resmi atlas verisi.", href: "https://yokatlas.yok.gov.tr/", buttonLabel: "Atlası Aç", sortOrder: 40, opensInNewTab: true },
  { categoryKey: "pdf-documents", title: "TYT Çalışma Planı PDF", itemType: "PDF", badgeLabel: "PDF Döküman", summary: "Haftalık bloklar ve tekrar zamanlarını planlamak için TYT çalışma şablonu.", href: "/ucretsiz-materyaller/tyt-kac-gun-kaldi", buttonLabel: "İçeriği İncele", sortOrder: 10 },
  { categoryKey: "pdf-documents", title: "AYT Tekrar Çizelgesi PDF", itemType: "PDF", badgeLabel: "PDF Döküman", summary: "AYT konu tekrarlarını haftalara ayıran sade çizelge.", href: "/ucretsiz-materyaller/ayt-kac-gun-kaldi", buttonLabel: "İçeriği İncele", sortOrder: 20 },
  { categoryKey: "pdf-documents", title: "Deneme Analiz Formu PDF", itemType: "PDF", badgeLabel: "PDF Döküman", summary: "Net, süre ve eksik konu değerlendirmesi için analiz formu.", href: "/ucretsiz-materyaller/ydt-kac-gun-kaldi", buttonLabel: "İçeriği İncele", sortOrder: 30 },
  { categoryKey: "pdf-documents", title: "Hedef Takip Sayfası PDF", itemType: "PDF", badgeLabel: "PDF Döküman", summary: "Aylık hedefleri ve tamamlanan görevleri işlemek için takip sayfası.", href: "/ucretsiz-materyaller/2026-lgs-kac-gun-kaldi", buttonLabel: "İçeriği İncele", sortOrder: 40 },
  { categoryKey: "guidance-content", title: "Blog", itemType: "GUIDANCE", badgeLabel: "Rehberlik İçeriği", summary: "Sınav dönemi, motivasyon ve çalışma düzeni odaklı yazı alanı.", href: "/ucretsiz-materyaller/tyt-kac-gun-kaldi", buttonLabel: "Yazıyı Aç", sortOrder: 10 },
  { categoryKey: "guidance-content", title: "Ücretsiz Araçlarımız", itemType: "GUIDANCE", badgeLabel: "Rehberlik İçeriği", summary: "Araçların nasıl kullanılacağına dair yönlendirici alan.", href: "/ucretsiz-materyaller", buttonLabel: "Alanı Aç", sortOrder: 20 },
  { categoryKey: "guidance-content", title: "Ücretsiz Kamplar", itemType: "GUIDANCE", badgeLabel: "Rehberlik İçeriği", summary: "Sömestr, yaz ve tekrar dönemleri için kamp düzenlerini tanıtan içerikler.", href: "/ucretsiz-materyaller/ayt-kac-gun-kaldi", buttonLabel: "İçeriği Aç", sortOrder: 30 },
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
        photoUrl: staffPhotoUrls[profile.slug] ?? null,
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
  const countdownSlugs = countdownPages.map((page) => page.slug);

  await prisma.countdownPage.deleteMany({
    where: {
      slug: {
        notIn: countdownSlugs
      }
    }
  });

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

type SeedFeatureBlueprint = {
  title: string;
  description: string;
  iconKey?: string;
};

function getSeedFeatureBlueprints(product: (typeof packageProducts)[number]): SeedFeatureBlueprint[] {
  if (product.featureDetails?.length) {
    return product.featureDetails.map((feature) => ({
      title: feature.title,
      description: feature.description ?? "",
      iconKey: feature.iconKey ?? undefined
    }));
  }

  if (product.provider === "redirect") {
    if (product.categoryId === "in-person-coaching") {
      return [
        {
          title: "Haftada 2 birebir görüşme planı",
          description: "Ankara merkezli görüşme bloklarıyla öğrencinin haftalık çalışma temposu yerinde takip edilir.",
          iconKey: "meeting"
        },
        {
          title: "Kişiye özel günlük program",
          description: "Okul, sınav ve tekrar akışı öğrencinin seviyesine göre günlük ve haftalık olarak yeniden planlanır.",
          iconKey: "calendar"
        },
        {
          title: "Deneme ve net analizi",
          description: "Her deneme sonrasında konu, hata ve zaman yönetimi başlıkları görünür rapora dönüştürülür.",
          iconKey: "chart"
        },
        {
          title: "Branş bazlı canlı yönlendirme",
          description: "Türkçe, Matematik, Fen ve ilgili derslerde kapanması gereken başlıklar birebir destekle netleştirilir.",
          iconKey: "layers"
        },
        {
          title: "Sınırsız soru çözüm desteği",
          description: "Takıldığı sorular ve eksik konular görüşme akışında düzenli biçimde ele alınır.",
          iconKey: "help"
        },
        {
          title: "Veli ve öğrenci geri bildirim notları",
          description: "Süreç boyunca paylaşılan değerlendirme notları ile tempo ve disiplin korunur.",
          iconKey: "note"
        }
      ];
    }

    return [
      {
        title: "Haftada 2 birebir görüşme",
        description: "Koçluk süreci haftalık birebir görüşme blokları ve net bir takip düzeniyle ilerler.",
        iconKey: "meeting"
      },
      {
        title: "Kişiye özel günlük program",
        description: "Günlük ve haftalık görevler öğrencinin sınav, okul ve seviye durumuna göre özel olarak kurulur.",
        iconKey: "calendar"
      },
      {
        title: "Canlı ders ve kayıt erişimi",
        description: "Canlı dersler, tekrar oturumları ve destek kayıtları öğrencinin akışına eşlenir.",
        iconKey: "video"
      },
      {
        title: "Haftalık branş ders desteği",
        description: "Türkçe, Matematik, Geometri ve ilgili derslerde kapanacak başlıklar ayrı ayrı izlenir.",
        iconKey: "layers"
      },
      {
        title: "Sınırsız soru çözüm hakkı",
        description: "Takıldığı sorular için koçluk görüşmelerinde çözüm ve yönlendirme alanı açılır.",
        iconKey: "help"
      },
      {
        title: "Deneme PDF ve performans analizi",
        description: "Net değişimi, hata yoğunluğu ve kapanış planı deneme çıktıları üzerinden değerlendirilir.",
        iconKey: "chart"
      }
    ];
  }

  if (product.categoryId === "mock-exam-club") {
    return [
      {
        title: "15'li deneme setlerine düzenli erişim",
        description: "Kulüp akışına göre deneme setleri fiziksel veya planlı uygulama modeliyle sunulur.",
        iconKey: "box"
      },
      {
        title: "Analiz ve tekrar odaklı kapanış",
        description: "Her deneme sonrasında hataların kümelendiği konular hızlı tekrar listesine dönüştürülür.",
        iconKey: "chart"
      },
      {
        title: "PDF destek materyalleri",
        description: "Ek çalışma sayfaları, çözüm özetleri ve mini tekrar materyalleri öğrenci hesabına eklenir.",
        iconKey: "file"
      },
      {
        title: "Programla uyumlu uygulama takvimi",
        description: "Denemeler haftalık tempo planına uygun şekilde yerleştirilir ve kulüp ritmi korunur.",
        iconKey: "calendar"
      },
      {
        title: "Sanal dershane destek alanı",
        description: "İçerikler ve destek materyalleri öğrenci hesabında düzenli biçimde görünür.",
        iconKey: "panel"
      },
      {
        title: "Online etkinlik ve tekrar geçişi",
        description: "Deneme sonuçlarından tekrar kampına veya video destek alanına hızlı geçiş kurulur.",
        iconKey: "arrow"
      }
    ];
  }

  return [
    {
      title: "Video ders arşivine 7/24 erişim",
      description: "Satın alınan içerikler öğrenci paneline tanımlanır ve istenen anda tekrar izlenebilir.",
      iconKey: "video"
    },
    {
      title: "Konu sıralı modül yapısı",
      description: "Ders akışı konu başlıklarına göre düzenlenir ve öğrenci modüller arasında kontrollü ilerler.",
      iconKey: "layers"
    },
    {
      title: "PDF ve çalışma föyleri",
      description: "Video akışına eşlik eden dokümanlar, tekrar sayfaları ve örnek çalışma föyleri paket içinde sunulur.",
      iconKey: "file"
    },
    {
      title: "Tekrar listeleri ve görev akışı",
      description: "İzlenen içeriğin ardından uygulanacak tekrar düzeni ve çözüm blokları öğrenciye net şekilde gösterilir.",
      iconKey: "checklist"
    },
    {
      title: "Deneme veya mini ölçüm desteği",
      description: "Pakete uygun değerlendirme içerikleriyle öğrencinin ilerleyişi düzenli olarak test edilir.",
      iconKey: "chart"
    },
    {
      title: "Hesaba anında tanımlanan içerik",
      description: "Ödeme sonrası erişim beklemeden öğrenci paneline düşen düzenli bir kullanım alanı sunulur.",
      iconKey: "flash"
    }
  ];
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
    const featureBlueprints = getSeedFeatureBlueprints(product);
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
        description:
          product.description ??
          [
            product.subtitle,
            "",
            ...featureBlueprints.map((feature) => `- ${feature.title}`)
          ].join("\n"),
        type: mapSeedProductType(product.provider),
        provider: mapSeedProvider(product.provider),
        publishStatus: PUBLISHED,
        isFeatured: productIndex < 6,
        sortOrder: (productIndex + 1) * 10,
        accentColor: product.tone,
        seoTitle: product.title,
        seoDescription: product.subtitle,
        introVideoSourceType: product.introVideoSourceType ?? null,
        introVideoUrl: product.introVideoUrl ?? null,
        introVideoPosterUrl: product.introVideoPosterUrl ?? null,
        introVideoTitle: product.introVideoTitle ?? null
      }
    });

    const variant = await prisma.productVariant.create({
      data: {
        productId: createdProduct.id,
        title: "Standart",
        sku: product.id.toUpperCase().replace(/[^A-Z0-9]+/g, "-"),
        billingLabel: product.price,
        price: parseSeedPrice(product.price),
        compareAtPrice: product.compareAtPrice ? parseSeedPrice(product.compareAtPrice) : null,
        currency: "TRY",
        isDefault: true,
        isActive: true,
        hasInstallments: product.hasInstallments ?? false,
        installmentCount: product.hasInstallments ? 12 : null,
        sortOrder: 10
      }
    });

    if (featureBlueprints.length > 0) {
      await prisma.productFeature.createMany({
        data: featureBlueprints.map((feature, featureIndex) => ({
          productId: createdProduct.id,
          title: feature.title,
          description: feature.description,
          iconKey: feature.iconKey ?? null,
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
          externalProductId: product.externalProductId ?? product.id,
          externalVariantId: product.externalVariantId ?? "standard",
          isActive: true
        }
      });
    }
  }
}

async function seedLmsShell() {
  await prisma.enrollment.deleteMany();
  await prisma.productCourse.deleteMany();
  await prisma.lessonResource.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.courseModule.deleteMany();
  await prisma.videoAsset.deleteMany();
  await prisma.course.deleteMany();

  const products = await prisma.product.findMany({
    where: {
      slug: {
        in: [
          "yazili-kampi-icerik-paketi",
          "tekrar-kampi-plani",
          "deneme-kulubu-basili-kargo"
        ]
      }
    }
  });

  const productBySlug = new Map(products.map((product) => [product.slug, product]));

  const courseBlueprints = [
    {
      productSlug: "yazili-kampi-icerik-paketi",
      course: {
        slug: "yazili-kampi-ders-arsivi",
        title: "Yazılı Kampı Ders Arşivi",
        shortDescription: "Kamp boyunca video, tekrar ve görev akışını tek kursta toplayan ders alanı.",
        description:
          "Bu kurs; kamp videosu, günlük tekrar düzeni ve destek kaynaklarını tek öğrenci panelinde toplar.",
        estimatedDurationMinutes: 420,
        modules: [
          {
            title: "Kampa Giriş ve Tempo Kurulumu",
            description: "Kampın ilk günlerinde ritim kurmaya yarayan açılış blokları.",
            lessons: [
              {
                slug: "kamp-acilis-plani",
                title: "Kamp Açılış Planı",
                description: "İlk gün görev dizilimi ve çalışma bloklarının nasıl oturacağı.",
                lessonType: "VIDEO",
                durationSeconds: 1100,
                videoTitle: "Kamp Açılış Planı",
                resources: [
                  {
                    title: "Kamp Takvim PDF",
                    resourceType: "LINK",
                    externalUrl: "/ucretsiz-materyaller/2026-yks-kac-gun-kaldi"
                  }
                ]
              },
              {
                slug: "kamp-ilk-tekrar-duzeni",
                title: "İlk Tekrar Düzeni",
                description: "İlk hafta tekrar kartlarının neye göre sıralanacağı.",
                lessonType: "DOCUMENT",
                durationSeconds: 720,
                resources: [
                  {
                    title: "Tekrar Listesi",
                    resourceType: "LINK",
                    externalUrl: "/ucretsiz-materyaller"
                  }
                ]
              }
            ]
          },
          {
            title: "Yoğun Video ve Görev Akışı",
            description: "Günlük video blokları ve görev eşleşmeleri.",
            lessons: [
              {
                slug: "gunluk-video-ritmi",
                title: "Günlük Video Ritmi",
                description: "Kamp videosu ile soru çözümü arasındaki doğru geçiş.",
                lessonType: "VIDEO",
                durationSeconds: 1380,
                videoTitle: "Günlük Video Ritmi",
                resources: [
                  {
                    title: "Günlük Görev Kartı",
                    resourceType: "LINK",
                    externalUrl: "/ucretsiz-materyaller/2026-yks-kac-gun-kaldi"
                  }
                ]
              },
              {
                slug: "kamp-sonu-kapanis",
                title: "Kamp Sonu Kapanış",
                description: "Kamp bittikten sonra eksiklerin nasıl toparlanacağı.",
                lessonType: "VIDEO",
                durationSeconds: 900,
                videoTitle: "Kamp Sonu Kapanış",
                resources: []
              }
            ]
          }
        ]
      }
    },
    {
      productSlug: "tekrar-kampi-plani",
      course: {
        slug: "tekrar-kampi-hizli-kapanis",
        title: "Tekrar Kampı Hızlı Kapanış",
        shortDescription: "Son viraja giren öğrenci için tekrar sırası, soru blokları ve hızlandırılmış kapanış.",
        description:
          "Tekrar kampı; son hafta konu kapanışlarını, kısa video dönüşlerini ve soru bloğu ritmini düzenler.",
        estimatedDurationMinutes: 360,
        modules: [
          {
            title: "Tekrar Sırası ve Öncelik",
            description: "Önce hangi konuların döneceğini netleştiren modül.",
            lessons: [
              {
                slug: "tekrar-listesi-kurulumu",
                title: "Tekrar Listesi Kurulumu",
                description: "Son hafta tekrar sırasının yanlış kurulmasını engelleyen ders.",
                lessonType: "VIDEO",
                durationSeconds: 960,
                videoTitle: "Tekrar Listesi Kurulumu",
                resources: []
              },
              {
                slug: "kisa-video-donusleri",
                title: "Kısa Video Dönüşleri",
                description: "Uzun konu anlatımı yerine hangi kısa videolara dönülmeli?",
                lessonType: "VIDEO",
                durationSeconds: 840,
                videoTitle: "Kısa Video Dönüşleri",
                resources: []
              }
            ]
          },
          {
            title: "Soru Bloğu ve Deneme Desteği",
            description: "Tekrarla birlikte soru çözümü nasıl konumlanmalı?",
            lessons: [
              {
                slug: "tekrar-sonrasi-soru-blogu",
                title: "Tekrar Sonrası Soru Bloğu",
                description: "Tekrar edilen konudan hemen sonra soru bloğu kurma mantığı.",
                lessonType: "VIDEO",
                durationSeconds: 1180,
                videoTitle: "Tekrar Sonrası Soru Bloğu",
                resources: [
                  {
                    title: "Deneme Analiz Formu",
                    resourceType: "LINK",
                    externalUrl: "/ucretsiz-materyaller/2026-lgs-kac-gun-kaldi"
                  }
                ]
              }
            ]
          }
        ]
      }
    },
    {
      productSlug: "deneme-kulubu-basili-kargo",
      course: {
        slug: "deneme-analiz-kutuphanesi",
        title: "Deneme Analiz Kütüphanesi",
        shortDescription: "Basılı deneme paketleri için analiz mantığı, yanlış defteri ve geri bildirim akışı.",
        description:
          "Bu kurs, deneme sonrasında neyin ölçülmesi gerektiğini ve hata analizinin nasıl tutulacağını anlatır.",
        estimatedDurationMinutes: 280,
        modules: [
          {
            title: "Deneme Sonrası Okuma",
            description: "Net sayısından daha fazlasını okuyan analiz bakışı.",
            lessons: [
              {
                slug: "ilk-analiz-formu",
                title: "İlk Analiz Formu",
                description: "Yanlış türlerini ayıran ilk analiz şablonu.",
                lessonType: "DOCUMENT",
                durationSeconds: 540,
                resources: [
                  {
                    title: "Analiz Formuna Git",
                    resourceType: "LINK",
                    externalUrl: "/ucretsiz-materyaller"
                  }
                ]
              },
              {
                slug: "yanlis-defteri-sistemi",
                title: "Yanlış Defteri Sistemi",
                description: "Yanlışların birikmeden takip edilmesi için temel mantık.",
                lessonType: "VIDEO",
                durationSeconds: 1020,
                videoTitle: "Yanlış Defteri Sistemi",
                resources: []
              }
            ]
          }
        ]
      }
    }
  ] as const;

  for (const blueprint of courseBlueprints) {
    const product = productBySlug.get(blueprint.productSlug);

    if (!product) {
      continue;
    }

    const course = await prisma.course.create({
      data: {
        slug: blueprint.course.slug,
        title: blueprint.course.title,
        shortDescription: blueprint.course.shortDescription,
        description: blueprint.course.description,
        publishStatus: PUBLISHED,
        estimatedDurationMinutes: blueprint.course.estimatedDurationMinutes
      }
    });

    await prisma.productCourse.create({
      data: {
        productId: product.id,
        courseId: course.id,
        sortOrder: 10
      }
    });

    for (let moduleIndex = 0; moduleIndex < blueprint.course.modules.length; moduleIndex += 1) {
      const moduleBlueprint = blueprint.course.modules[moduleIndex];

      const moduleRecord = await prisma.courseModule.create({
        data: {
          courseId: course.id,
          title: moduleBlueprint.title,
          description: moduleBlueprint.description,
          sortOrder: (moduleIndex + 1) * 10,
          publishStatus: PUBLISHED
        }
      });

      for (let lessonIndex = 0; lessonIndex < moduleBlueprint.lessons.length; lessonIndex += 1) {
        const lessonBlueprint = moduleBlueprint.lessons[lessonIndex];
        const videoAsset =
          lessonBlueprint.lessonType === "VIDEO"
            ? await prisma.videoAsset.create({
                data: {
                  provider: "EXTERNAL",
                  title: lessonBlueprint.videoTitle,
                  status: "READY"
                }
              })
            : null;

        const lessonRecord = await prisma.lesson.create({
          data: {
            moduleId: moduleRecord.id,
            slug: lessonBlueprint.slug,
            title: lessonBlueprint.title,
            description: lessonBlueprint.description,
            lessonType: lessonBlueprint.lessonType,
            sortOrder: (lessonIndex + 1) * 10,
            publishStatus: PUBLISHED,
            durationSeconds: lessonBlueprint.durationSeconds,
            isPreview: lessonIndex === 0,
            videoAssetId: videoAsset?.id
          }
        });

        for (let resourceIndex = 0; resourceIndex < lessonBlueprint.resources.length; resourceIndex += 1) {
          const resource = lessonBlueprint.resources[resourceIndex];

          await prisma.lessonResource.create({
            data: {
              lessonId: lessonRecord.id,
              title: resource.title,
              resourceType: resource.resourceType,
              externalUrl: resource.externalUrl,
              sortOrder: (resourceIndex + 1) * 10,
              isPublished: true
            }
          });
        }
      }
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
  await seedLmsShell();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
