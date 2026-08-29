"use client";

import type { HomeShowcaseSlide, HomeShowcaseTone } from "@ega/ui";
import type { AdminMarketingPageSection } from "../../../lib/auth-client";
import type { BuilderActions } from "../lib/builder-types";
import {
  fallbackShowcaseSlides,
  normalizeHomeSliderPayload,
  writeHomeSliderPayload
} from "../lib/section-registry";
import { validateSlider } from "../lib/builder-validation";
import { MediaField } from "./media-field";

export function HomepageSliderEditor({
  section,
  selectedSlideId,
  actions
}: {
  section: AdminMarketingPageSection;
  selectedSlideId: string | null;
  actions: BuilderActions;
}) {
  const slider = normalizeHomeSliderPayload(section);
  const selectedSlide =
    slider.slides.find((slide) => slide.id === selectedSlideId) ?? slider.slides[0] ?? fallbackShowcaseSlides[0];
  const selectedIndex = slider.slides.findIndex((slide) => slide.id === selectedSlide.id);
  const validation = validateSlider(slider.slides, slider.settings);

  function commit(nextSlides: HomeShowcaseSlide[], nextSettings = slider.settings) {
    actions.updateSection(writeHomeSliderPayload(section, { slides: nextSlides, settings: nextSettings }));
  }

  function updateSlide(patch: Partial<HomeShowcaseSlide>) {
    commit(
      slider.slides.map((slide) => (slide.id === selectedSlide.id ? { ...slide, ...patch } : slide))
    );
  }

  function addSlide() {
    const nextSlide: HomeShowcaseSlide = {
      ...fallbackShowcaseSlides[0],
      id: `slide-${Date.now().toString(36)}`,
      label: "Yeni Slide",
      title: "Yeni slide başlığı",
      description: "Bu slide için kısa açıklama yazın.",
      mediaUrl: "",
      mediaAlt: "",
      primaryCtaLabel: "",
      primaryCtaHref: "",
      secondaryCtaLabel: "",
      secondaryCtaHref: "",
      mobileMediaUrl: "",
      isActive: true
    };
    commit([...slider.slides, nextSlide]);
    actions.dispatchSelection({ type: "set-slide", slideId: nextSlide.id });
  }

  function duplicateSlide() {
    const nextSlide = {
      ...selectedSlide,
      id: `${selectedSlide.id}-copy-${Date.now().toString(36)}`,
      title: `${selectedSlide.title} kopyası`
    };
    const nextSlides = [...slider.slides];
    nextSlides.splice(selectedIndex + 1, 0, nextSlide);
    commit(nextSlides);
    actions.dispatchSelection({ type: "set-slide", slideId: nextSlide.id });
  }

  function moveSlide(direction: -1 | 1) {
    const target = selectedIndex + direction;
    if (selectedIndex < 0 || target < 0 || target >= slider.slides.length) {
      return;
    }
    const nextSlides = [...slider.slides];
    const [slide] = nextSlides.splice(selectedIndex, 1);
    nextSlides.splice(target, 0, slide);
    commit(nextSlides);
  }

  function deleteSlide() {
    if (slider.slides.length <= 1) {
      return;
    }
    if (!window.confirm("Bu slide taslaktan kaldırılacak. Devam edilsin mi?")) {
      return;
    }
    const nextSlides = slider.slides.filter((slide) => slide.id !== selectedSlide.id);
    commit(nextSlides);
    actions.dispatchSelection({ type: "set-slide", slideId: nextSlides[0]?.id ?? null });
  }

  return (
    <div className="admin-slider-editor">
      <header className="admin-slider-editor__header">
        <div>
          <span>Ana Sayfa</span>
          <h3>Hero / Slider</h3>
        </div>
        <button className="admin-button--compact" type="button" onClick={addSlide}>
          Yeni Slide
        </button>
      </header>

      <div className="admin-slider-editor__list" aria-label="Slide listesi">
        {slider.slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            className="admin-slider-thumb"
            data-active={slide.id === selectedSlide.id}
            onClick={() => actions.dispatchSelection({ type: "set-slide", slideId: slide.id })}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{slide.label || slide.title}</strong>
            <small>{slide.mediaType === "VIDEO" ? "Video" : "Görsel"} · {slide.tone} · {slide.isActive === false ? "Pasif" : "Aktif"}</small>
          </button>
        ))}
      </div>

      <div className="admin-builder-toolbar__center">
        <button type="button" className="admin-button--compact" onClick={duplicateSlide}>Slide Kopyala</button>
        <button type="button" className="admin-button--compact" onClick={() => moveSlide(-1)}>Yukarı Taşı</button>
        <button type="button" className="admin-button--compact" onClick={() => moveSlide(1)}>Aşağı Taşı</button>
        <button type="button" className="admin-button--compact admin-button--ghost" onClick={deleteSlide} disabled={slider.slides.length <= 1}>
          Sil
        </button>
      </div>

      <fieldset>
        <legend>İçerik</legend>
        <label className="admin-builder-field">
          <span>Üst etiket</span>
          <input value={selectedSlide.label} onChange={(event) => updateSlide({ label: event.target.value })} />
        </label>
        <label className="admin-builder-field">
          <span>Başlık</span>
          <input value={selectedSlide.title} onChange={(event) => updateSlide({ title: event.target.value })} />
        </label>
        <label className="admin-builder-field">
          <span>Açıklama</span>
          <textarea value={selectedSlide.description} onChange={(event) => updateSlide({ description: event.target.value })} />
        </label>
        <label className="admin-checkbox-row">
          <input
            type="checkbox"
            checked={selectedSlide.isActive !== false}
            onChange={(event) => updateSlide({ isActive: event.target.checked })}
          />
          Slide aktif
        </label>
        <label className="admin-builder-field">
          <span>Primary CTA metni</span>
          <input
            value={selectedSlide.primaryCtaLabel ?? ""}
            onChange={(event) => updateSlide({ primaryCtaLabel: event.target.value })}
          />
        </label>
        <label className="admin-builder-field">
          <span>Primary CTA hedefi</span>
          <input
            value={selectedSlide.primaryCtaHref ?? ""}
            onChange={(event) => updateSlide({ primaryCtaHref: event.target.value })}
            placeholder="/paketlerimiz veya https://..."
          />
        </label>
        <label className="admin-builder-field">
          <span>Secondary CTA metni</span>
          <input
            value={selectedSlide.secondaryCtaLabel ?? ""}
            onChange={(event) => updateSlide({ secondaryCtaLabel: event.target.value })}
          />
        </label>
        <label className="admin-builder-field">
          <span>Secondary CTA hedefi</span>
          <input
            value={selectedSlide.secondaryCtaHref ?? ""}
            onChange={(event) => updateSlide({ secondaryCtaHref: event.target.value })}
            placeholder="/ucretsiz-materyaller veya https://..."
          />
        </label>
      </fieldset>

      <fieldset>
        <legend>Medya</legend>
        <label className="admin-builder-field">
          <span>Medya türü</span>
          <select
            value={selectedSlide.mediaType}
            onChange={(event) => updateSlide({ mediaType: event.target.value === "VIDEO" ? "VIDEO" : "IMAGE" })}
          >
            <option value="IMAGE">Görsel</option>
            <option value="VIDEO">Video</option>
          </select>
        </label>
        <MediaField
          intent={{
            kind: selectedSlide.mediaType === "VIDEO" ? "VIDEO" : "IMAGE",
            label: selectedSlide.mediaType === "VIDEO" ? "Slide videosu" : "Desktop slide görseli",
            description: "Canvas ve public ana sayfa aynı medya değerini kullanır.",
            recommendedDimensions: "1600x1000 px",
            recommendedAspectRatio: "16:10",
            allowExternalUrl: true
          }}
          value={selectedSlide.mediaUrl}
          altText={selectedSlide.mediaAlt}
          onChange={(mediaUrl) => updateSlide({ mediaUrl })}
          onAltTextChange={(mediaAlt) => updateSlide({ mediaAlt })}
        />
        <MediaField
          intent={{
            kind: selectedSlide.mediaType === "VIDEO" ? "VIDEO" : "IMAGE",
            label: selectedSlide.mediaType === "VIDEO" ? "Mobil slide videosu" : "Mobil slide görseli",
            description: "Dar ekranlar için ayrı medya kullanacaksanız seçin.",
            recommendedDimensions: "780x960 px",
            recommendedAspectRatio: "4:5",
            allowExternalUrl: true
          }}
          value={selectedSlide.mobileMediaUrl ?? ""}
          altText={selectedSlide.mediaAlt}
          onChange={(mobileMediaUrl) => updateSlide({ mobileMediaUrl })}
          onAltTextChange={(mediaAlt) => updateSlide({ mediaAlt })}
        />
        {selectedSlide.mediaType === "VIDEO" ? (
          <MediaField
            intent={{
              kind: "IMAGE",
              label: "Video poster görseli",
              description: "Video yüklenene kadar gösterilecek görsel.",
              recommendedDimensions: "1600x1000 px",
              recommendedAspectRatio: "16:10",
              allowExternalUrl: true
            }}
            value={selectedSlide.mediaPosterUrl}
            onChange={(mediaPosterUrl) => updateSlide({ mediaPosterUrl })}
          />
        ) : null}
      </fieldset>

      <fieldset>
        <legend>Görünüm</legend>
        <label className="admin-builder-field">
          <span>Ton</span>
          <select value={selectedSlide.tone} onChange={(event) => updateSlide({ tone: event.target.value as HomeShowcaseTone })}>
            <option value="amber">Amber</option>
            <option value="teal">Teal</option>
            <option value="blue">Mavi</option>
          </select>
        </label>
      </fieldset>

      <fieldset>
        <legend>Slider ayarları</legend>
        <label className="admin-checkbox-row">
          <input
            type="checkbox"
            checked={slider.settings.autoplay}
            onChange={(event) => commit(slider.slides, { ...slider.settings, autoplay: event.target.checked })}
          />
          Otomatik oynat
        </label>
        <label className="admin-builder-field">
          <span>Geçiş süresi (ms)</span>
          <input
            type="number"
            min={2500}
            max={15000}
            step={100}
            value={slider.settings.intervalMs}
            onChange={(event) => commit(slider.slides, { ...slider.settings, intervalMs: Number(event.target.value) })}
          />
        </label>
        <label className="admin-builder-field">
          <span>Geçiş tipi</span>
          <select
            value={slider.settings.transition}
            onChange={(event) => commit(slider.slides, { ...slider.settings, transition: event.target.value === "slide" ? "slide" : "fade" })}
          >
            <option value="fade">Yumuşak geçiş</option>
            <option value="slide">Kaydırma</option>
          </select>
        </label>
        <div className="admin-builder-check-grid">
          {[
            ["pauseOnHover", "Hover sırasında duraklat"],
            ["showArrows", "Okları göster"],
            ["showDots", "Noktaları göster"],
            ["keyboard", "Klavye ile gezinme"],
            ["swipe", "Dokunmatik kaydırma"]
          ].map(([key, label]) => (
            <label key={key} className="admin-checkbox-row">
              <input
                type="checkbox"
                checked={Boolean(slider.settings[key as keyof typeof slider.settings])}
                onChange={(event) => commit(slider.slides, { ...slider.settings, [key]: event.target.checked })}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {!validation.ok ? (
        <div className="admin-alert admin-alert--warning" role="alert">
          {validation.messages.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
