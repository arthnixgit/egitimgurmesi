"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ButtonLink, SectionHeading } from "@ega/ui";
import { PackageCard as CatalogPackageCard } from "../components/package-card";
import { FooterContactLinks } from "../components/footer-contact-links";
import { PublicNavbar } from "../components/public-navbar";
import { ShowcaseQuickActions } from "../components/showcase-quick-actions";
import { CONTACT_TEL_HREF, CONTACT_WHATSAPP_HREF } from "../lib/contact";
import { isEmbeddableVideoUrl, normalizeVideoEmbedUrl } from "../lib/media-url";
import { getPackageCatalogContent } from "../lib/public-commerce-api";
import {
  packageCategories,
  packageProducts,
  type PackageCategory,
  type PackageProduct
} from "../lib/package-catalog";
import { getMarketingPageContent, type MarketingPageContent } from "../lib/public-content-api";

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
  tone: "amber" | "teal" | "blue";
  mediaType: "IMAGE" | "VIDEO";
  mediaUrl: string;
  mediaPosterUrl: string;
  mediaAlt: string;
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
    title: "Koçluk ürünleri net anlatılsın, başvuru güvenle tamamlansın.",
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
  { id: "logo-1", src: "/rail-logos/logo1.webp", alt: "Yayın partneri logosu 1" },
  { id: "logo-2", src: "/rail-logos/logo2.svg", alt: "Yayın partneri logosu 2" },
  { id: "logo-3", src: "/rail-logos/logo3.svg", alt: "Yayın partneri logosu 3" },
  { id: "logo-4", src: "/rail-logos/logo4.webp", alt: "Yayın partneri logosu 4" },
  { id: "logo-5", src: "/rail-logos/logo5.svg", alt: "Yayın partneri logosu 5" },
  { id: "logo-6", src: "/rail-logos/logo6.svg", alt: "Yayın partneri logosu 6" },
  { id: "logo-7", src: "/rail-logos/logo7.svg", alt: "Yayın partneri logosu 7" },
  { id: "logo-8", src: "/rail-logos/logo8.svg", alt: "Yayın partneri logosu 8" },
  { id: "logo-9", src: "/rail-logos/logo9.webp", alt: "Yayın partneri logosu 9" },
  { id: "logo-10", src: "/rail-logos/logo10.svg", alt: "Yayın partneri logosu 10" },
  { id: "logo-11", src: "/rail-logos/logo11.svg", alt: "Yayın partneri logosu 11" }
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
    tone: "amber",
  },
  {
    title: "AYT Matematik Limitte Sık Yapılan Hatalar",
    category: "AYT Matematik",
    duration: "24 dk",
    teacher: "Kayıtlı Ders",
    summary: "Limit sorularında sık kaçan adımları toparlayan, çözüm düzenini güçlendiren yoğun bir tekrar dersi.",
    tone: "blue"
  },
  {
    title: "Biyoloji Tekrar Dersi: Hücre ve Bölünme",
    category: "AYT Biyoloji",
    duration: "16 dk",
    teacher: "Video Kütüphanesi",
    summary: "Tekrar döneminde öğrencinin kaybolmadan izleyeceği daha kısa ve yoğun içerik örneği.",
    tone: "teal",
  },
  {
    title: "Koçluk Görüşmesine Hazırlık Mini Videosu",
    category: "Koçluk Süreci",
    duration: "11 dk",
    teacher: "Hazırlık İçeriği",
    summary: "Haftalık görüşmeden önce deneme sonuçlarını, eksiklerini ve hedeflerini nasıl toparlayacağını anlatan kısa hazırlık videosu.",
    tone: "amber"
  }
] as const;

const featureHighlights = [
  {
    id: "product-story",
    label: "Kişiye göre ürün anlatımı",
    title: "Her öğrenci kendi ihtiyacına göre doğru paketi görsün.",
    body:
      "Paket içerikleri sade biçimde ayrıştırılır; öğrenci ya da veli, hangi ürünün neye hizmet ettiğini tek bakışta anlayabilir.",
    mediaLabel: "Tanıtım Videosu",
    mediaTitle: "Paket İçeriği Anlatımı",
    mediaBody: "Ürün tanıtım videosu veya görsel anlatım eklenebilir.",
    tone: "amber"
  },
  {
    id: "live-lesson",
    label: "Canlı ve kayıtlı ders omurgası",
    title: "Canlı dersler ve kayıtlı içerikler aynı düzen içinde sunulsun.",
    body:
      "Öğrenci canlı ders akışını kaçırmadan takip ederken, tekrar videolarına ve destek içeriklerine aynı panelden ulaşabilir.",
    mediaLabel: "Ders Videosu",
    mediaTitle: "Canlı Ders Akışı",
    mediaBody: "Canlı ders ekranı veya kısa ders tanıtım videosu oynatılabilir.",
    tone: "blue"
  },
  {
    id: "student-account",
    label: "Yerel öğrenci hesabı ve sipariş kaydı",
    title: "Öğrenci hesabı ve sipariş geçmişi düzenli biçimde izlenebilsin.",
    body:
      "Hangi paketin satın alındığı, hangi derslerin açıldığı ve hangi içeriklerin aktif olduğu tek hesap altında net biçimde tutulur.",
    mediaLabel: "Panel Önizlemesi",
    mediaTitle: "Öğrenci Paneli",
    mediaBody: "Öğrenci panelini anlatan kısa video veya görsel kullanılabilir.",
    tone: "teal"
  },
  {
    id: "coaching-flow",
    label: "Koçlukta kontrollü dış ödeme akışı",
    title: "Koçluk yönlendirmesi güvenli ve net bir akışla ilerlesin.",
    body:
      "Koçluk başvurusu düzenli alınır; ödeme adımı kontrollü yönlendirme ile ilerler.",
    mediaLabel: "Akış Videosu",
    mediaTitle: "Koçluk Başvuru Akışı",
    mediaBody: "Koçluk ödeme ve yönlendirme akışı görsel veya video ile anlatılabilir.",
    tone: "amber"
  },
  {
    id: "whatsapp-contact",
    label: "WhatsApp ile hızlı temas",
    title: "Kararsız ziyaretçi sorusunu hızlıca iletebilsin.",
    body:
      "Öğrenci ve veli çoğu zaman önce danışmak ister. Bu nedenle iletişim alanı görünür, hızlı ve yönlendirici biçimde kurgulanır.",
    mediaLabel: "İletişim Alanı",
    mediaTitle: "WhatsApp Teması",
    mediaBody: "WhatsApp iletişim akışı görsel veya video ile tanıtılabilir.",
    tone: "teal"
  },
  {
    id: "admin-panel",
    label: "Kolay öğrenilen yönetim paneli",
    title: "Ekip içerikleri ve ürünleri hızlıca yönetebilsin.",
    body:
      "Paket, kadro, ücretsiz materyal ve yönlendirme alanları teknik destek gerektirmeden güncellenebilir yapıdadır.",
    mediaLabel: "Yönetim Paneli",
    mediaTitle: "Admin Kullanımı",
    mediaBody: "Yönetim paneli tanıtım videosu veya ekran kaydı kullanılabilir.",
    tone: "blue"
  }
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
      "Evet. Ödeme tamamlandığında video paketleri öğrenci hesabına tanımlanır."
  },
  {
    question: "Koçluk paketinde neden farklı bir ödeme akışı var?",
    answer:
      "Koçluk ürünlerinde sipariş kaydı yerel olarak tutulur; ödeme adımı güvenli yönlendirme ile tamamlanır."
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
    label: "Başarıya Hazırlık",
    title: "Başarı planı ilk günden hazır",
    description:
      "Kayıttan sonra öğrenci; hedefe uygun paket, haftalık çalışma ritmi ve takip ekranı ile ne yapacağını net biçimde görür.",
    tone: "amber",
    mediaType: "IMAGE",
    mediaUrl: "/homepage/showcase-plan.png",
    mediaPosterUrl: "",
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
    mediaPosterUrl: "",
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
    mediaPosterUrl: "",
    mediaAlt: "Online ders izleyen başarılı öğrenci"
  }
] as const;

function isShowcaseTone(value: unknown): value is ShowcaseSlide["tone"] {
  return value === "amber" || value === "teal" || value === "blue";
}

function isShowcaseMediaType(value: unknown): value is ShowcaseSlide["mediaType"] {
  return value === "IMAGE" || value === "VIDEO";
}

function looksLikeEmbedUrl(value: string) {
  return isEmbeddableVideoUrl(value);
}

function hasShowcaseMedia(url: string) {
  return url.trim().length > 0;
}

function normalizeShowcaseSlides(
  payload: Record<string, unknown> | undefined,
  fallbackSlides: readonly ShowcaseSlide[],
  sectionOverride?: {
    eyebrow?: string;
    title?: string;
    body?: string;
  }
): ShowcaseSlide[] {
  const payloadSlides = Array.isArray(payload?.slides) ? payload.slides : [];

  if (payloadSlides.length === 0) {
    return fallbackSlides.map((slide, index) =>
      index === 0 && sectionOverride
        ? {
            ...slide,
            label: sectionOverride.eyebrow ?? slide.label,
            title: sectionOverride.title ?? slide.title,
            description: sectionOverride.body ?? slide.description
          }
        : slide
    );
  }

  return payloadSlides
    .map((rawSlide, index) => {
      if (!rawSlide || typeof rawSlide !== "object") {
        return null;
      }

      const source = rawSlide as Record<string, unknown>;
      const fallback = fallbackSlides[index] ?? fallbackSlides[0];
      const mediaUrl =
        typeof source.mediaUrl === "string" && source.mediaUrl.trim().length > 0
          ? source.mediaUrl.trim()
          : fallback.mediaUrl;

      return {
        id: typeof source.id === "string" && source.id.trim().length > 0 ? source.id : fallback.id,
        label:
          typeof source.label === "string" && source.label.trim().length > 0
            ? source.label
            : fallback.label,
        title:
          typeof source.title === "string" && source.title.trim().length > 0
            ? source.title
            : fallback.title,
        description:
          typeof source.description === "string" && source.description.trim().length > 0
            ? source.description
            : fallback.description,
        tone: isShowcaseTone(source.tone) ? source.tone : fallback.tone,
        mediaType: isShowcaseMediaType(source.mediaType) ? source.mediaType : fallback.mediaType,
        mediaUrl,
        mediaPosterUrl:
          typeof source.mediaPosterUrl === "string" && source.mediaPosterUrl.trim().length > 0
            ? source.mediaPosterUrl.trim()
            : fallback.mediaPosterUrl,
        mediaAlt:
          typeof source.mediaAlt === "string" && source.mediaAlt.trim().length > 0
            ? source.mediaAlt
            : fallback.mediaAlt
      } satisfies ShowcaseSlide;
    })
    .filter((slide): slide is ShowcaseSlide => slide !== null);
}

function getActiveCategory(
  categories: readonly PackageCategory[],
  categoryId: string | null
) {
  return categories.find((category) => category.id === categoryId) ?? null;
}

function getActiveSubcategory(
  categories: readonly PackageCategory[],
  categoryId: string | null,
  subcategoryId: string | null
) {
  const activeCategory = getActiveCategory(categories, categoryId);

  if (!activeCategory || !subcategoryId) {
    return null;
  }

  return activeCategory.subcategories.find((subcategory) => subcategory.id === subcategoryId) ?? null;
}

function getVisibleProducts(
  products: readonly PackageProduct[],
  categoryId: string | null,
  subcategoryId: string | null
) {
  return products.filter((product) => {
    if (categoryId && product.categoryId !== categoryId) {
      return false;
    }

    if (subcategoryId && product.subcategoryId !== subcategoryId) {
      return false;
    }

    return true;
  });
}

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
        <button className="ega-video-card__play" type="button" aria-label={`${title} ön izleme kartı`}>
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M8 6.5v11l9-5.5-9-5.5Z" fill="currentColor" />
          </svg>
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
  const [homePageContent, setHomePageContent] = useState<MarketingPageContent | null>(null);
  const [catalogCategories, setCatalogCategories] =
    useState<readonly PackageCategory[]>(packageCategories);
  const [catalogProducts, setCatalogProducts] =
    useState<readonly PackageProduct[]>(packageProducts);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>("online-coaching");
  const [activeSubcategoryId, setActiveSubcategoryId] = useState<string | null>(null);
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const [activeShowcaseSlide, setActiveShowcaseSlide] = useState(0);
  const [activeFeatureId, setActiveFeatureId] = useState<(typeof featureHighlights)[number]["id"]>(
    featureHighlights[0].id
  );

  useEffect(() => {
    const heroInterval = window.setInterval(() => {
      setActiveHeroSlide((current) => (current + 1) % heroSlides.length);
    }, 4800);

    const showcaseInterval = window.setInterval(() => {
      setActiveShowcaseSlide((current) => (current + 1) % showcaseSlides.length);
    }, 5200);

    return () => {
      window.clearInterval(heroInterval);
      window.clearInterval(showcaseInterval);
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    void getMarketingPageContent("home").then((page) => {
      if (!isCancelled) {
        setHomePageContent(page);
      }
    });

    void getPackageCatalogContent().then((catalog) => {
      if (!isCancelled) {
        setCatalogCategories(catalog.categories);
        setCatalogProducts(catalog.products);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  const showcaseSection = homePageContent?.sections.find((section) => section.sectionKey === "showcase-hero");
  const logoRailSection = homePageContent?.sections.find((section) => section.sectionKey === "logo-rail");
  const packageSurfaceSection = homePageContent?.sections.find((section) => section.sectionKey === "package-surface");

  const showcaseSlidesWithContent = normalizeShowcaseSlides(showcaseSection?.payload, showcaseSlides, {
    eyebrow: showcaseSection?.eyebrow ?? undefined,
    title: showcaseSection?.title,
    body: showcaseSection?.body ?? undefined
  });

  const liveLogoRailItems = logoRailItems;

  const currentSlide = heroSlides[activeHeroSlide];
  const currentShowcase = showcaseSlidesWithContent[activeShowcaseSlide] ?? showcaseSlidesWithContent[0];
  const activeFeature =
    featureHighlights.find((item) => item.id === activeFeatureId) ?? featureHighlights[0];
  const activeCategory = getActiveCategory(catalogCategories, activeCategoryId);
  const activeSubcategory = getActiveSubcategory(
    catalogCategories,
    activeCategoryId,
    activeSubcategoryId
  );
  const visibleProducts = getVisibleProducts(catalogProducts, activeCategoryId, activeSubcategoryId);

  return (
    <main className="ega-page">
      <PublicNavbar />

      <section className="ega-showcase-hero" id="anasayfa" aria-label="Öne çıkan görsel anlatım alanı">
        <div className="ega-showcase-hero__inner">
          <div className="ega-showcase-hero__main" data-tone={currentShowcase.tone} data-slide={currentShowcase.id}>
            <div className="ega-showcase-hero__copybox">
              <div className="ega-showcase-hero__badge">{currentShowcase.label}</div>
              <div className="ega-showcase-hero__copy">
                <h2>{currentShowcase.title}</h2>
                <p>{currentShowcase.description}</p>
              </div>

              <div className="ega-showcase-hero__indicator-wrap" aria-label="Slayt göstergesi">
                <span className="ega-showcase-hero__indicator-count">
                  {String(activeShowcaseSlide + 1).padStart(2, "0")} / {String(showcaseSlidesWithContent.length).padStart(2, "0")}
                </span>

                <div className="ega-showcase-hero__indicators">
                  {showcaseSlidesWithContent.map((slide, index) => (
                    <button
                      key={slide.id}
                      type="button"
                      className="ega-showcase-hero__indicator"
                      data-active={index === activeShowcaseSlide}
                      aria-label={`${index + 1}. slayta geç`}
                      onClick={() => setActiveShowcaseSlide(index)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="ega-showcase-hero__media">
              <div className="ega-showcase-hero__media-shell">
                {!hasShowcaseMedia(currentShowcase.mediaUrl) ? (
                  <div className="ega-showcase-hero__placeholder">
                    <strong>{currentShowcase.label}</strong>
                    <span>{currentShowcase.description}</span>
                  </div>
                ) : currentShowcase.mediaType === "VIDEO" ? (
                  looksLikeEmbedUrl(currentShowcase.mediaUrl) ? (
                    <iframe
                      className="ega-showcase-hero__video-frame"
                      src={normalizeVideoEmbedUrl(currentShowcase.mediaUrl)}
                      title={currentShowcase.mediaAlt}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      className="ega-showcase-hero__video-frame"
                      controls
                      playsInline
                      poster={currentShowcase.mediaPosterUrl}
                    >
                      <source src={currentShowcase.mediaUrl} />
                    </video>
                  )
                ) : (
                  <div className="ega-showcase-hero__image-frame">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentShowcase.mediaUrl}
                      alt={currentShowcase.mediaAlt}
                      className="ega-showcase-hero__image"
                    />
                  </div>
                )}
              </div>
            </div>

          </div>

          <div className="ega-showcase-hero__footer">
            <div className="ega-showcase-hero__footer-line" />
            <div className="ega-showcase-hero__footer-line ega-showcase-hero__footer-line--soft" />
          </div>
        </div>
      </section>

      <section className="ega-showcase-actions-section" aria-label="Hızlı etkileşim alanı">
        <div className="ega-container ega-showcase-actions-section__inner">
          <ShowcaseQuickActions sourcePage="home-showcase-free-call" align="center" />
        </div>
      </section>

      <section className="ega-logo-rail-section">
        <div className="ega-logo-rail">
          <div className="ega-logo-rail__track">
            {[...liveLogoRailItems, ...liveLogoRailItems].map((item, index) => (
              <div key={`${item.id}-${index}`} className="ega-logo-chip">
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={220}
                  height={88}
                  className="ega-logo-chip__image"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ega-section ega-container" id="paketler">
        <SectionHeading
          title={packageSurfaceSection?.title ?? "Sana En Uygun Paketi Seç"}
          description={packageSurfaceSection?.body ?? undefined}
        />

        <div className="ega-filter-shell ega-filter-shell--directory">
          <div className="ega-filter-shell__mode ega-filter-shell__mode--directory">
            {catalogCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                className="ega-filter-mode"
                data-active={activeCategory?.id === category.id}
                onClick={() => {
                  setActiveCategoryId(category.id);
                  setActiveSubcategoryId(null);
                }}
              >
                {category.label}
              </button>
            ))}
          </div>

          {activeCategory ? (
            <div className="ega-filter-shell__subcategories">
              {activeCategory.subcategories.map((subcategory) => (
                <button
                  key={subcategory.id}
                  type="button"
                  className="ega-filter-option ega-filter-option--compact"
                  data-active={activeSubcategory?.id === subcategory.id}
                  onClick={() => setActiveSubcategoryId(subcategory.id)}
                >
                  <strong>{subcategory.label}</strong>
                  <span>{subcategory.description}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="ega-pack-grid">
          {visibleProducts.map((product) => (
            <CatalogPackageCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="ega-section ega-container" id="videolar">
        <SectionHeading
          title="Öğrencilerimize Canlı Ders Yapan Hocalar"
        />

        <div className="ega-video-grid">
          {sampleVideos.map((video) => (
            <VideoCard key={video.title} {...video} />
          ))}
        </div>
      </section>

      <section className="ega-section ega-container" id="neler-var">
        <SectionHeading
          title="Eğitim Gurmesi'nde Seni Neler Bekliyor?"
        />

        <div className="ega-feature-layout">
          <div className="ega-feature-band" aria-label="Bekleyen deneyim başlıkları">
            {featureHighlights.map((item) => (
              <button
                key={item.id}
                type="button"
                className="ega-feature-band__item"
                data-active={activeFeature.id === item.id}
                onMouseEnter={() => setActiveFeatureId(item.id)}
                onFocus={() => setActiveFeatureId(item.id)}
                onClick={() => setActiveFeatureId(item.id)}
              >
                <span className="ega-feature-band__dot" />
                <strong>{item.label}</strong>
              </button>
            ))}
          </div>

          <article className="ega-experience-stage" data-tone={activeFeature.tone}>
            <div className="ega-experience-stage__media">
              <div className="ega-experience-stage__media-shell">
                <div className="ega-experience-stage__placeholder">
                  <span className="ega-experience-stage__badge">{activeFeature.mediaLabel}</span>
                  <strong>{activeFeature.mediaTitle}</strong>
                  <span>{activeFeature.mediaBody}</span>
                </div>
              </div>
            </div>

            <div className="ega-experience-stage__copy">
              <h3>{activeFeature.title}</h3>
              <p>{activeFeature.body}</p>
            </div>
          </article>
        </div>
      </section>

      <section className="ega-section ega-container ega-cta-section" id="iletisim">
        <div className="ega-cta-panel">
          <div className="ega-cta-panel__copy">
            <span className="ega-pill ega-pill--warm">İletişime Geçin</span>
            <h2>Karar vermeden önce soru sormak isteyen öğrenci ve veliler için doğrudan iletişim alanı.</h2>
            <p>
              Paket seçimi, koçluk süreci veya kayıt adımları için hızlıca destek alınabilir.
            </p>
          </div>

          <div className="ega-cta-panel__actions">
            <ButtonLink
              href={CONTACT_WHATSAPP_HREF}
              label="WhatsApp ile Yazın"
              target="_blank"
              rel="noreferrer"
            />
            <ButtonLink href={CONTACT_TEL_HREF} label="Bizi Arayın" variant="ghost" />
            <ButtonLink href="/kayit" label="Hesap Oluştur" variant="ghost" />
          </div>
        </div>
      </section>

      <footer className="ega-footer">
        <div className="ega-footer__inner">
          <div className="ega-footer__brand">
            <Image
              src="/branding/ega-logo-official.png"
              alt="Eğitim Gurmesi Akademi"
              width={124}
              height={124}
              className="ega-footer__logo"
            />
            <p>
              Eğitim Gurmesi Akademi; video paketleri, koçluk desteği ve öğrenci takibini aynı çatı altında düzenli biçimde sunan bir hazırlık platformudur.
            </p>
          </div>

          <div className="ega-footer__links">
            <a href="/paketlerimiz">Paketler</a>
            <a href="/ucretsiz-materyaller">Ücretsiz Materyaller</a>
            <a href="/hakkimizda">Hakkımızda</a>
            <a href="/giris">Öğrenci Girişi</a>
            <FooterContactLinks />
          </div>
        </div>
      </footer>

      <a
        className="ega-contact-bookmark"
        href={CONTACT_WHATSAPP_HREF}
        aria-label="WhatsApp ile iletişime geçin"
        title="WhatsApp ile iletişime geçin"
        target="_blank"
        rel="noreferrer"
      >
        <span>WhatsApp ile Yazın</span>
      </a>
    </main>
  );
}
