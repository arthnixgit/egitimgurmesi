import type { AdminMarketingPage, AdminMarketingPageSection } from "../../../lib/auth-client";
import type { WebsiteArea } from "./builder-types";

export type WidgetCategory =
  | "Temel"
  | "Düzen"
  | "Vitrin"
  | "İçerik"
  | "Global"
  | "Sistem/Dinamik";

export type InspectorField =
  | "eyebrow"
  | "title"
  | "body"
  | "media"
  | "button"
  | "items"
  | "tone"
  | "visibility"
  | "anchor";

export type WidgetDefinition = {
  key: string;
  type: string;
  label: string;
  icon: string;
  category: WidgetCategory;
  description: string;
  allowedAreas: WebsiteArea[];
  allowedPageTypes?: string[];
  defaultContent: Pick<AdminMarketingPageSection, "eyebrow" | "title" | "body" | "variantKey" | "payload">;
  defaultStyle: Record<string, unknown>;
  inspectorFields: InspectorField[];
  removable: boolean;
  duplicable: boolean;
  dynamic: boolean;
  locked: boolean;
  supportsResponsive: boolean;
};

export const widgetRegistry: WidgetDefinition[] = [
  widget("heading", "Başlık", "T", "Temel", "Sayfaya yeni bir başlık alanı ekler.", "heading", {
    title: "Yeni başlık",
    body: "Bu alanı doğrudan canvas üzerinde veya sağ panelden düzenleyin."
  }),
  widget("rich-text", "Metin", "P", "Temel", "Kısa açıklama veya paragraf alanı ekler.", "rich-text", {
    title: "Metin alanı",
    body: "Ziyaretçilere aktarılacak metni buraya yazın."
  }),
  widget("image", "Görsel", "IMG", "Temel", "Medya kütüphanesinden görsel seçilebilen alan ekler.", "image", {
    title: "Görsel başlığı",
    body: "Görsele eşlik eden kısa açıklama.",
    payload: { mediaUrl: "", mediaAlt: "", objectFit: "cover", focalPoint: { x: 50, y: 50 } }
  }),
  widget("video", "Video", "VID", "Temel", "Güvenli video URL veya medya videosu içeren alan ekler.", "video", {
    title: "Video başlığı",
    body: "Videonun izleyiciye ne anlatacağını açıklayın.",
    payload: { mediaUrl: "", mediaPosterUrl: "" }
  }),
  widget("button", "Buton", "BTN", "Temel", "Bir çağrı aksiyonu ekler.", "button", {
    title: "Çağrı alanı",
    body: "Kısa yönlendirme metni.",
    payload: { buttonLabel: "İncele", buttonHref: "/" }
  }),
  widget("divider", "Ayırıcı", "DIV", "Temel", "Bölümler arasında görsel ayrım oluşturur.", "divider", {
    title: "Ayırıcı",
    body: ""
  }),
  widget("spacer", "Boşluk", "SPC", "Temel", "Kontrollü boşluk alanı ekler.", "spacer", {
    title: "Boşluk",
    body: "",
    payload: { height: "medium" }
  }),
  widget("one-column", "Tek sütun", "1", "Düzen", "Tek kolonlu içerik konteyneri ekler.", "container", {
    title: "Tek sütunlu bölüm",
    body: "Bu bölümü içerikle doldurun.",
    payload: { columns: 1 }
  }),
  widget("two-columns", "İki sütun", "2", "Düzen", "Yan yana iki kolonlu alan ekler.", "container", {
    title: "İki sütunlu bölüm",
    body: "Metin ve görseli birlikte sunun.",
    payload: { columns: 2 }
  }),
  widget("three-columns", "Üç sütun", "3", "Düzen", "Üç kartlık açıklama alanı ekler.", "card-grid", {
    title: "Üçlü kart alanı",
    body: "Öne çıkan maddeleri kartlarla anlatın.",
    payload: { columns: 3, items: [] }
  }),
  widget("card-grid", "Kart ızgarası", "GRID", "Düzen", "Sıralanabilir kart listesi ekler.", "card-grid", {
    title: "Kart ızgarası",
    body: "Kartları sağ panelden düzenleyin.",
    payload: { items: [] }
  }),
  widget("hero", "Hero", "H", "Vitrin", "Sayfa üstü güçlü tanıtım alanı ekler.", "hero", {
    eyebrow: "Öne çıkan",
    title: "Yeni hero başlığı",
    body: "Bu alan ziyaretçiye sayfanın ana mesajını verir.",
    payload: { tone: "teal", buttonLabel: "Detayları Gör", buttonHref: "/" }
  }),
  widget("slider", "Slider", "SLD", "Vitrin", "Ana sayfa için yönetilebilir slider alanı ekler.", "showcase-hero", {
    eyebrow: "Ana Sayfa",
    title: "Yeni slider alanı",
    body: "Slide listesini özel slider editöründen yönetin.",
    payload: { slides: [] }
  }),
  widget("gallery", "Galeri", "GAL", "Vitrin", "Görsel galeri alanı ekler.", "gallery", {
    title: "Galeri",
    body: "Görselleri medya kütüphanesinden seçin.",
    payload: { items: [] }
  }),
  widget("cta", "CTA alanı", "CTA", "Vitrin", "İletişim veya başvuru çağrı alanı ekler.", "cta", {
    title: "Hızlıca iletişime geçin",
    body: "Paket ve süreç hakkında destek alın.",
    payload: { buttonLabel: "İletişime Geç", buttonHref: "#iletisim", tone: "amber" }
  }),
  widget("faq", "SSS", "FAQ", "İçerik", "Soru-cevap akordeonu ekler.", "faq", {
    title: "Sık Sorulan Sorular",
    body: "",
    payload: { items: [{ question: "Soru", answer: "Yanıt" }] }
  }),
  widget("testimonial", "Testimonial", "TST", "İçerik", "Tek müşteri/öğrenci yorumu alanı ekler.", "testimonial", {
    title: "Öğrenci yorumu",
    body: "Kısa ve güven veren bir yorum ekleyin."
  }),
  lockedWidget("site-logo", "Site logosu", "LOGO", "Global", "Logo ayarları marka panelinden yönetilir."),
  lockedWidget("navigation-menu", "Ana menü", "NAV", "Global", "Menü öğeleri Header ve Menü alanından yönetilir."),
  lockedWidget("footer", "Footer", "FTR", "Global", "Footer ve iletişim alanından yönetilir."),
  lockedWidget("contact-card", "İletişim kartı", "TEL", "Global", "Telefon, WhatsApp ve adres ayarlarını kullanır."),
  lockedWidget("package-directory", "Paket dizini", "PKG", "Sistem/Dinamik", "Paket verisi Ticaret modülünden gelir."),
  lockedWidget("free-material-directory", "Ücretsiz materyal dizini", "MAT", "Sistem/Dinamik", "Materyal verisi Ücretsiz Materyaller panelinden gelir."),
  lockedWidget("calculator", "Puan hesaplayıcı", "CAL", "Sistem/Dinamik", "Hesaplama motoru kilitli sistem modülüdür."),
  lockedWidget("countdown", "Geri sayım", "DAY", "Sistem/Dinamik", "Sayaç motoru kilitli sistem modülüdür."),
  lockedWidget("academic-staff-data", "Akademik kadro verisi", "TEAM", "Sistem/Dinamik", "Kadro verisi Akademik Kadro panelinden gelir."),
  lockedWidget("success-stories-data", "Başarı hikayeleri verisi", "WIN", "Sistem/Dinamik", "Başarı hikayeleri panelindeki veriyi kullanır.")
];

export function getWidgetDefinition(widgetKey: string) {
  return widgetRegistry.find((widget) => widget.key === widgetKey) ?? null;
}

export function getWidgetsByCategory() {
  return widgetRegistry.reduce<Record<WidgetCategory, WidgetDefinition[]>>((groups, widgetDefinition) => {
    groups[widgetDefinition.category] = groups[widgetDefinition.category] ?? [];
    groups[widgetDefinition.category].push(widgetDefinition);
    return groups;
  }, {} as Record<WidgetCategory, WidgetDefinition[]>);
}

export function canPlaceWidget(widgetDefinition: WidgetDefinition, area: WebsiteArea, page?: AdminMarketingPage | null) {
  if (!widgetDefinition.allowedAreas.includes(area)) {
    return "Bu bileşen seçili alana eklenemez.";
  }

  if (widgetDefinition.allowedPageTypes?.length && page) {
    return widgetDefinition.allowedPageTypes.includes(page.pageType)
      ? ""
      : "Bu bileşen seçili sayfa türü için uygun değil.";
  }

  if (widgetDefinition.locked) {
    return "Bu sistem bileşeni ilgili özel panelden yönetilir.";
  }

  return "";
}

export function createSectionFromWidget(widgetKey: string, order: number): AdminMarketingPageSection | null {
  const definition = getWidgetDefinition(widgetKey);
  if (!definition || definition.locked) {
    return null;
  }

  const stablePart = `${widgetKey}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  return {
    sectionKey: stablePart,
    eyebrow: definition.defaultContent.eyebrow ?? null,
    title: definition.defaultContent.title ?? definition.label,
    body: definition.defaultContent.body ?? null,
    variantKey: definition.defaultContent.variantKey ?? definition.type,
    payload: {
      ...(definition.defaultContent.payload ?? {}),
      style: definition.defaultStyle
    },
    sortOrder: order,
    isActive: true,
    publishStatus: "DRAFT"
  };
}

function widget(
  key: string,
  label: string,
  icon: string,
  category: WidgetCategory,
  description: string,
  type: string,
  content: Partial<Pick<AdminMarketingPageSection, "eyebrow" | "title" | "body" | "variantKey" | "payload">>
): WidgetDefinition {
  return {
    key,
    type,
    label,
    icon,
    category,
    description,
    allowedAreas: ["sayfalar"],
    defaultContent: {
      eyebrow: content.eyebrow ?? null,
      title: content.title ?? label,
      body: content.body ?? null,
      variantKey: content.variantKey ?? type,
      payload: content.payload ?? {}
    },
    defaultStyle: {
      spacing: "normal",
      width: "container",
      tone: "teal"
    },
    inspectorFields: ["eyebrow", "title", "body", "media", "button", "tone", "visibility", "anchor"],
    removable: true,
    duplicable: true,
    dynamic: false,
    locked: false,
    supportsResponsive: true
  };
}

function lockedWidget(
  key: string,
  label: string,
  icon: string,
  category: WidgetCategory,
  description: string
): WidgetDefinition {
  return {
    key,
    type: key,
    label,
    icon,
    category,
    description,
    allowedAreas: ["sayfalar"],
    defaultContent: {
      eyebrow: null,
      title: label,
      body: description,
      variantKey: key,
      payload: {}
    },
    defaultStyle: {},
    inspectorFields: ["visibility"],
    removable: false,
    duplicable: false,
    dynamic: true,
    locked: true,
    supportsResponsive: false
  };
}
