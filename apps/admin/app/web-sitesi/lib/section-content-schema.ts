import type { AdminMarketingPageSection } from "../../../lib/auth-client";

/**
 * Editing schema for section payloads that hold a repeatable list.
 *
 * The homepage sections that used to be hardcoded (logo rail, video showcase,
 * feature highlights, contact CTA) all share the same shape: a payload key
 * holding an array of records. Describing them as data means one list editor
 * serves all of them, and adding the next bindable section is a schema entry
 * rather than another bespoke form.
 *
 * Field keys must match what apps/web/lib/home-sections.ts reads.
 */
export type PayloadFieldType = "text" | "textarea" | "media" | "url" | "tone" | "ctaVariant" | "boolean";

export type PayloadField = {
  key: string;
  label: string;
  type: PayloadFieldType;
  placeholder?: string;
};

export type SectionListSpec = {
  /** Payload property holding the array. */
  payloadKey: string;
  itemNoun: string;
  addLabel: string;
  emptyHint: string;
  /** Field shown as the row heading in the collapsed list. */
  headingField: string;
  fields: PayloadField[];
  createItem: (index: number) => Record<string, unknown>;
};

const TONE_DEFAULT = "amber";

export const sectionListSpecs: Record<string, SectionListSpec> = {
  "logo-rail": {
    payloadKey: "items",
    itemNoun: "Logo",
    addLabel: "Logo ekle",
    emptyHint: "Şerit için en az bir logo ekleyin.",
    headingField: "alt",
    fields: [
      { key: "src", label: "Görsel", type: "media" },
      { key: "alt", label: "Alternatif metin", type: "text", placeholder: "Yayın partneri logosu" }
    ],
    createItem: (index) => ({ id: `logo-${index + 1}`, src: "", alt: "" })
  },
  "video-showcase": {
    payloadKey: "items",
    itemNoun: "Video kartı",
    addLabel: "Video kartı ekle",
    emptyHint: "Bu bölüm için en az bir kart ekleyin.",
    headingField: "title",
    fields: [
      { key: "title", label: "Başlık", type: "text" },
      { key: "category", label: "Kategori", type: "text", placeholder: "TYT Türkçe" },
      { key: "duration", label: "Süre", type: "text", placeholder: "18 dk" },
      { key: "teacher", label: "Etiket / Eğitmen", type: "text", placeholder: "Kayıtlı Ders" },
      { key: "summary", label: "Özet", type: "textarea" },
      { key: "tone", label: "Renk tonu", type: "tone" }
    ],
    createItem: (index) => ({
      id: `video-${index + 1}`,
      title: "",
      category: "",
      duration: "",
      teacher: "",
      summary: "",
      tone: TONE_DEFAULT
    })
  },
  "feature-highlights": {
    payloadKey: "items",
    itemNoun: "Özellik",
    addLabel: "Özellik ekle",
    emptyHint: "Bu bölüm için en az bir özellik ekleyin.",
    headingField: "label",
    fields: [
      { key: "label", label: "Şerit etiketi", type: "text", placeholder: "Kişiye göre ürün anlatımı" },
      { key: "title", label: "Başlık", type: "text" },
      { key: "body", label: "Metin", type: "textarea" },
      { key: "mediaLabel", label: "Medya rozeti", type: "text", placeholder: "Tanıtım Videosu" },
      { key: "mediaTitle", label: "Medya başlığı", type: "text" },
      { key: "mediaBody", label: "Medya açıklaması", type: "textarea" },
      { key: "tone", label: "Renk tonu", type: "tone" }
    ],
    createItem: (index) => ({
      id: `feature-${index + 1}`,
      label: "",
      title: "",
      body: "",
      mediaLabel: "",
      mediaTitle: "",
      mediaBody: "",
      tone: TONE_DEFAULT
    })
  },
  "contact-cta": {
    payloadKey: "actions",
    itemNoun: "Buton",
    addLabel: "Buton ekle",
    emptyHint: "İletişim alanı için en az bir buton ekleyin.",
    headingField: "label",
    fields: [
      { key: "label", label: "Buton metni", type: "text" },
      {
        key: "href",
        label: "Bağlantı",
        type: "url",
        placeholder: "/kayit, {{whatsapp}} veya {{phone}}"
      },
      { key: "variant", label: "Buton tipi", type: "ctaVariant" },
      { key: "openInNewTab", label: "Yeni sekmede aç", type: "boolean" }
    ],
    createItem: (index) => ({
      id: `cta-${index + 1}`,
      label: "",
      href: "",
      variant: "ghost",
      openInNewTab: false
    })
  }
};

export function getSectionListSpec(section: AdminMarketingPageSection | null): SectionListSpec | null {
  if (!section) {
    return null;
  }

  const key = section.variantKey ?? section.sectionKey;
  return sectionListSpecs[key] ?? null;
}

export function readPayloadItems(
  section: AdminMarketingPageSection | null,
  spec: SectionListSpec
): Record<string, unknown>[] {
  const payload = isRecord(section?.payload) ? section.payload : {};
  const raw = payload[spec.payloadKey];

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter(isRecord).map((entry) => ({ ...entry }));
}

export function writePayloadItems(
  section: AdminMarketingPageSection | null,
  spec: SectionListSpec,
  items: Record<string, unknown>[]
): Record<string, unknown> {
  const payload = isRecord(section?.payload) ? section.payload : {};

  return { ...payload, [spec.payloadKey]: items };
}

export function updatePayloadItem(
  items: Record<string, unknown>[],
  index: number,
  key: string,
  value: unknown
): Record<string, unknown>[] {
  return items.map((item, position) => (position === index ? { ...item, [key]: value } : item));
}

export function movePayloadItem(items: Record<string, unknown>[], index: number, direction: -1 | 1) {
  const target = index + direction;

  if (index < 0 || index >= items.length || target < 0 || target >= items.length) {
    return items;
  }

  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function removePayloadItem(items: Record<string, unknown>[], index: number) {
  return items.filter((_, position) => position !== index);
}

export function appendPayloadItem(items: Record<string, unknown>[], spec: SectionListSpec) {
  return [...items, spec.createItem(items.length)];
}

export function duplicatePayloadItem(items: Record<string, unknown>[], index: number) {
  const source = items[index];

  if (!source) {
    return items;
  }

  const copy = { ...source, id: `${String(source.id ?? "item")}-copy-${Date.now().toString(36)}` };
  return [...items.slice(0, index + 1), copy, ...items.slice(index + 1)];
}

export function itemHeading(item: Record<string, unknown>, spec: SectionListSpec, index: number) {
  const value = item[spec.headingField];

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return `${spec.itemNoun} ${index + 1}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
