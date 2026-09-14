import type { MarketingPageSection } from "./public-content-api";

/**
 * Homepage section contract.
 *
 * The homepage used to hold its copy in module constants, so the admin panel
 * could not change a word of what visitors actually read. These readers bind
 * each designed section to a CMS section payload instead, while keeping the
 * original copy as the fallback: an empty or malformed payload renders exactly
 * what the site showed before rather than an empty page.
 *
 * Section keys are the contract between apps/web and the admin section
 * registry. Changing one here means changing it there.
 */
export const HOME_SECTION_KEYS = {
  logoRail: "logo-rail",
  videoShowcase: "video-showcase",
  featureHighlights: "feature-highlights",
  contactCta: "contact-cta"
} as const;

export type SectionTone = "amber" | "teal" | "blue";

export type HomeLogoRailItem = {
  id: string;
  src: string;
  alt: string;
};

export type HomeVideoCard = {
  id: string;
  title: string;
  category: string;
  duration: string;
  teacher: string;
  summary: string;
  tone: SectionTone;
};

export type HomeFeatureHighlight = {
  id: string;
  label: string;
  title: string;
  body: string;
  mediaLabel: string;
  mediaTitle: string;
  mediaBody: string;
  tone: SectionTone;
};

export type HomeCtaAction = {
  id: string;
  label: string;
  href: string;
  variant: "primary" | "ghost";
  openInNewTab: boolean;
};

export type HomeContactCta = {
  eyebrow: string;
  title: string;
  body: string;
  actions: HomeCtaAction[];
};

export const defaultLogoRailItems: readonly HomeLogoRailItem[] = [
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

export const DEFAULT_VIDEO_SHOWCASE_TITLE = "Öğrencilerimize Canlı Ders Yapan Hocalar";

export const defaultVideoCards: readonly HomeVideoCard[] = [
  {
    id: "tyt-turkce-paragraf",
    title: "TYT Türkçe Paragraf Hızlandırma",
    category: "TYT Türkçe",
    duration: "18 dk",
    teacher: "Eğitim Gurmesi Ekibi",
    summary: "Soru okuma ritmini ve paragraf akışını güçlendiren hızlı bir ön izleme dersi.",
    tone: "amber"
  },
  {
    id: "ayt-matematik-limit",
    title: "AYT Matematik Limitte Sık Yapılan Hatalar",
    category: "AYT Matematik",
    duration: "24 dk",
    teacher: "Kayıtlı Ders",
    summary:
      "Limit sorularında sık kaçan adımları toparlayan, çözüm düzenini güçlendiren yoğun bir tekrar dersi.",
    tone: "blue"
  },
  {
    id: "biyoloji-hucre-tekrar",
    title: "Biyoloji Tekrar Dersi: Hücre ve Bölünme",
    category: "AYT Biyoloji",
    duration: "16 dk",
    teacher: "Video Kütüphanesi",
    summary: "Tekrar döneminde öğrencinin kaybolmadan izleyeceği daha kısa ve yoğun içerik örneği.",
    tone: "teal"
  },
  {
    id: "kocluk-hazirlik",
    title: "Koçluk Görüşmesine Hazırlık Mini Videosu",
    category: "Koçluk Süreci",
    duration: "11 dk",
    teacher: "Hazırlık İçeriği",
    summary:
      "Haftalık görüşmeden önce deneme sonuçlarını, eksiklerini ve hedeflerini nasıl toparlayacağını anlatan kısa hazırlık videosu.",
    tone: "amber"
  }
] as const;

export const DEFAULT_FEATURE_HIGHLIGHTS_TITLE = "Eğitim Gurmesi'nde Seni Neler Bekliyor?";

export const defaultFeatureHighlights: readonly HomeFeatureHighlight[] = [
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
    body: "Koçluk başvurusu düzenli alınır; ödeme adımı kontrollü yönlendirme ile ilerler.",
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

/**
 * CTA hrefs default to tokens the page resolves against live site settings, so
 * the phone and WhatsApp links stay correct when those settings change.
 */
export const WHATSAPP_HREF_TOKEN = "{{whatsapp}}";
export const PHONE_HREF_TOKEN = "{{phone}}";

export const defaultContactCta: HomeContactCta = {
  eyebrow: "İletişime Geçin",
  title:
    "Karar vermeden önce soru sormak isteyen öğrenci ve veliler için doğrudan iletişim alanı.",
  body: "Paket seçimi, koçluk süreci veya kayıt adımları için hızlıca destek alınabilir.",
  actions: [
    { id: "whatsapp", label: "WhatsApp ile Yazın", href: WHATSAPP_HREF_TOKEN, variant: "primary", openInNewTab: true },
    { id: "phone", label: "Bizi Arayın", href: PHONE_HREF_TOKEN, variant: "ghost", openInNewTab: false },
    { id: "register", label: "Hesap Oluştur", href: "/kayit", variant: "ghost", openInNewTab: false }
  ]
};

export function findHomeSection(
  sections: readonly MarketingPageSection[] | undefined,
  key: string
): MarketingPageSection | null {
  if (!sections) {
    return null;
  }

  return (
    sections.find(
      (section) =>
        section.isActive !== false && (section.sectionKey === key || section.variantKey === key)
    ) ?? null
  );
}

export function readLogoRail(section: MarketingPageSection | null) {
  const items = readList(section, (entry, index) => {
    const src = text(entry.src);

    if (!src) {
      return null;
    }

    return {
      id: text(entry.id) || `logo-${index + 1}`,
      src,
      alt: text(entry.alt) || `Logo ${index + 1}`
    } satisfies HomeLogoRailItem;
  });

  return { items: items.length > 0 ? items : [...defaultLogoRailItems] };
}

export function readVideoShowcase(section: MarketingPageSection | null) {
  const items = readList(section, (entry, index) => {
    const title = text(entry.title);

    if (!title) {
      return null;
    }

    return {
      id: text(entry.id) || `video-${index + 1}`,
      title,
      category: text(entry.category),
      duration: text(entry.duration),
      teacher: text(entry.teacher),
      summary: text(entry.summary),
      tone: tone(entry.tone)
    } satisfies HomeVideoCard;
  });

  return {
    title: text(section?.title) || DEFAULT_VIDEO_SHOWCASE_TITLE,
    description: text(section?.body) || undefined,
    items: items.length > 0 ? items : [...defaultVideoCards]
  };
}

export function readFeatureHighlights(section: MarketingPageSection | null) {
  const items = readList(section, (entry, index) => {
    const label = text(entry.label);

    if (!label) {
      return null;
    }

    return {
      id: text(entry.id) || `feature-${index + 1}`,
      label,
      title: text(entry.title),
      body: text(entry.body),
      mediaLabel: text(entry.mediaLabel),
      mediaTitle: text(entry.mediaTitle),
      mediaBody: text(entry.mediaBody),
      tone: tone(entry.tone)
    } satisfies HomeFeatureHighlight;
  });

  return {
    title: text(section?.title) || DEFAULT_FEATURE_HIGHLIGHTS_TITLE,
    description: text(section?.body) || undefined,
    items: items.length > 0 ? items : [...defaultFeatureHighlights]
  };
}

export function readContactCta(section: MarketingPageSection | null): HomeContactCta {
  const actions = readList(section, (entry, index) => {
    const label = text(entry.label);
    const href = text(entry.href);

    if (!label || !href) {
      return null;
    }

    return {
      id: text(entry.id) || `cta-${index + 1}`,
      label,
      href,
      variant: entry.variant === "primary" ? "primary" : "ghost",
      openInNewTab: entry.openInNewTab === true
    } satisfies HomeCtaAction;
  }, "actions");

  return {
    eyebrow: text(section?.eyebrow) || defaultContactCta.eyebrow,
    title: text(section?.title) || defaultContactCta.title,
    body: text(section?.body) || defaultContactCta.body,
    actions: actions.length > 0 ? actions : defaultContactCta.actions
  };
}

/**
 * Resolves the site-settings tokens used by default CTA links, so a customer
 * who never edits the CTA still gets the current phone and WhatsApp numbers.
 */
export function resolveCtaHref(
  href: string,
  settings: { whatsappHref?: string | null; telHref?: string | null }
) {
  if (href === WHATSAPP_HREF_TOKEN) {
    return settings.whatsappHref || "#";
  }

  if (href === PHONE_HREF_TOKEN) {
    return settings.telHref || "#";
  }

  return href;
}

function readList<T>(
  section: MarketingPageSection | null,
  map: (entry: Record<string, unknown>, index: number) => T | null,
  key = "items"
): T[] {
  const payload = isRecord(section?.payload) ? section.payload : {};
  const raw = payload[key];

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((entry, index) => (isRecord(entry) ? map(entry, index) : null))
    .filter((entry): entry is T => entry !== null);
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function tone(value: unknown): SectionTone {
  return value === "amber" || value === "teal" || value === "blue" ? value : "amber";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
