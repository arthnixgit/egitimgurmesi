import React from "react";

export type HomeShowcaseTone = "amber" | "teal" | "blue";
export type HomeShowcaseMediaType = "IMAGE" | "VIDEO";

export type HomeShowcaseSlide = {
  id: string;
  label: string;
  title: string;
  description: string;
  tone: HomeShowcaseTone;
  mediaType: HomeShowcaseMediaType;
  mediaUrl: string;
  mobileMediaUrl?: string;
  mediaPosterUrl?: string;
  mediaAlt: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  objectFit?: "cover" | "contain";
  focalPoint?: string;
  isActive?: boolean;
};

export function HomeShowcaseHero({
  slides,
  activeIndex,
  onSelectSlide,
  normalizeVideoUrl,
  isEmbedVideo,
  disableActions = false,
  includeInactiveSlides = false,
  showArrows = true,
  showIndicators = true,
  keyboardNavigation = true,
  swipeNavigation = true,
  pauseOnHover = false,
  transition = "fade",
  onHoverPauseChange
}: {
  slides: readonly HomeShowcaseSlide[];
  activeIndex: number;
  onSelectSlide?: (index: number, slide: HomeShowcaseSlide) => void;
  normalizeVideoUrl?: (url: string) => string;
  isEmbedVideo?: (url: string) => boolean;
  disableActions?: boolean;
  includeInactiveSlides?: boolean;
  showArrows?: boolean;
  showIndicators?: boolean;
  keyboardNavigation?: boolean;
  swipeNavigation?: boolean;
  pauseOnHover?: boolean;
  transition?: "fade" | "slide";
  onHoverPauseChange?: (paused: boolean) => void;
}) {
  const displaySlides = includeInactiveSlides ? slides : slides.filter((slide) => slide.isActive !== false);
  const safeSlides = displaySlides.length > 0 ? displaySlides : [emptyShowcaseSlide];
  const currentIndex = Math.min(Math.max(activeIndex, 0), safeSlides.length - 1);
  const currentSlide = safeSlides[currentIndex] ?? safeSlides[0];
  const hasPrimaryCta = Boolean(currentSlide.primaryCtaLabel?.trim() && currentSlide.primaryCtaHref?.trim());
  const hasSecondaryCta = Boolean(currentSlide.secondaryCtaLabel?.trim() && currentSlide.secondaryCtaHref?.trim());
  const touchStartXRef = React.useRef<number | null>(null);

  function selectSlide(index: number) {
    const nextIndex = (index + safeSlides.length) % safeSlides.length;
    onSelectSlide?.(nextIndex, safeSlides[nextIndex]);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (!keyboardNavigation || !onSelectSlide || safeSlides.length < 2) {
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      selectSlide(currentIndex - 1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      selectSlide(currentIndex + 1);
    }
  }

  function handleTouchStart(event: React.TouchEvent<HTMLElement>) {
    if (!swipeNavigation || safeSlides.length < 2) {
      return;
    }

    touchStartXRef.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLElement>) {
    if (!swipeNavigation || touchStartXRef.current === null || safeSlides.length < 2) {
      return;
    }

    const deltaX = (event.changedTouches[0]?.clientX ?? touchStartXRef.current) - touchStartXRef.current;
    touchStartXRef.current = null;

    if (Math.abs(deltaX) >= 48) {
      selectSlide(deltaX > 0 ? currentIndex - 1 : currentIndex + 1);
    }
  }

  return (
    <section
      className="ega-showcase-hero"
      id="anasayfa"
      aria-label="Öne çıkan görsel anlatım alanı"
      tabIndex={keyboardNavigation && onSelectSlide ? 0 : undefined}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={pauseOnHover ? () => onHoverPauseChange?.(true) : undefined}
      onMouseLeave={pauseOnHover ? () => onHoverPauseChange?.(false) : undefined}
    >
      <div className="ega-showcase-hero__inner">
        <div
          className="ega-showcase-hero__main"
          data-tone={currentSlide.tone}
          data-slide={currentSlide.id}
          data-transition={transition}
        >
          <div className="ega-showcase-hero__copybox">
            <div className="ega-showcase-hero__badge">{currentSlide.label}</div>
            <div className="ega-showcase-hero__copy">
              <h2>{currentSlide.title}</h2>
              <p>{currentSlide.description}</p>
            </div>

            {hasPrimaryCta || hasSecondaryCta ? (
              <div className="ega-showcase-hero__cta-row">
                {hasPrimaryCta ? (
                  <a
                    className="ega-showcase-hero__cta ega-showcase-hero__cta--primary"
                    href={currentSlide.primaryCtaHref}
                    onClick={disableActions ? preventPreviewNavigation : undefined}
                  >
                    {currentSlide.primaryCtaLabel}
                  </a>
                ) : null}
                {hasSecondaryCta ? (
                  <a
                    className="ega-showcase-hero__cta ega-showcase-hero__cta--secondary"
                    href={currentSlide.secondaryCtaHref}
                    onClick={disableActions ? preventPreviewNavigation : undefined}
                  >
                    {currentSlide.secondaryCtaLabel}
                  </a>
                ) : null}
              </div>
            ) : null}

            {showIndicators ? (
              <div className="ega-showcase-hero__indicator-wrap" aria-label="Slayt göstergesi">
                <span className="ega-showcase-hero__indicator-count">
                  {String(currentIndex + 1).padStart(2, "0")} / {String(safeSlides.length).padStart(2, "0")}
                </span>

                <div className="ega-showcase-hero__indicators">
                  {safeSlides.map((slide, index) => (
                    <button
                      key={slide.id}
                      type="button"
                      className="ega-showcase-hero__indicator"
                      data-active={index === currentIndex}
                      aria-label={`${index + 1}. slayta geç`}
                      onClick={() => onSelectSlide?.(index, slide)}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="ega-showcase-hero__media">
            <div className="ega-showcase-hero__media-shell">
              <ShowcaseMedia
                slide={currentSlide}
                normalizeVideoUrl={normalizeVideoUrl}
                isEmbedVideo={isEmbedVideo}
              />
            </div>
          </div>

          {showArrows && safeSlides.length > 1 ? (
            <div className="ega-showcase-hero__arrows" aria-label="Slayt okları">
              <button type="button" aria-label="Önceki slayt" onClick={() => selectSlide(currentIndex - 1)}>
                {"<"}
              </button>
              <button type="button" aria-label="Sonraki slayt" onClick={() => selectSlide(currentIndex + 1)}>
                {">"}
              </button>
            </div>
          ) : null}
        </div>

        <div className="ega-showcase-hero__footer">
          <div className="ega-showcase-hero__footer-line" />
          <div className="ega-showcase-hero__footer-line ega-showcase-hero__footer-line--soft" />
        </div>
      </div>
    </section>
  );
}

function ShowcaseMedia({
  slide,
  normalizeVideoUrl,
  isEmbedVideo
}: {
  slide: HomeShowcaseSlide;
  normalizeVideoUrl?: (url: string) => string;
  isEmbedVideo?: (url: string) => boolean;
}) {
  const [imageFailed, setImageFailed] = React.useState(false);
  const [usesMobileMedia, setUsesMobileMedia] = React.useState(false);

  React.useEffect(() => {
    setImageFailed(false);
  }, [slide.mediaUrl, slide.mobileMediaUrl]);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 720px)");
    const update = () => setUsesMobileMedia(mediaQuery.matches);

    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  const selectedMediaUrl = usesMobileMedia && slide.mobileMediaUrl?.trim() ? slide.mobileMediaUrl : slide.mediaUrl;

  if (!selectedMediaUrl.trim()) {
    return (
      <div className="ega-showcase-hero__placeholder">
        <strong>{slide.label}</strong>
        <span>{slide.description}</span>
      </div>
    );
  }

  if (imageFailed && slide.mediaType === "IMAGE") {
    return (
      <div className="ega-showcase-hero__placeholder">
        <strong>{slide.label}</strong>
        <span>{slide.description}</span>
      </div>
    );
  }

  if (slide.mediaType === "VIDEO") {
    const shouldEmbed = isEmbedVideo?.(selectedMediaUrl) ?? false;

    if (shouldEmbed) {
      return (
        <iframe
          className="ega-showcase-hero__video-frame"
          src={normalizeVideoUrl?.(selectedMediaUrl) ?? selectedMediaUrl}
          title={slide.mediaAlt}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }

    return (
      <video
        className="ega-showcase-hero__video-frame"
        controls
        playsInline
        poster={slide.mediaPosterUrl}
      >
        <source src={selectedMediaUrl} />
      </video>
    );
  }

  return (
    <div className="ega-showcase-hero__image-frame">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <picture>
        {slide.mobileMediaUrl ? <source srcSet={slide.mobileMediaUrl} media="(max-width: 720px)" /> : null}
        <img
          src={selectedMediaUrl}
          alt={slide.mediaAlt}
          className="ega-showcase-hero__image"
          style={{
            objectFit: slide.objectFit === "contain" ? "contain" : "cover",
            objectPosition: slide.focalPoint?.trim() || "center"
          }}
          onError={() => setImageFailed(true)}
        />
      </picture>
    </div>
  );
}

function preventPreviewNavigation(event: React.MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
}

const emptyShowcaseSlide: HomeShowcaseSlide = {
  id: "empty",
  label: "Ana Sayfa",
  title: "Henüz aktif slide yok",
  description: "Yayına almadan önce en az bir aktif slide oluşturun.",
  tone: "teal",
  mediaType: "IMAGE",
  mediaUrl: "",
  mediaAlt: ""
};
