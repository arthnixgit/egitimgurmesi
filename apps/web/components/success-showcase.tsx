"use client";

import { useMemo, useState } from "react";
import type { SuccessStoryContent } from "../lib/public-content-api";
import { usePublicSiteSettings } from "./public-site-settings-provider";

type SuccessShowcaseProps = {
  stories: readonly SuccessStoryContent[];
};

function initialsFromName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function SuccessShowcase({ stories }: SuccessShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const siteSettings = usePublicSiteSettings();

  const activeStory = stories[activeIndex] ?? stories[0] ?? null;
  const cardMeta = activeStory ? [activeStory.examLabel, activeStory.city].filter(Boolean).join(" · ") : "";

  const metrics = useMemo(() => {
    return [
      { value: String(stories.length).padStart(2, "0"), label: "yayınlanan başarı hikâyesi" },
      { value: String(new Set(stories.map((story) => story.city).filter(Boolean)).size).padStart(2, "0"), label: "farklı şehir" },
      { value: String(new Set(stories.map((story) => story.examLabel).filter(Boolean)).size).padStart(2, "0"), label: "farklı sınav akışı" }
    ];
  }, [stories]);

  if (!activeStory) {
    return (
      <section className="ega-section ega-container">
        <div className="ega-highlight-card">
          <h3>Yeni başarı hikayeleri hazırlanıyor.</h3>
          <p>Öğrenci gelişimleri ve sınav sonuçları bu bölümde paylaşılacak.</p>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="ega-section ega-container">
        <div className="ega-success-strip">
          <div className="ega-success-strip__head">
            <span className="ega-pill ega-pill--warm">Başarılarımız</span>
            <h2>Öğrenci başarılarını gerçek hikâyelerle keşfedin</h2>
            <p>
              Her hikâye; hedefi, çalışma ritmini ve sonucu kısa bir akışla sunar.
            </p>
          </div>

          <div className="ega-success-metric-row">
            {metrics.map((metric) => (
              <article key={metric.label} className="ega-success-metric-card">
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </article>
            ))}
          </div>

          <div className="ega-success-track-tabs" role="tablist" aria-label="Başarı hikâyeleri">
            {stories.map((story, index) => {
              const isActive = index === activeIndex;

              return (
                <button
                  key={story.id}
                  type="button"
                  className="ega-success-track-tab"
                  data-active={isActive}
                  aria-pressed={isActive}
                  onClick={() => setActiveIndex(index)}
                >
                  {story.examLabel ? <span>{story.examLabel}</span> : null}
                  <strong>{story.studentName}</strong>
                  {story.highlight ? <p>{story.highlight}</p> : null}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="ega-section ega-container">
        <div className="ega-success-section-head">
          <div>
            <span className="ega-pill">Öne Çıkan Hikâye</span>
            <h2>{activeStory.resultTitle}</h2>
          </div>
        </div>

        <article className="ega-success-video-feature">
          <div className="ega-success-video-stage">
            <div className="ega-success-video-stage__chrome">
              <span className="ega-pill ega-pill--dark">{activeStory.city ?? "Türkiye"}</span>
              <button type="button" className="ega-success-play-button" onClick={() => setActiveIndex((current) => (current + 1) % stories.length)}>
                <span>▶</span>
                <strong>{activeStory.examLabel || "Sonraki hikâye"}</strong>
              </button>
            </div>

            <div className="ega-success-video-stage__body">
              <span>{activeStory.studentName}</span>
              <strong>{activeStory.resultTitle}</strong>
              {activeStory.story ? <p>{activeStory.story}</p> : null}
            </div>
          </div>
        </article>

        <div className="ega-success-video-thumbs" role="tablist" aria-label="Başarı hikâyesi kartları">
          {stories.map((story, index) => {
            const isActive = story.id === activeStory.id;

            return (
              <button
                key={story.id}
                type="button"
                className="ega-success-video-thumb"
                data-active={isActive}
                aria-pressed={isActive}
                onClick={() => setActiveIndex(index)}
              >
                <div className="ega-success-video-thumb__poster">
                  <span>{story.examLabel}</span>
                </div>
                <div className="ega-success-video-thumb__copy">
                  <strong>{story.studentName}</strong>
                  <p>{story.highlight || story.resultTitle}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="ega-section ega-container">
        <div className="ega-success-section-head">
          <div>
            <span className="ega-pill">Sonuç Kartları</span>
            <h2>Admin tarafından güncellenebilir başarı kartları</h2>
          </div>
        </div>

        <div className="ega-success-poster-stage">
          <article className="ega-success-poster-card">
            {/* Logo on top, the score big and bold in the middle, and the
                student's score report below — the layout the customer asked for. */}
            <div className="ega-success-poster-card__brand">
              <img
                src={activeStory.avatarUrl || siteSettings.logoPrimaryUrl}
                alt={activeStory.avatarUrl ? `${activeStory.studentName} görseli` : siteSettings.logoAltText}
              />
            </div>

            <div className="ega-success-poster-card__hero">
              {cardMeta ? <span>{cardMeta}</span> : null}
              <strong>{activeStory.resultTitle}</strong>
              <p>{activeStory.studentName}</p>
            </div>

            {activeStory.scoreReportImageUrl ? (
              <a
                className="ega-success-poster-card__report"
                href={activeStory.scoreReportImageUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`${activeStory.studentName} sonuç belgesini büyük aç`}
              >
                <img
                  src={activeStory.scoreReportImageUrl}
                  alt={`${activeStory.studentName} sonuç belgesi`}
                  loading="lazy"
                  decoding="async"
                />
              </a>
            ) : activeStory.highlight ? (
              <div className="ega-success-poster-card__sheet">
                <div className="ega-success-poster-card__sheet-head">
                  <strong>{activeStory.highlight}</strong>
                </div>
              </div>
            ) : null}
          </article>
        </div>

        <div className="ega-success-poster-rail" role="tablist" aria-label="Başarı sonuç kartları">
          {stories.map((story, index) => {
            const isActive = story.id === activeStory.id;

            return (
              <button
                key={story.id}
                type="button"
                className="ega-success-poster-thumb"
                data-active={isActive}
                aria-pressed={isActive}
                onClick={() => setActiveIndex(index)}
              >
                <div className="ega-success-poster-thumb__frame">
                  {story.examLabel ? <span>{story.examLabel}</span> : null}
                  <strong>{story.resultTitle}</strong>
                  <p>{story.studentName}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </>
  );
}
