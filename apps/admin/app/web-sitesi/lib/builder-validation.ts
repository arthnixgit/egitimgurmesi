import type { HomeShowcaseSlide } from "@ega/ui";
import type { SliderSettings } from "./builder-types";
import { normalizeSectionAnchorId } from "@ega/ui";

export type BuilderValidationResult = {
  ok: boolean;
  messages: string[];
};

export function validateSlider(slides: readonly HomeShowcaseSlide[], settings: SliderSettings): BuilderValidationResult {
  const messages: string[] = [];
  const activeSlides = slides.filter((slide) => slide.isActive !== false && slide.title.trim() && slide.id.trim());
  const ids = new Set<string>();

  for (const slide of slides) {
    if (!slide.id.trim()) {
      messages.push("Her slide için benzersiz bir ID gerekir.");
    }

    if (ids.has(slide.id)) {
      messages.push("Slide ID değerleri tekrar etmemelidir.");
    }
    ids.add(slide.id);

    if (!slide.title.trim()) {
      messages.push("Slide başlığı zorunludur.");
    }

    if (slide.isActive !== false && !slide.mediaUrl.trim()) {
      messages.push("Aktif slide için medya seçilmelidir.");
    }

    if (slide.mediaUrl && !isSafeDestination(slide.mediaUrl)) {
      messages.push("Slide medya bağlantısı güvenli bir site içi rota veya HTTPS adresi olmalıdır.");
    }

    if (slide.mobileMediaUrl && !isSafeDestination(slide.mobileMediaUrl)) {
      messages.push("Mobil slide medya bağlantısı güvenli bir site içi rota veya HTTPS adresi olmalıdır.");
    }

    if (slide.mediaPosterUrl && !isSafeDestination(slide.mediaPosterUrl)) {
      messages.push("Video poster bağlantısı güvenli bir site içi rota veya HTTPS adresi olmalıdır.");
    }

    if (slide.mediaUrl && !slide.mediaAlt.trim()) {
      messages.push("Anlamlı görseller için alt metin gereklidir.");
    }

    if (Boolean(slide.primaryCtaLabel?.trim()) !== Boolean(slide.primaryCtaHref?.trim())) {
      messages.push("Primary CTA metni ve hedefi birlikte doldurulmalıdır.");
    }

    if (Boolean(slide.secondaryCtaLabel?.trim()) !== Boolean(slide.secondaryCtaHref?.trim())) {
      messages.push("Secondary CTA metni ve hedefi birlikte doldurulmalıdır.");
    }

    if (slide.primaryCtaHref && !isSafeDestination(slide.primaryCtaHref)) {
      messages.push("Primary CTA hedefi güvenli bir site içi rota veya HTTPS adresi olmalıdır.");
    }

    if (slide.secondaryCtaHref && !isSafeDestination(slide.secondaryCtaHref)) {
      messages.push("Secondary CTA hedefi güvenli bir site içi rota veya HTTPS adresi olmalıdır.");
    }
  }

  if (activeSlides.length === 0) {
    messages.push("Yayına almak için en az bir aktif slide gerekir.");
  }

  if (settings.intervalMs < 2500 || settings.intervalMs > 15000) {
    messages.push("Otomatik geçiş süresi 2.5 ile 15 saniye arasında olmalıdır.");
  }

  return {
    ok: messages.length === 0,
    messages
  };
}

export function isSafeDestination(value: string) {
  if (!value.trim()) {
    return true;
  }

  if (value.startsWith("/") && !value.startsWith("//")) {
    return true;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Delegates to the shared contract so the id the panel stores is exactly the id
 * the public page renders. Two copies of this rule drifted apart once already,
 * and both of them ate Turkish letters.
 */
export function normalizeAnchorId(value: string) {
  return normalizeSectionAnchorId(value) ?? "";
}
