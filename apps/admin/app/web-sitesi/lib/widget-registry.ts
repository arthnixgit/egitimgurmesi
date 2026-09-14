import { isRenderableSectionVariant } from "@ega/ui";
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
  lockedWidget("heading", "Başlık", "T", "Temel", "Bu bileşenin public sitede henüz bir karşılığı yok; eklenirse yayında görünmez."),
  lockedWidget("rich-text", "Metin", "P", "Temel", "Bu bileşenin public sitede henüz bir karşılığı yok; eklenirse yayında görünmez."),
  lockedWidget("image", "Görsel", "IMG", "Temel", "Bu bileşenin public sitede henüz bir karşılığı yok; eklenirse yayında görünmez."),
  lockedWidget("video", "Video", "VID", "Temel", "Bu bileşenin public sitede henüz bir karşılığı yok; eklenirse yayında görünmez."),
  lockedWidget("button", "Buton", "BTN", "Temel", "Bu bileşenin public sitede henüz bir karşılığı yok; eklenirse yayında görünmez."),
  lockedWidget("divider", "Ayırıcı", "DIV", "Temel", "Bu bileşenin public sitede henüz bir karşılığı yok; eklenirse yayında görünmez."),
  lockedWidget("spacer", "Boşluk", "SPC", "Temel", "Bu bileşenin public sitede henüz bir karşılığı yok; eklenirse yayında görünmez."),
  lockedWidget("one-column", "Tek sütun", "1", "Düzen", "Bu bileşenin public sitede henüz bir karşılığı yok; eklenirse yayında görünmez."),
  lockedWidget("two-columns", "İki sütun", "2", "Düzen", "Bu bileşenin public sitede henüz bir karşılığı yok; eklenirse yayında görünmez."),
  lockedWidget("three-columns", "Üç sütun", "3", "Düzen", "Bu bileşenin public sitede henüz bir karşılığı yok; eklenirse yayında görünmez."),
  lockedWidget("card-grid", "Kart ızgarası", "GRID", "Düzen", "Bu bileşenin public sitede henüz bir karşılığı yok; eklenirse yayında görünmez."),
  lockedWidget("hero", "Hero", "H", "Vitrin", "Bu bileşenin public sitede henüz bir karşılığı yok; eklenirse yayında görünmez."),
  lockedWidget("slider", "Slider", "SLD", "Vitrin", "Bu bileşenin public sitede henüz bir karşılığı yok; eklenirse yayında görünmez."),
  lockedWidget("gallery", "Galeri", "GAL", "Vitrin", "Bu bileşenin public sitede henüz bir karşılığı yok; eklenirse yayında görünmez."),
  lockedWidget("cta", "CTA alanı", "CTA", "Vitrin", "Bu bileşenin public sitede henüz bir karşılığı yok; eklenirse yayında görünmez."),
  lockedWidget("faq", "SSS", "FAQ", "İçerik", "Bu bileşenin public sitede henüz bir karşılığı yok; eklenirse yayında görünmez."),
  lockedWidget("testimonial", "Testimonial", "TST", "İçerik", "Bu bileşenin public sitede henüz bir karşılığı yok; eklenirse yayında görünmez."),
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

  // Last line of defence: never mint a section the public site cannot render,
  // however the palette was configured.
  if (!isRenderableSectionVariant(definition.defaultContent.variantKey ?? definition.type)) {
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
