export type ResourceLink = {
  title: string;
  type: string;
  summary: string;
  href: string;
  buttonLabel?: string;
  countdownSlug?: string;
  opensInNewTab?: boolean;
};

export type ExamCountdownTarget = {
  label: string;
  targetIso?: string;
  dateLabel: string;
  note: string;
};

export type ExamArticleSection = {
  title: string;
  body: string;
};

export type ExamCountdownPage = {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  updatedLabel: string;
  countdowns: readonly ExamCountdownTarget[];
  videoTitle: string;
  videoNote: string;
  officialLinks: readonly ResourceLink[];
  articleSections: readonly ExamArticleSection[];
};

export const freeTools: readonly ResourceLink[] = [
  {
    title: "2026 YKS'ye Kaç Gün Kaldı?",
    type: "Ücretsiz",
    summary: "2026 YKS oturum tarihlerini ve saatlerini tek ekranda takip etmek isteyenler için canlı geri sayım.",
    href: "/ucretsiz-materyaller/2026-yks-kac-gun-kaldi",
    buttonLabel: "Ücretsiz Aç",
    countdownSlug: "2026-yks-kac-gun-kaldi"
  },
  {
    title: "2027 YKS'ye Kaç Gün Kaldı?",
    type: "Ücretsiz",
    summary: "2027 YKS için resmî takvim açıklamasını bekleyen öğrenciler adına güncel durum sayfası.",
    href: "/ucretsiz-materyaller/2027-yks-kac-gun-kaldi",
    buttonLabel: "Ücretsiz Aç",
    countdownSlug: "2027-yks-kac-gun-kaldi"
  },
  {
    title: "2026 LGS'ye Kaç Gün Kaldı?",
    type: "Ücretsiz",
    summary: "2026 LGS tarih ve saatlerini oturum bazında takip etmek isteyen öğrenciler için geri sayım alanı.",
    href: "/ucretsiz-materyaller/2026-lgs-kac-gun-kaldi",
    buttonLabel: "Ücretsiz Aç",
    countdownSlug: "2026-lgs-kac-gun-kaldi"
  },
  {
    title: "YKS Puan Hesapla",
    type: "Ücretsiz",
    summary: "YKS hedefi için net ve bölüm araştırmasını destekleyen ücretsiz resmî kaynaklara yönlen.",
    href: "https://yokatlas.yok.gov.tr/netler-tablo.php?b=10103",
    buttonLabel: "Aracı Aç"
  },
  {
    title: "YKS Atlas",
    type: "Ücretsiz",
    summary: "Bölüm ve üniversite araştırmasını resmî atlas verileri üzerinden yürütmek isteyenler için.",
    href: "https://yokatlas.yok.gov.tr/",
    buttonLabel: "Resmî Sayfaya Git"
  },
  {
    title: "Maarif Simülasyonları",
    type: "Ücretsiz",
    summary: "EBA üzerinden erişilebilen eğitici simülasyonlarla ders konularını daha etkileşimli incele.",
    href: "https://www.eba.gov.tr/",
    buttonLabel: "İçeriği Aç"
  }
] as const;

export const usefulLinks: readonly ResourceLink[] = [
  {
    title: "MEB",
    type: "Resmî Kaynak",
    summary: "Millî Eğitim Bakanlığı duyuruları, takvimleri ve resmî eğitim bilgileri.",
    href: "https://www.meb.gov.tr/",
    buttonLabel: "Resmî Sayfaya Git"
  },
  {
    title: "ÖSYM",
    type: "Resmî Kaynak",
    summary: "Sınav takvimi, kılavuzlar ve resmî duyurular için temel kaynak.",
    href: "https://www.osym.gov.tr/",
    buttonLabel: "Resmî Sayfaya Git"
  },
  {
    title: "ÖSYM AİS",
    type: "Aday İşlemleri",
    summary: "Başvuru, sınav giriş belgesi ve sonuç işlemleri için aday girişi.",
    href: "https://ais.osym.gov.tr/",
    buttonLabel: "Sisteme Git"
  },
  {
    title: "YÖK Atlas",
    type: "Tercih Aracı",
    summary: "Program, üniversite ve tercih araştırmasını resmî verilerle yürütmek isteyenler için.",
    href: "https://yokatlas.yok.gov.tr/",
    buttonLabel: "Atlası Aç"
  }
] as const;

export const pdfDocuments: readonly ResourceLink[] = [
  {
    title: "TYT Çalışma Planı PDF",
    type: "PDF Döküman",
    summary: "Haftalık ders bloklarını, tekrar zamanlarını ve deneme günlerini birlikte planlamak isteyenler için düzenli TYT çalışma şablonu.",
    href: "/ucretsiz-materyaller/2026-yks-kac-gun-kaldi",
    buttonLabel: "İçeriği İncele"
  },
  {
    title: "AYT Tekrar Çizelgesi PDF",
    type: "PDF Döküman",
    summary: "Konu tekrarlarını haftalara ayırarak ilerlemek isteyen öğrenciler için sade ve takip edilebilir AYT çizelgesi.",
    href: "/ucretsiz-materyaller/2026-yks-kac-gun-kaldi",
    buttonLabel: "İçeriği İncele"
  },
  {
    title: "Deneme Analiz Formu PDF",
    type: "PDF Döküman",
    summary: "Deneme sonrası netleri, süre kullanımını ve eksik konuları tek tabloda değerlendirmek için pratik analiz formu.",
    href: "/ucretsiz-materyaller/2026-lgs-kac-gun-kaldi",
    buttonLabel: "İçeriği İncele"
  },
  {
    title: "Hedef Takip Sayfası PDF",
    type: "PDF Döküman",
    summary: "Aylık hedefleri, tamamlanan görevleri ve dönem sonu notlarını düzenli biçimde kaydetmek için takip sayfası.",
    href: "/ucretsiz-materyaller/2027-yks-kac-gun-kaldi",
    buttonLabel: "İçeriği İncele"
  }
] as const;

export const guidanceContent: readonly ResourceLink[] = [
  {
    title: "Blog",
    type: "Rehberlik İçeriği",
    summary: "Sınav dönemi, motivasyon ve çalışma düzeni odaklı yazı alanı.",
    href: "/ucretsiz-materyaller/2026-yks-kac-gun-kaldi",
    buttonLabel: "Yazıyı Aç"
  },
  {
    title: "Ücretsiz Araçlarımız",
    type: "Rehberlik İçeriği",
    summary: "Araçların nasıl kullanılacağına dair yönlendirici giriş alanı.",
    href: "/ucretsiz-materyaller",
    buttonLabel: "Alanı Aç"
  },
  {
    title: "Ücretsiz Kamplar",
    type: "Rehberlik İçeriği",
    summary: "Sömestr, yaz ve tekrar dönemleri için hazırlanmış kamp düzenlerini tanıtan rehber içerikler.",
    href: "/ucretsiz-materyaller/2026-yks-kac-gun-kaldi",
    buttonLabel: "İçeriği Aç"
  },
  {
    title: "Çalışma Tüyoları",
    type: "Rehberlik İçeriği",
    summary: "Rutin, tempo ve odak geliştirmek isteyen öğrencilere yönelik pratik içerikler.",
    href: "/ucretsiz-materyaller/2026-lgs-kac-gun-kaldi",
    buttonLabel: "İçeriği Aç"
  }
] as const;

export const speedReading: ResourceLink = {
  title: "Hızlı Okuma Egzersizleri",
  type: "Ücretsiz",
  summary:
    "Okuma hızını, dikkatini ve paragraf ritmini geliştirmek isteyen öğrenciler için doğrudan egzersiz bağlantısı.",
  href: "https://www.m5bilisim.com/tr/hizli-okuma/",
  buttonLabel: "Egzersizi Aç"
};

export const examCountdownPages: readonly ExamCountdownPage[] = [
  {
    slug: "2026-yks-kac-gun-kaldi",
    eyebrow: "2026 YKS Geri Sayım",
    title: "2026 YKS oturumlarına kaç ay, kaç gün, kaç saat kaldı?",
    description:
      "TYT, AYT ve YDT oturumlarını ayrı ayrı takip et. Tarih ve saatler resmî ÖSYM kaynaklarına göre işlendi.",
    updatedLabel: "Son güncelleme: 9 Mayıs 2026 itibarıyla resmî ÖSYM duyuruları esas alındı",
    countdowns: [
      {
        label: "TYT",
        targetIso: "2026-06-20T10:15:00+03:00",
        dateLabel: "20 Haziran 2026 Cumartesi, 10:15",
        note: "1. oturum: Temel Yeterlilik Testi"
      },
      {
        label: "AYT",
        targetIso: "2026-06-21T10:15:00+03:00",
        dateLabel: "21 Haziran 2026 Pazar, 10:15",
        note: "2. oturum: Alan Yeterlilik Testleri"
      },
      {
        label: "YDT",
        targetIso: "2026-06-21T15:45:00+03:00",
        dateLabel: "21 Haziran 2026 Pazar, 15:45",
        note: "3. oturum: Yabancı Dil Testi"
      }
    ],
    videoTitle: "YKS motivasyon ve son düzlüğe giriş videosu",
    videoNote:
      "TYT, AYT ve YDT öncesi son haftalarda odak, moral ve çalışma düzenini korumaya yardımcı kısa motivasyon videosu bu alanda yer alır.",
    officialLinks: [
      {
        title: "ÖSYM Takvim / OMS",
        type: "Resmî Kaynak",
        summary: "2026-YKS oturum tarihleri ÖSYM takvim görünümünde yer alır.",
        href: "https://www.osym.gov.tr/oms/",
        buttonLabel: "Takvimi Aç"
      },
      {
        title: "2026-YKS Başvuru Duyurusu",
        type: "Resmî Kaynak",
        summary: "20-21 Haziran 2026 sınav düzeni ÖSYM duyurusunda açıklandı.",
        href: "https://www.osym.gov.tr/TR,33850/2026-yks-basvurularin-alinmasi-06022026.html",
        buttonLabel: "Duyuruyu Aç"
      },
      {
        title: "ÖSYM AİS",
        type: "Aday İşlemleri",
        summary: "Başvuru ve aday işlemleri için resmî giriş sistemi.",
        href: "https://ais.osym.gov.tr/",
        buttonLabel: "Sisteme Git"
      },
      {
        title: "YÖK Atlas",
        type: "Tercih Aracı",
        summary: "Bölüm ve üniversite araştırmasını resmî atlas verileriyle desteklemek için.",
        href: "https://yokatlas.yok.gov.tr/",
        buttonLabel: "Atlası Aç"
      }
    ],
    articleSections: [
      {
        title: "2026 YKS ne zaman yapılacak?",
        body:
          "ÖSYM'nin 6 Şubat 2026 tarihli duyurusuna göre 2026 YKS, 20-21 Haziran 2026 tarihlerinde uygulanacak. TYT 20 Haziran 2026 Cumartesi günü, AYT ve YDT ise 21 Haziran 2026 Pazar günü yapılacak."
      },
      {
        title: "2026 YKS saat kaçta başlayacak?",
        body:
          "ÖSYM'nin 26 Mart 2026 tarihli açıklamasında TYT'nin 20 Haziran 2026 Cumartesi günü saat 10.15'te, AYT'nin 21 Haziran 2026 Pazar günü saat 10.15'te ve YDT'nin aynı gün saat 15.45'te başlayacağı belirtildi. Bu sayaç alanı doğrudan bu saatlere göre hesaplanır."
      },
      {
        title: "2026 YKS geri sayımı neden oturum bazında takip edilmeli?",
        body:
          "TYT, AYT ve YDT farklı oturumlar olduğu için tek sayaç öğrenciyi yanıltır. Son ay, son hafta ve son gün planı her oturumun ağırlığına göre değişir; deneme sıklığı, tekrar sırası ve uyku düzeni buna göre ayarlanmalıdır."
      },
      {
        title: "2026 YKS için hangi resmî sayfalar izlenmeli?",
        body:
          "ÖSYM'nin takvim ve duyuru sayfaları tarih, saat, sınav giriş belgesi ve sonuç akışı için temel kaynaktır. Aday işlemleri için AİS; bölüm ve tercih araştırması için YÖK Atlas düzenli olarak izlenmelidir. Aşağıdaki bağlantılar doğrudan resmî kurumlara gider."
      }
    ]
  },
  {
    slug: "2027-yks-kac-gun-kaldi",
    eyebrow: "2027 YKS Geri Sayım",
    title: "2027 YKS için resmî tarih açıklandı mı?",
    description:
      "ÖSYM'nin 2027 YKS için resmî sınav tarihi ve saati henüz açıklanmadıysa, tahmin değil resmî güncelleme beklemek gerekir.",
    updatedLabel: "Son güncelleme: 9 Mayıs 2026 itibarıyla 2027 YKS için resmî tarih ilanı görünmüyor",
    countdowns: [
      {
        label: "Resmî Tarih Bekleniyor",
        dateLabel: "ÖSYM 2027 takvimi henüz ilan edilmedi",
        note: "Tahmini tarih kullanılmadı; resmî açıklama beklenecek."
      }
    ],
    videoTitle: "2027 YKS için uzun vadeli motivasyon videosu",
    videoNote:
      "Tarih açıklanmadan önce düzenli hazırlık kurmak isteyen öğrenciler için uzun vadeli çalışma disiplini ve planlama önerileri bu alanda paylaşılır.",
    officialLinks: [
      {
        title: "ÖSYM Duyurular",
        type: "Resmî Kaynak",
        summary: "2027 YKS ile ilgili resmî açıklama geldiğinde ilk takip edilmesi gereken yer.",
        href: "https://www.osym.gov.tr/duyurular/",
        buttonLabel: "Duyurulara Git"
      },
      {
        title: "ÖSYM Takvim",
        type: "Resmî Kaynak",
        summary: "Yeni sınav takvimi yayımlandığında YKS tarihleri bu sayfada görünür.",
        href: "https://www.osym.gov.tr/TR,8797/takvim.html",
        buttonLabel: "Takvimi Aç"
      },
      {
        title: "ÖSYM AİS",
        type: "Aday İşlemleri",
        summary: "Başvuru dönemi açıldığında aday işlemleri buradan yürütülür.",
        href: "https://ais.osym.gov.tr/",
        buttonLabel: "Sisteme Git"
      }
    ],
    articleSections: [
      {
        title: "2027 YKS tarihi neden şu an geri sayıma bağlanmadı?",
        body:
          "9 Mayıs 2026 itibarıyla ÖSYM'nin 2027 YKS için resmî sınav tarihi ve saatini ilan ettiğine dair doğrulanmış bir kayıt görünmüyor. Bu yüzden tahmini sayaç yerine resmî açıklama bekleyen durum kartı kullanıldı."
      },
      {
        title: "2027 YKS hazırlığı tarih açıklanmadan nasıl planlanmalı?",
        body:
          "Tarih açıklanmadan önce yapılması gereken şey agresif takvim üretmek değil, ders düzeni ve net artışı üstüne sistem kurmaktır. Bu dönem temel güçlendirme, kaynak seçimi ve haftalık rutin oturtma için en verimli alandır."
      },
      {
        title: "2027 YKS için hangi resmî kanallar takip edilmeli?",
        body:
          "ÖSYM duyurular sayfası ve sınav takvimi, tarih ve başvuru süreci belli olduğunda en güncel bilgiyi verir. Aday işlemleri açıldığında AİS devreye girer. Tercih ve bölüm araştırması içinse YÖK Atlas şimdiden kullanılabilir."
      }
    ]
  },
  {
    slug: "2026-lgs-kac-gun-kaldi",
    eyebrow: "2026 LGS Geri Sayım",
    title: "2026 LGS oturumlarına kaç ay, kaç gün, kaç saat kaldı?",
    description:
      "2026 LGS için güncellenen tarih ve oturum saatlerini tek ekranda takip et. Sözel ve sayısal bölümler ayrı sayaçlarla gösterilir.",
    updatedLabel: "Son güncelleme: 6 Nisan 2026 tarihli MEB güncellemesi ve 2026 kılavuzu esas alındı",
    countdowns: [
      {
        label: "Sözel Bölüm",
        targetIso: "2026-06-13T09:30:00+03:00",
        dateLabel: "13 Haziran 2026 Cumartesi, 09:30",
        note: "1. oturum"
      },
      {
        label: "Sayısal Bölüm",
        targetIso: "2026-06-13T11:30:00+03:00",
        dateLabel: "13 Haziran 2026 Cumartesi, 11:30",
        note: "2. oturum"
      }
    ],
    videoTitle: "LGS motivasyon ve sınav sabahı odak videosu",
    videoNote:
      "Sınav sabahında dikkat, tempo ve sakinliği korumaya yardımcı kısa LGS hazırlık videosu burada izlenir.",
    officialLinks: [
      {
        title: "MEB Güncel Tarih Duyurusu",
        type: "Resmî Kaynak",
        summary: "LGS tarihinin 13 Haziran 2026 olarak güncellendiği resmî açıklama.",
        href: "https://www.meb.gov.tr/basin-aciklamasi//haber/40315/tr",
        buttonLabel: "Duyuruyu Aç"
      },
      {
        title: "2026 LGS Kılavuzu",
        type: "Kılavuz",
        summary: "2026 LGS başvuru ve uygulama kılavuzu; oturum saatleri ve sınav akışı burada yer alır.",
        href: "https://www.meb.gov.tr/meb_iys_dosyalar/2026_04/03170012_LGS_Basvuru_ve_Uygulama_Kilavuzu_2026_.pdf",
        buttonLabel: "PDF Aç"
      },
      {
        title: "MEB",
        type: "Resmî Kaynak",
        summary: "Millî Eğitim Bakanlığı ana sayfası ve duyuruları.",
        href: "https://www.meb.gov.tr/",
        buttonLabel: "Resmî Sayfaya Git"
      },
      {
        title: "e-Okul",
        type: "Aday İşlemleri",
        summary: "Başvuru ve öğrenci işlemleri için kullanılan sistem.",
        href: "https://eokul.meb.gov.tr/",
        buttonLabel: "Sisteme Git"
      }
    ],
    articleSections: [
      {
        title: "2026 LGS ne zaman yapılacak?",
        body:
          "MEB'in 6 Nisan 2026 tarihli basın açıklamasına göre 2026 LGS merkezî sınavı 13 Haziran 2026 Cumartesi günü yapılacak. Bu bilgi önemlidir; çünkü daha önce duyurulan 14 Haziran 2026 tarihi daha sonra güncellendi."
      },
      {
        title: "2026 LGS saat kaçta başlayacak?",
        body:
          "2026 LGS kılavuzuna göre birinci oturum olan Sözel Bölüm saat 09.30'da, ikinci oturum olan Sayısal Bölüm ise saat 11.30'da başlayacak. Bu geri sayım kartları doğrudan bu saatlere göre hesaplanır."
      },
      {
        title: "2026 LGS geri sayımı neden iki ayrı oturum olarak veriliyor?",
        body:
          "Sözel ve sayısal bölüm aynı gün içinde farklı saatlerde başladığı için tek sayaç kullanmak doğru değildir. Özellikle sınav sabahı rutinini planlamak, beslenme ve mola akışını ayarlamak için iki ayrı sayaç daha işlevseldir."
      },
      {
        title: "2026 LGS için hangi resmî kaynaklar izlenmeli?",
        body:
          "MEB duyuruları ve uygulama kılavuzu tarih, saat ve süreç değişiklikleri için temel kaynaktır. Öğrenci işlemleri ve sınav sürecinin takibi için e-Okul da düzenli izlenmelidir. Bu sayfadaki bağlantılar doğrudan resmî kaynaklara yönlenir."
      }
    ]
  }
] as const;

export function getExamCountdownPage(slug: string) {
  return examCountdownPages.find((page) => page.slug === slug) ?? null;
}
