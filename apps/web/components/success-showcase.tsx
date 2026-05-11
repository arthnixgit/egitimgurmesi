"use client";

import { useMemo, useState } from "react";
import type { SuccessStoryContent } from "../lib/public-content-api";

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

  const activeStory = stories[activeIndex] ?? stories[0] ?? null;

  const metrics = useMemo(() => {
    return [
      { value: String(stories.length).padStart(2, "0"), label: "yayınlanan başarı hikâyesi" },
      { value: String(new Set(stories.map((story) => story.city).filter(Boolean)).size).padStart(2, "0"), label: "farklı şehir" },
      { value: String(new Set(stories.map((story) => story.examLabel)).size).padStart(2, "0"), label: "farklı sınav akışı" }
    ];
  }, [stories]);

  if (!activeStory) {
    return (
      <section className="ega-section ega-container">
        <div className="ega-highlight-card">
          <span className="ega-pill">Başarı Hikâyeleri</span>
          <h3>Henüz yayınlanmış içerik bulunmuyor.</h3>
          <p>Bu alan admin panelinden başarı hikâyeleri eklenince dolacak.</p>
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
            <h2>Öğrencilerin süreç dönüşümünü gerçek hikâyelerle görünür kıl</h2>
            <p>
              Bu alan, öğrencinin hangi sınava hazırlandığını, hangi dönüşümü yaşadığını ve sonucun hangi düzenle geldiğini kısa ama güçlü bir yapıda anlatır.
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
                  <span>{story.examLabel}</span>
                  <strong>{story.studentName}</strong>
                  <p>{story.highlight}</p>
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
                <strong>{activeStory.examLabel}</strong>
              </button>
            </div>

            <div className="ega-success-video-stage__body">
              <span>{activeStory.studentName}</span>
              <strong>{activeStory.resultTitle}</strong>
              <p>{activeStory.story}</p>
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
                  <p>{story.highlight}</p>
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
            <div className="ega-success-poster-card__brand">
              {activeStory.avatarUrl ? (
                <img src={activeStory.avatarUrl} alt={`${activeStory.studentName} görseli`} />
              ) : (
                <img src="/branding/ega-mark-transparent.png" alt="EGA" />
              )}
              <span>{activeStory.studentName}</span>
            </div>

            <div className="ega-success-poster-card__hero">
              <span>{activeStory.examLabel}</span>
              <strong>{activeStory.city ?? "Ankara"}</strong>
              <p>{activeStory.resultTitle}</p>
            </div>

            <div className="ega-success-poster-card__sheet">
              <div className="ega-success-poster-card__sheet-head">
                <strong>{activeStory.highlight}</strong>
                <span>{activeStory.isFeatured ? "Öne çıkan sonuç kartı" : "Başarı arşivi kaydı"}</span>
              </div>

              <div className="ega-success-score-table">
                <div className="ega-success-score-table__row">
                  <span>Öğrenci</span>
                  <strong>{activeStory.studentName}</strong>
                </div>
                <div className="ega-success-score-table__row">
                  <span>Sınav Akışı</span>
                  <strong>{activeStory.examLabel}</strong>
                </div>
                <div className="ega-success-score-table__row">
                  <span>Şehir</span>
                  <strong>{activeStory.city ?? "Belirtilmedi"}</strong>
                </div>
              </div>
            </div>
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
                  <span>{story.examLabel}</span>
                  <strong>{story.studentName}</strong>
                  <p>{story.resultTitle}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </>
  );
}
