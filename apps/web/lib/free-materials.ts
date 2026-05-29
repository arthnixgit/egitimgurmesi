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

const yksOfficialLinks: readonly ResourceLink[] = [
  {
    title: "ÖSYM Takvim",
    type: "Resmi Kaynak",
    summary: "YKS oturum tarihleri, başvuru dönemleri ve güncel sınav duyuruları için ana kaynak.",
    href: "https://www.osym.gov.tr/oms/",
    buttonLabel: "Takvimi Aç"
  },
  {
    title: "ÖSYM AİS",
    type: "Aday İşlemleri",
    summary: "Başvuru, sınav giriş belgesi ve sonuç işlemleri için aday giriş sistemi.",
    href: "https://ais.osym.gov.tr/",
    buttonLabel: "Sisteme Git"
  },
  {
    title: "YÖK Atlas",
    type: "Tercih Aracı",
    summary: "Üniversite, bölüm, başarı sırası ve tercih araştırması için resmi veri ekranı.",
    href: "https://yokatlas.yok.gov.tr/",
    buttonLabel: "Atlası Aç"
  }
] as const;

export const freeTools: readonly ResourceLink[] = [
  {
    title: "TYT",
    type: "Ücretsiz",
    summary: "2026 TYT için canlı geri sayım, resmi oturum saati ve son hafta çalışma önerileri.",
    href: "/ucretsiz-materyaller/tyt-kac-gun-kaldi",
    buttonLabel: "TYT Sayacını Aç",
    countdownSlug: "tyt-kac-gun-kaldi"
  },
  {
    title: "AYT",
    type: "Ücretsiz",
    summary: "2026 AYT için ayrı geri sayım, alan dersleri odaklı kapanış planı ve resmi bağlantılar.",
    href: "/ucretsiz-materyaller/ayt-kac-gun-kaldi",
    buttonLabel: "AYT Sayacını Aç",
    countdownSlug: "ayt-kac-gun-kaldi"
  },
  {
    title: "YDT",
    type: "Ücretsiz",
    summary: "2026 YDT için oturum saatine göre çalışan sayaç ve dil sınavı son gün hazırlık notları.",
    href: "/ucretsiz-materyaller/ydt-kac-gun-kaldi",
    buttonLabel: "YDT Sayacını Aç",
    countdownSlug: "ydt-kac-gun-kaldi"
  },
  {
    title: "2026 LGS'ye Kaç Gün Kaldı?",
    type: "Ücretsiz",
    summary: "2026 LGS için sözel ve sayısal oturum saatlerini resmi takvime göre takip et.",
    href: "/ucretsiz-materyaller/2026-lgs-kac-gun-kaldi",
    buttonLabel: "LGS Sayacını Aç",
    countdownSlug: "2026-lgs-kac-gun-kaldi"
  },
  {
    title: "YKS Puan Hesapla",
    type: "Ücretsiz",
    summary: "TYT, AYT, OBP ve tercih hedefini daha doğru yorumlamak için puan hesaplama rehberi.",
    href: "/ucretsiz-materyaller/puan-hesaplama",
    buttonLabel: "Puan Rehberini Aç"
  },
  {
    title: "YKS Atlas",
    type: "Ücretsiz",
    summary: "Bölüm, üniversite ve başarı sırası araştırmasını YÖK Atlas verileriyle planla.",
    href: "/ucretsiz-materyaller/yks-atlas",
    buttonLabel: "Atlas Rehberini Aç"
  },
  {
    title: "Maarif Simülasyonları",
    type: "Ücretsiz",
    summary: "Fizik, kimya ve fen kavramlarını etkileşimli simülasyonlarla daha görünür hale getir.",
    href: "/ucretsiz-materyaller/maarif-simulasyonlari",
    buttonLabel: "Simülasyon Rehberini Aç"
  }
] as const;

export const usefulLinks: readonly ResourceLink[] = [
  {
    title: "MEB",
    type: "Resmi Kaynak",
    summary: "Milli Eğitim Bakanlığı duyuruları, sınav açıklamaları, takvimler ve kılavuzlar.",
    href: "https://www.meb.gov.tr/",
    buttonLabel: "Resmi Sayfaya Git"
  },
  {
    title: "ÖSYM",
    type: "Resmi Kaynak",
    summary: "YKS, KPSS ve diğer merkezi sınavlar için duyuru, takvim ve kılavuz merkezi.",
    href: "https://www.osym.gov.tr/",
    buttonLabel: "Resmi Sayfaya Git"
  },
  {
    title: "ÖSYM AİS",
    type: "Aday İşlemleri",
    summary: "Başvuru, sınav giriş belgesi, tercih ve sonuç işlemleri için aday giriş ekranı.",
    href: "https://ais.osym.gov.tr/",
    buttonLabel: "Sisteme Git"
  },
  {
    title: "YÖK Atlas",
    type: "Tercih Aracı",
    summary: "Üniversite programlarını, taban başarı sıralarını ve kontenjanları inceleme ekranı.",
    href: "https://yokatlas.yok.gov.tr/",
    buttonLabel: "Atlası Aç"
  }
] as const;

export const pdfDocuments: readonly ResourceLink[] = [
  {
    title: "TYT Çalışma Planı PDF",
    type: "PDF Doküman",
    summary: "Türkçe, temel matematik, sosyal ve fen çalışmalarını haftalık bloklara ayırmak için plan şablonu.",
    href: "/ucretsiz-materyaller/pdf-dokumanlar",
    buttonLabel: "PDF Alanını Aç"
  },
  {
    title: "AYT Tekrar Çizelgesi PDF",
    type: "PDF Doküman",
    summary: "Alan derslerinde konu tekrarını, deneme analizini ve son hafta önceliklerini takip etmek için çizelge.",
    href: "/ucretsiz-materyaller/pdf-dokumanlar",
    buttonLabel: "PDF Alanını Aç"
  },
  {
    title: "Deneme Analiz Formu PDF",
    type: "PDF Doküman",
    summary: "Net, süre, yanlış türü ve kazanım eksiğini tek tabloda görerek deneme sonrası aksiyon almak için form.",
    href: "/ucretsiz-materyaller/pdf-dokumanlar",
    buttonLabel: "PDF Alanını Aç"
  },
  {
    title: "Hedef Takip Sayfası PDF",
    type: "PDF Doküman",
    summary: "Aylık hedef, tamamlanan görev ve koçluk notlarını düzenli kaydetmek için takip sayfası.",
    href: "/ucretsiz-materyaller/pdf-dokumanlar",
    buttonLabel: "PDF Alanını Aç"
  }
] as const;

export const guidanceContent: readonly ResourceLink[] = [
  {
    title: "Blog",
    type: "Rehberlik İçeriği",
    summary: "Sınav dönemi, motivasyon, deneme analizi ve çalışma planı hakkında SEO odaklı rehber yazılar.",
    href: "/ucretsiz-materyaller/blog",
    buttonLabel: "Blogu Aç"
  },
  {
    title: "Ücretsiz Araçlarımız",
    type: "Rehberlik İçeriği",
    summary: "Sayaç, puan hesaplama, atlas, deneme ve simülasyon araçlarının hangi amaçla kullanılacağını öğren.",
    href: "/ucretsiz-materyaller",
    buttonLabel: "Araçları Aç"
  },
  {
    title: "Ücretsiz Kamplar",
    type: "Rehberlik İçeriği",
    summary: "Yaz, ara tatil ve sınav öncesi tekrar dönemlerinde ücretsiz içerikleri nasıl kullanacağını planla.",
    href: "/ucretsiz-materyaller/blog",
    buttonLabel: "Rehberi Aç"
  },
  {
    title: "Çalışma Tüyoları",
    type: "Rehberlik İçeriği",
    summary: "Konu tamamlama, soru çözümü, deneme takibi ve motivasyon dengesini kurmak için kısa öneriler.",
    href: "/ucretsiz-materyaller/blog",
    buttonLabel: "Tüyoları Oku"
  }
] as const;

export const speedReading: ResourceLink = {
  title: "Hızlı Okuma Egzersizleri",
  type: "Ücretsiz",
  summary: "Paragraf sorularında hız, dikkat ve anlama ritmini geliştirmek isteyen öğrenciler için egzersiz bağlantısı.",
  href: "https://www.m5bilisim.com/tr/hizli-okuma/",
  buttonLabel: "Egzersizi Aç",
  opensInNewTab: true
};

export const examCountdownPages: readonly ExamCountdownPage[] = [
  {
    slug: "tyt-kac-gun-kaldi",
    eyebrow: "2026 TYT Sayacı",
    title: "TYT'ye kaç gün kaldı?",
    description:
      "2026 TYT için canlı geri sayımı takip et; sınav tarihi, başlangıç saati, süre yönetimi ve son hafta hazırlık notlarını tek sayfada gör.",
    updatedLabel: "Resmi ÖSYM açıklamalarına göre güncellenmiştir.",
    countdowns: [
      {
        label: "TYT",
        targetIso: "2026-06-20T10:15:00+03:00",
        dateLabel: "20 Haziran 2026 Cumartesi, 10:15",
        note: "1. oturum: Temel Yeterlilik Testi"
      }
    ],
    videoTitle: "TYT motivasyon ve son hafta odak videosu",
    videoNote: "Paragraf, problem, deneme analizi ve sınav sabahı ritmini korumaya yardımcı kısa video alanı.",
    officialLinks: yksOfficialLinks,
    articleSections: [
      {
        title: "2026 TYT ne zaman yapılacak?",
        body:
          "2026 YKS'nin ilk oturumu olan TYT, 20 Haziran 2026 Cumartesi günü saat 10.15'te uygulanacaktır. Eğitim Gürmesi Akademi TYT sayacı, kalan süreyi gün, saat, dakika ve saniye olarak gösterir."
      },
      {
        title: "TYT sayacı nasıl kullanılmalı?",
        body:
          "Sayaç yalnızca kalan zamanı göstermek için değil, çalışma fazını belirlemek için kullanılmalıdır. Kalan süre azaldıkça konu öğrenme, tekrar, deneme ve yanlış analizi oranları yeniden düzenlenmelidir."
      },
      {
        title: "TYT hazırlığında son hafta nelere odaklanılmalı?",
        body:
          "Son hafta yeni ve ağır konu yüklemek yerine paragraf, problem, temel fen-sosyal tekrarları, deneme analizi ve uyku düzeni öncelik olmalıdır. Amaç sınav sabahına yorgun değil, kontrollü girmektir."
      },
      {
        title: "TYT için hangi resmi kaynaklar takip edilmeli?",
        body:
          "Tarih, başvuru ve sınav giriş belgesi için ÖSYM duyuruları ve AİS ekranı takip edilmelidir. Tercih dönemini şimdiden planlayan öğrenciler YÖK Atlas verilerini de düzenli inceleyebilir."
      }
    ]
  },
  {
    slug: "ayt-kac-gun-kaldi",
    eyebrow: "2026 AYT Sayacı",
    title: "AYT'ye kaç gün kaldı?",
    description:
      "2026 AYT oturumuna kalan süreyi resmi sınav saatine göre takip et; alan dersleri için kapanış planını ve tekrar önceliklerini netleştir.",
    updatedLabel: "Resmi ÖSYM açıklamalarına göre güncellenmiştir.",
    countdowns: [
      {
        label: "AYT",
        targetIso: "2026-06-21T10:15:00+03:00",
        dateLabel: "21 Haziran 2026 Pazar, 10:15",
        note: "2. oturum: Alan Yeterlilik Testleri"
      }
    ],
    videoTitle: "AYT tekrar planı ve kapanış temposu videosu",
    videoNote: "Alan dersleri, deneme sıklığı ve konu kapatma stratejisi için motivasyon ve planlama video alanı.",
    officialLinks: yksOfficialLinks,
    articleSections: [
      {
        title: "2026 AYT ne zaman yapılacak?",
        body:
          "2026 AYT, 21 Haziran 2026 Pazar günü saat 10.15'te uygulanacaktır. Eğitim Gürmesi Akademi AYT sayacı, geri sayımı doğrudan bu oturum başlangıcına göre hesaplar."
      },
      {
        title: "AYT sayacı TYT sayacından neden ayrı olmalı?",
        body:
          "AYT, bilgi derinliği ve alan dersleriyle ölçülür. TYT'de hız ve temel yeterlilik öne çıkarken AYT'de konu hakimiyeti belirleyicidir; bu yüzden tekrar planı ayrı sayaçla yönetilmelidir."
      },
      {
        title: "AYT'ye son haftalarda nasıl çalışılmalı?",
        body:
          "Son haftalarda alan denemesi, çıkmış soru, formül/kavram haritası ve yanlış defteri birlikte ilerlemelidir. Her deneme sonrasında sadece net değil, hangi kazanımın tekrar istediği de incelenmelidir."
      },
      {
        title: "AYT sonrası tercih araştırması ne zaman başlamalı?",
        body:
          "Tercih araştırması sınavdan sonraya bırakılmamalıdır. YÖK Atlas üzerinden bölüm kontenjanları, başarı sıraları ve üniversite seçenekleri erken dönemde incelenirse hedef daha somut hale gelir."
      }
    ]
  },
  {
    slug: "ydt-kac-gun-kaldi",
    eyebrow: "2026 YDT Sayacı",
    title: "YDT'ye kaç gün kaldı?",
    description:
      "2026 YDT için ayrı geri sayımı takip et; dil oturumu öncesi kelime, okuma ve dikkat ritmini doğru zamanda toparla.",
    updatedLabel: "Resmi ÖSYM açıklamalarına göre güncellenmiştir.",
    countdowns: [
      {
        label: "YDT",
        targetIso: "2026-06-21T15:45:00+03:00",
        dateLabel: "21 Haziran 2026 Pazar, 15:45",
        note: "3. oturum: Yabancı Dil Testi"
      }
    ],
    videoTitle: "YDT son oturum odak videosu",
    videoNote: "Kelime tekrarı, okuma temposu ve sınav günü enerji yönetimi için kısa video alanı.",
    officialLinks: yksOfficialLinks,
    articleSections: [
      {
        title: "2026 YDT ne zaman yapılacak?",
        body:
          "2026 YDT, 21 Haziran 2026 Pazar günü saat 15.45'te uygulanacaktır. YKS'nin son oturumu olduğu için gün içi enerji ve odak yönetimi ayrıca planlanmalıdır."
      },
      {
        title: "YDT için geri sayım neden ayrı takip edilmeli?",
        body:
          "YDT aynı gün içinde AYT'den sonra yapılır. Bu nedenle mola, beslenme, zihinsel toparlanma ve son tekrar akışı diğer oturumlardan farklıdır."
      },
      {
        title: "YDT hazırlığında son gün stratejisi nasıl olmalı?",
        body:
          "Son günlerde ağır gramer yükü yerine kelime tekrarları, okuma parçaları, çıkmış sorular ve süreli mini denemeler daha verimli olur. Amaç ritmi korumak ve sınav diline alışık kalmaktır."
      }
    ]
  },
  {
    slug: "2027-yks-kac-gun-kaldi",
    eyebrow: "2027 YKS Geri Sayım",
    title: "2027 YKS tarihi açıklandı mı?",
    description:
      "2027 YKS takvimi netleştiğinde sayaç güncellenecek. Tarih açıklanana kadar planlama rehberiyle hazırlığınızı sürdürebilirsiniz.",
    updatedLabel: "Resmi ÖSYM takvimi takip edilmektedir.",
    countdowns: [
      {
        label: "Resmi Tarih Bekleniyor",
        dateLabel: "ÖSYM 2027 takvimi ilan edildiğinde güncellenecek",
        note: "Tahmini tarih kullanılmaz; resmi açıklama esas alınır."
      }
    ],
    videoTitle: "2027 YKS uzun vadeli hazırlık videosu",
    videoNote: "Temel güçlendirme, kaynak seçimi ve düzenli çalışma sistemi için uzun vadeli motivasyon alanı.",
    officialLinks: yksOfficialLinks,
    articleSections: [
      {
        title: "2027 YKS için hazırlık ne zaman başlamalı?",
        body:
          "Resmi tarih açıklanmadan önce yapılacak en doğru hazırlık, temel dersleri güçlendirmek ve sürdürülebilir haftalık rutin kurmaktır. Erken başlayan öğrenci, son yıl yalnızca konu yetiştirmeye sıkışmaz."
      },
      {
        title: "Tarih açıklanmadan nasıl plan yapılır?",
        body:
          "Plan kesin sınav gününe değil, dönem hedeflerine göre kurulmalıdır. İlk faz temel kazanım, ikinci faz konu tamamlama, üçüncü faz deneme ve analiz düzeni olarak ilerleyebilir."
      }
    ]
  },
  {
    slug: "2026-lgs-kac-gun-kaldi",
    eyebrow: "2026 LGS Geri Sayım",
    title: "2026 LGS'ye kaç gün kaldı?",
    description:
      "2026 LGS için sözel ve sayısal oturumlara kalan süreyi takip et; sınav tarihi, oturum saatleri ve hazırlık notlarını tek sayfada gör.",
    updatedLabel: "Resmi MEB açıklamalarına göre güncellenmiştir.",
    countdowns: [
      {
        label: "Sözel Bölüm",
        targetIso: "2026-06-13T09:30:00+03:00",
        dateLabel: "13 Haziran 2026 Cumartesi, 09:30",
        note: "1. oturum: 50 soru / 75 dakika"
      },
      {
        label: "Sayısal Bölüm",
        targetIso: "2026-06-13T11:30:00+03:00",
        dateLabel: "13 Haziran 2026 Cumartesi, 11:30",
        note: "2. oturum: 40 soru / 80 dakika"
      }
    ],
    videoTitle: "LGS motivasyon ve sınav sabahı odak videosu",
    videoNote: "Sözel ve sayısal oturumlar arasında tempo, dikkat ve sakinlik yönetimi için video alanı.",
    officialLinks: [
      {
        title: "MEB",
        type: "Resmi Kaynak",
        summary: "LGS tarihleri, duyurular ve sınav süreci için Milli Eğitim Bakanlığı ana kaynağı.",
        href: "https://www.meb.gov.tr/",
        buttonLabel: "MEB'e Git"
      },
      {
        title: "e-Okul",
        type: "Aday İşlemleri",
        summary: "Öğrenci bilgileri, başvuru süreci ve sınav giriş işlemleri için kullanılan sistem.",
        href: "https://eokul.meb.gov.tr/",
        buttonLabel: "e-Okul'a Git"
      }
    ],
    articleSections: [
      {
        title: "2026 LGS ne zaman yapılacak?",
        body:
          "2026 LGS merkezi sınavı, MEB takvimine göre 13 Haziran 2026 Cumartesi günü iki oturum halinde uygulanacaktır. Eğitim Gürmesi Akademi LGS sayacı ilk oturum başlangıcına göre çalışır."
      },
      {
        title: "LGS kaç oturumdan oluşur?",
        body:
          "LGS'de sözel bölüm saat 09.30'da, sayısal bölüm saat 11.30'da başlar. Sözel bölüm Türkçe, inkılap tarihi, din kültürü ve yabancı dil; sayısal bölüm matematik ve fen bilimleri kazanımlarını ölçer."
      },
      {
        title: "LGS sayacı çalışma planında nasıl kullanılmalı?",
        body:
          "Kalan süre azaldıkça haftalık deneme, yanlış analizi ve kazanım tekrarı daha görünür hale gelmelidir. Sayaç, sadece zaman göstergesi değil; çalışma temposunu ayarlayan pratik bir kontrol alanıdır."
      },
      {
        title: "LGS'ye son ay kala nelere dikkat edilmeli?",
        body:
          "Son ayda MEB örnek soruları, çıkmış soru tarzı, süreli denemeler ve uyku rutini öncelik kazanır. Öğrenci hem sözel dikkatini hem de sayısal problem çözme dayanıklılığını birlikte korumalıdır."
      }
    ]
  }
] as const;

export function getExamCountdownPage(slug: string) {
  return examCountdownPages.find((page) => page.slug === slug) ?? null;
}
