import type { HomeShowcaseSlide } from "@ega/ui";
import type { AdminMarketingPage, AdminMarketingPageSection } from "../../../lib/auth-client";
import type { HomeSliderPayload, SliderSettings } from "./builder-types";

export const HOME_SLIDER_SECTION_KEY = "showcase-hero";

export type SectionBehavior = "editable" | "dynamic" | "locked";

export type SectionDefinition = {
  variantKey: string;
  label: string;
  description: string;
  behavior: SectionBehavior;
  removable: boolean;
  duplicable: boolean;
};

export const sectionDefinitions: SectionDefinition[] = [
  {
    variantKey: "showcase-hero",
    label: "Hero / Slider",
    description: "Ana sayfanın yayınlanan slider verisini kullanır.",
    behavior: "editable",
    removable: false,
    duplicable: false
  },
  {
    variantKey: "logo-rail",
    label: "Logo ve marka şeridi",
    description: "Ana sayfadaki hareketli marka şeridi.",
    behavior: "editable",
    removable: false,
    duplicable: true
  },
  {
    variantKey: "packages-surface",
    label: "Paket dizini çevresi",
    description: "Paket katalog verisi kilitlidir; başlık ve açıklama düzenlenebilir.",
    behavior: "dynamic",
    removable: false,
    duplicable: false
  },
  {
    variantKey: "directory-intro",
    label: "Paketler giriş alanı",
    description: "Paketler sayfasının başlık ve açıklama bölümü.",
    behavior: "editable",
    removable: false,
    duplicable: true
  },
  {
    variantKey: "guarantee-ribbon",
    label: "Güvence şeridi",
    description: "Paketler sayfasındaki statik güvence mesajı.",
    behavior: "editable",
    removable: false,
    duplicable: false
  },
  {
    variantKey: "about-intro",
    label: "Hakkımızda giriş",
    description: "Hakkımızda sayfasının ilk anlatım alanı.",
    behavior: "editable",
    removable: false,
    duplicable: true
  }
];

export const lockedRouteInventory = [
  { label: "Package detail", route: "/paketlerimiz/[slug]", reason: "Paket verisi Ticaret modülünden gelir." },
  { label: "Checkout", route: "/checkout/[slug]", reason: "Ödeme ve sipariş akışı sistem modülüdür." },
  { label: "Giriş", route: "/giris", reason: "Kimlik doğrulama sistemi kilitlidir." },
  { label: "Öğrenci hesabı", route: "/hesabim", reason: "Öğrenci paneli uygulama modülüdür." },
  { label: "Puan hesaplayıcı", route: "/ucretsiz-materyaller/puan-hesapla", reason: "Hesaplama motoru kilitlidir." },
  { label: "Geri sayım", route: "/ucretsiz-materyaller/*-kac-gun-kaldi", reason: "Canlı sayaç motoru kilitlidir." }
];

export const defaultSliderSettings: SliderSettings = {
  autoplay: true,
  intervalMs: 5200,
  transition: "fade",
  pauseOnHover: true,
  showArrows: true,
  showDots: true,
  keyboard: true,
  swipe: true,
  initialSlideId: "showcase-plan"
};

export const fallbackShowcaseSlides: HomeShowcaseSlide[] = [
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
];

export function getSectionDefinition(section: AdminMarketingPageSection) {
  const variantKey = section.variantKey ?? section.sectionKey;
  return (
    sectionDefinitions.find((definition) => definition.variantKey === variantKey) ?? {
      variantKey,
      label: readableSectionLabel(section),
      description: "Bu bölüm yapılandırılmış sayfa içeriği olarak düzenlenir.",
      behavior: "editable" as SectionBehavior,
      removable: true,
      duplicable: true
    }
  );
}

export function readableSectionLabel(section: AdminMarketingPageSection) {
  return section.title || section.variantKey || section.sectionKey || "Bölüm";
}

export function pageLabel(page: AdminMarketingPage) {
  const labels: Record<string, string> = {
    home: "Ana Sayfa",
    packages: "Paketlerimiz",
    about: "Hakkımızda",
    freeMaterials: "Ücretsiz Materyaller",
    academicStaff: "Akademik Kadro",
    successStories: "Başarı Hikayeleri",
    inPersonCoaching: "Yüz Yüze Koçluk"
  };

  return labels[page.key] ?? page.title;
}

export function normalizeHomeSliderPayload(section: AdminMarketingPageSection | null | undefined): HomeSliderPayload {
  const payload = isRecord(section?.payload) ? section.payload : {};
  const sourceSlides = Array.isArray(payload.slides) ? payload.slides : [];
  const slides = sourceSlides.length > 0 ? sourceSlides : fallbackShowcaseSlides;

  return {
    slides: slides
      .map((slide, index) => normalizeSlide(slide, fallbackShowcaseSlides[index] ?? fallbackShowcaseSlides[0]))
      .filter((slide): slide is HomeShowcaseSlide => Boolean(slide)),
    settings: normalizeSliderSettings(payload.settings)
  };
}

export function writeHomeSliderPayload(
  section: AdminMarketingPageSection,
  payload: HomeSliderPayload
): AdminMarketingPageSection {
  const currentPayload = isRecord(section.payload) ? section.payload : {};

  return {
    ...section,
    eyebrow: payload.slides[0]?.label ?? section.eyebrow ?? null,
    title: payload.slides[0]?.title ?? section.title ?? null,
    body: payload.slides[0]?.description ?? section.body ?? null,
    variantKey: HOME_SLIDER_SECTION_KEY,
    payload: {
      ...currentPayload,
      slides: payload.slides,
      settings: payload.settings
    }
  };
}

export function duplicatePageSection(section: AdminMarketingPageSection, sortOrder: number) {
  const keyBase = section.sectionKey.replace(/-copy-[a-z0-9]+$/i, "");
  return {
    ...section,
    id: undefined,
    sectionKey: `${keyBase}-copy-${Date.now().toString(36)}`,
    title: `${section.title ?? "Bölüm"} kopyası`,
    sortOrder,
    publishStatus: "DRAFT"
  };
}

export function resequenceSections(sections: AdminMarketingPageSection[]) {
  return sections.map((section, index) => ({
    ...section,
    sortOrder: (index + 1) * 10
  }));
}

function normalizeSlide(raw: unknown, fallback: HomeShowcaseSlide): HomeShowcaseSlide | null {
  if (!isRecord(raw)) {
    return fallback;
  }

  return {
    id: asNonEmptyString(raw.id, fallback.id),
    label: asNonEmptyString(raw.label, fallback.label),
    title: asNonEmptyString(raw.title, fallback.title),
    description: asNonEmptyString(raw.description, fallback.description),
    tone: raw.tone === "amber" || raw.tone === "teal" || raw.tone === "blue" ? raw.tone : fallback.tone,
    mediaType: raw.mediaType === "VIDEO" ? "VIDEO" : "IMAGE",
    mediaUrl: asString(raw.mediaUrl, fallback.mediaUrl),
    mobileMediaUrl: asString(raw.mobileMediaUrl, fallback.mobileMediaUrl ?? ""),
    mediaPosterUrl: asString(raw.mediaPosterUrl, fallback.mediaPosterUrl ?? ""),
    mediaAlt: asNonEmptyString(raw.mediaAlt, fallback.mediaAlt),
    primaryCtaLabel: asString(raw.primaryCtaLabel, fallback.primaryCtaLabel ?? ""),
    primaryCtaHref: asString(raw.primaryCtaHref, fallback.primaryCtaHref ?? ""),
    secondaryCtaLabel: asString(raw.secondaryCtaLabel, fallback.secondaryCtaLabel ?? ""),
    secondaryCtaHref: asString(raw.secondaryCtaHref, fallback.secondaryCtaHref ?? ""),
    isActive: typeof raw.isActive === "boolean" ? raw.isActive : fallback.isActive ?? true
  };
}

function normalizeSliderSettings(raw: unknown): SliderSettings {
  if (!isRecord(raw)) {
    return defaultSliderSettings;
  }

  const intervalMs = typeof raw.intervalMs === "number" ? raw.intervalMs : defaultSliderSettings.intervalMs;

  return {
    autoplay: typeof raw.autoplay === "boolean" ? raw.autoplay : defaultSliderSettings.autoplay,
    intervalMs: Math.min(Math.max(intervalMs, 2500), 15000),
    transition: raw.transition === "slide" ? "slide" : "fade",
    pauseOnHover:
      typeof raw.pauseOnHover === "boolean" ? raw.pauseOnHover : defaultSliderSettings.pauseOnHover,
    showArrows: typeof raw.showArrows === "boolean" ? raw.showArrows : defaultSliderSettings.showArrows,
    showDots: typeof raw.showDots === "boolean" ? raw.showDots : defaultSliderSettings.showDots,
    keyboard: typeof raw.keyboard === "boolean" ? raw.keyboard : defaultSliderSettings.keyboard,
    swipe: typeof raw.swipe === "boolean" ? raw.swipe : defaultSliderSettings.swipe,
    initialSlideId: asNonEmptyString(raw.initialSlideId, defaultSliderSettings.initialSlideId)
  };
}

function asNonEmptyString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asString(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
