"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ButtonLink, HomeShowcaseHero, SectionHeading, type HomeShowcaseSlide } from "@ega/ui";
import { PackageCard as CatalogPackageCard } from "../components/package-card";
import { PublicFooter } from "../components/public-footer";
import { PublicNavbar } from "../components/public-navbar";
import { usePublicSiteSettings } from "../components/public-site-settings-provider";
import { SuccessShowcase } from "../components/success-showcase";
import { ShowcaseQuickActions } from "../components/showcase-quick-actions";
import { isEmbeddableVideoUrl, normalizeVideoEmbedUrl } from "../lib/media-url";
import { getPackageCatalogContent } from "../lib/public-commerce-api";
import {
  packageCategories,
  packageProducts,
  type PackageCategory,
  type PackageProduct
} from "../lib/package-catalog";
import {
  getMarketingPageContent,
  getSuccessStories,
  type SuccessStoryContent,
  type MarketingPageContent
} from "../lib/public-content-api";
import {
  HOME_SECTION_KEYS,
  findHomeSection,
  readContactCta,
  readFeatureHighlights,
  readLogoRail,
  readVideoShowcase,
  resolveCtaHref,
  type HomeVideoCard
} from "../lib/home-sections";


const showcaseSlides: readonly HomeShowcaseSlide[] = [
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
] as const;

function isShowcaseTone(value: unknown): value is HomeShowcaseSlide["tone"] {
  return value === "amber" || value === "teal" || value === "blue";
}

function isShowcaseMediaType(value: unknown): value is HomeShowcaseSlide["mediaType"] {
  return value === "IMAGE" || value === "VIDEO";
}

function looksLikeEmbedUrl(value: string) {
  return isEmbeddableVideoUrl(value);
}

function normalizeShowcaseSlides(
  payload: Record<string, unknown> | undefined,
  fallbackSlides: readonly HomeShowcaseSlide[],
  sectionOverride?: {
    eyebrow?: string;
    title?: string;
    body?: string;
  }
): HomeShowcaseSlide[] {
  const hasManagedSlides = Array.isArray(payload?.slides);
  const payloadSlides: unknown[] = Array.isArray(payload?.slides) ? payload.slides : [];

  if (!hasManagedSlides) {
    return fallbackSlides.map((slide, index) =>
      index === 0 && sectionOverride
        ? {
            ...slide,
            label: sectionOverride.eyebrow ?? slide.label,
            title: sectionOverride.title ?? slide.title,
            description: sectionOverride.body ?? slide.description
          }
        : slide
    );
  }

  return payloadSlides
    .map((rawSlide, index): HomeShowcaseSlide | null => {
      if (!rawSlide || typeof rawSlide !== "object") {
        return null;
      }

      const source = rawSlide as Record<string, unknown>;
      const fallback = fallbackSlides[index] ?? fallbackSlides[0];
      const mediaUrl = typeof source.mediaUrl === "string" ? source.mediaUrl.trim() : fallback.mediaUrl;

      return {
        id: typeof source.id === "string" && source.id.trim().length > 0 ? source.id : fallback.id,
        label:
          typeof source.label === "string" && source.label.trim().length > 0
            ? source.label
            : fallback.label,
        title:
          typeof source.title === "string" && source.title.trim().length > 0
            ? source.title
            : fallback.title,
        description:
          typeof source.description === "string" && source.description.trim().length > 0
            ? source.description
            : fallback.description,
        tone: isShowcaseTone(source.tone) ? source.tone : fallback.tone,
        mediaType: isShowcaseMediaType(source.mediaType) ? source.mediaType : fallback.mediaType,
        mediaUrl,
        mediaPosterUrl:
          typeof source.mediaPosterUrl === "string" && source.mediaPosterUrl.trim().length > 0
            ? source.mediaPosterUrl.trim()
            : fallback.mediaPosterUrl,
        mobileMediaUrl:
          typeof source.mobileMediaUrl === "string" && source.mobileMediaUrl.trim().length > 0
            ? source.mobileMediaUrl.trim()
            : fallback.mobileMediaUrl,
        mediaAlt:
          typeof source.mediaAlt === "string" && source.mediaAlt.trim().length > 0
            ? source.mediaAlt
            : fallback.mediaAlt,
        primaryCtaLabel: typeof source.primaryCtaLabel === "string" ? source.primaryCtaLabel : fallback.primaryCtaLabel,
        primaryCtaHref: typeof source.primaryCtaHref === "string" ? source.primaryCtaHref : fallback.primaryCtaHref,
        secondaryCtaLabel: typeof source.secondaryCtaLabel === "string" ? source.secondaryCtaLabel : fallback.secondaryCtaLabel,
        secondaryCtaHref: typeof source.secondaryCtaHref === "string" ? source.secondaryCtaHref : fallback.secondaryCtaHref,
        objectFit: source.objectFit === "contain" ? "contain" : "cover",
        focalPoint: typeof source.focalPoint === "string" ? source.focalPoint : fallback.focalPoint,
        isActive: typeof source.isActive === "boolean" ? source.isActive : fallback.isActive ?? true
      } satisfies HomeShowcaseSlide;
    })
    .filter((slide): slide is HomeShowcaseSlide => slide !== null);
}

type ShowcaseSliderSettings = {
  autoplay: boolean;
  intervalMs: number;
  transition: "fade" | "slide";
  pauseOnHover: boolean;
  showArrows: boolean;
  showDots: boolean;
  keyboard: boolean;
  swipe: boolean;
  initialSlideId: string;
};

const defaultShowcaseSliderSettings: ShowcaseSliderSettings = {
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

function normalizeShowcaseSettings(payload: Record<string, unknown> | undefined): ShowcaseSliderSettings {
  const settings = payload?.settings;

  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    return defaultShowcaseSliderSettings;
  }

  const source = settings as Record<string, unknown>;
  const intervalMs =
    typeof source.intervalMs === "number"
      ? Math.min(Math.max(source.intervalMs, 2500), 15000)
      : defaultShowcaseSliderSettings.intervalMs;

  return {
    autoplay: typeof source.autoplay === "boolean" ? source.autoplay : defaultShowcaseSliderSettings.autoplay,
    intervalMs,
    transition: source.transition === "slide" ? "slide" : defaultShowcaseSliderSettings.transition,
    pauseOnHover:
      typeof source.pauseOnHover === "boolean"
        ? source.pauseOnHover
        : defaultShowcaseSliderSettings.pauseOnHover,
    showArrows: typeof source.showArrows === "boolean" ? source.showArrows : defaultShowcaseSliderSettings.showArrows,
    showDots: typeof source.showDots === "boolean" ? source.showDots : defaultShowcaseSliderSettings.showDots,
    keyboard: typeof source.keyboard === "boolean" ? source.keyboard : defaultShowcaseSliderSettings.keyboard,
    swipe: typeof source.swipe === "boolean" ? source.swipe : defaultShowcaseSliderSettings.swipe,
    initialSlideId:
      typeof source.initialSlideId === "string" && source.initialSlideId.trim()
        ? source.initialSlideId.trim()
        : defaultShowcaseSliderSettings.initialSlideId
  };
}

function getActiveCategory(
  categories: readonly PackageCategory[],
  categoryId: string | null
) {
  return categories.find((category) => category.id === categoryId) ?? null;
}

function getActiveSubcategory(
  categories: readonly PackageCategory[],
  categoryId: string | null,
  subcategoryId: string | null
) {
  const activeCategory = getActiveCategory(categories, categoryId);

  if (!activeCategory || !subcategoryId) {
    return null;
  }

  return activeCategory.subcategories.find((subcategory) => subcategory.id === subcategoryId) ?? null;
}

function getVisibleProducts(
  products: readonly PackageProduct[],
  categoryId: string | null,
  subcategoryId: string | null
) {
  return products.filter((product) => {
    if (categoryId && product.categoryId !== categoryId) {
      return false;
    }

    if (subcategoryId && product.subcategoryId !== subcategoryId) {
      return false;
    }

    return true;
  });
}

function VideoCard({ title, category, duration, teacher, summary, tone }: HomeVideoCard) {
  return (
    <article className="ega-video-card" data-tone={tone}>
      <div className="ega-video-card__cover">
        <button className="ega-video-card__play" type="button" aria-label={`${title} ön izleme kartı`}>
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M8 6.5v11l9-5.5-9-5.5Z" fill="currentColor" />
          </svg>
        </button>
        <div className="ega-video-card__pulse" />
      </div>

      <div className="ega-video-card__body">
        <div className="ega-video-card__meta">
          <span>{duration}</span>
          <span>{teacher}</span>
        </div>
        <h3>{title}</h3>
        <p>{summary}</p>
        <a href="/kayit" className="ega-video-card__link">
          Ön izleme akışını incele
        </a>
      </div>
    </article>
  );
}

export default function HomePage() {
  const [homePageContent, setHomePageContent] = useState<MarketingPageContent | null>(null);
  const siteSettings = usePublicSiteSettings();
  const [catalogCategories, setCatalogCategories] =
    useState<readonly PackageCategory[]>(packageCategories);
  const [catalogProducts, setCatalogProducts] =
    useState<readonly PackageProduct[]>(packageProducts);
  const [successStories, setSuccessStories] = useState<readonly SuccessStoryContent[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>("online-coaching");
  const [activeSubcategoryId, setActiveSubcategoryId] = useState<string | null>(null);
  const [activeShowcaseSlide, setActiveShowcaseSlide] = useState(0);
  const [showcasePaused, setShowcasePaused] = useState(false);
  const [activeFeatureId, setActiveFeatureId] = useState<string | null>(null);
  const showcaseSection = homePageContent?.sections.find((section) => section.sectionKey === "showcase-hero");
  const logoRail = readLogoRail(findHomeSection(homePageContent?.sections, HOME_SECTION_KEYS.logoRail));
  const videoShowcase = readVideoShowcase(
    findHomeSection(homePageContent?.sections, HOME_SECTION_KEYS.videoShowcase)
  );
  const featureSection = readFeatureHighlights(
    findHomeSection(homePageContent?.sections, HOME_SECTION_KEYS.featureHighlights)
  );
  const contactCta = readContactCta(findHomeSection(homePageContent?.sections, HOME_SECTION_KEYS.contactCta));
  const packageSurfaceSection = homePageContent?.sections.find((section) => section.sectionKey === "package-surface");

  const showcaseSlidesWithContent = normalizeShowcaseSlides(showcaseSection?.payload, showcaseSlides, {
    eyebrow: showcaseSection?.eyebrow ?? undefined,
    title: showcaseSection?.title,
    body: showcaseSection?.body ?? undefined
  });
  const showcaseSettings = normalizeShowcaseSettings(showcaseSection?.payload);
  const activeShowcaseSlideCount = Math.max(1, showcaseSlidesWithContent.filter((slide) => slide.isActive !== false).length);
  const activeInitialShowcaseIndex = showcaseSlidesWithContent
    .filter((slide) => slide.isActive !== false)
    .findIndex((slide) => slide.id === showcaseSettings.initialSlideId);

  useEffect(() => {
    const showcaseInterval = showcaseSettings.autoplay && !showcasePaused
      ? window.setInterval(() => {
          setActiveShowcaseSlide((current) => (current + 1) % activeShowcaseSlideCount);
        }, showcaseSettings.intervalMs)
      : null;

    return () => {
      if (showcaseInterval !== null) {
        window.clearInterval(showcaseInterval);
      }
    };
  }, [activeShowcaseSlideCount, showcasePaused, showcaseSettings.autoplay, showcaseSettings.intervalMs]);

  useEffect(() => {
    setActiveShowcaseSlide((current) => Math.min(current, activeShowcaseSlideCount - 1));
  }, [activeShowcaseSlideCount]);

  useEffect(() => {
    if (activeInitialShowcaseIndex >= 0) {
      setActiveShowcaseSlide(activeInitialShowcaseIndex);
    }
  }, [activeInitialShowcaseIndex]);

  useEffect(() => {
    let isCancelled = false;

    void getMarketingPageContent("home").then((page) => {
      if (!isCancelled) {
        setHomePageContent(page);
      }
    });

    void getPackageCatalogContent().then((catalog) => {
      if (!isCancelled) {
        setCatalogCategories(catalog.categories);
        setCatalogProducts(catalog.products);
      }
    });

    void getSuccessStories().then((stories) => {
      if (!isCancelled) {
        setSuccessStories(stories);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  const activeFeature =
    featureSection.items.find((item) => item.id === activeFeatureId) ?? featureSection.items[0];
  const activeCategory = getActiveCategory(catalogCategories, activeCategoryId);
  const activeSubcategory = getActiveSubcategory(
    catalogCategories,
    activeCategoryId,
    activeSubcategoryId
  );
  const visibleProducts = getVisibleProducts(catalogProducts, activeCategoryId, activeSubcategoryId);

  return (
    <main className="ega-page">
      <PublicNavbar />

      <HomeShowcaseHero
        slides={showcaseSlidesWithContent}
        activeIndex={activeShowcaseSlide}
        onSelectSlide={setActiveShowcaseSlide}
        isEmbedVideo={looksLikeEmbedUrl}
        normalizeVideoUrl={normalizeVideoEmbedUrl}
        showArrows={showcaseSettings.showArrows}
        showIndicators={showcaseSettings.showDots}
        keyboardNavigation={showcaseSettings.keyboard}
        swipeNavigation={showcaseSettings.swipe}
        pauseOnHover={showcaseSettings.pauseOnHover}
        transition={showcaseSettings.transition}
        onHoverPauseChange={setShowcasePaused}
      />

      <section className="ega-showcase-actions-section" aria-label="Hızlı etkileşim alanı">
        <div className="ega-container ega-showcase-actions-section__inner">
          <ShowcaseQuickActions sourcePage="home-showcase-free-call" align="center" />
        </div>
      </section>

      <section className="ega-logo-rail-section">
        <div className="ega-logo-rail">
          <div className="ega-logo-rail__track">
            {[...logoRail.items, ...logoRail.items].map((item, index) => (
              <div key={`${item.id}-${index}`} className="ega-logo-chip">
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={220}
                  height={88}
                  className="ega-logo-chip__image"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ega-section ega-container" id="paketler">
        <SectionHeading
          title={packageSurfaceSection?.title ?? "Sana En Uygun Paketi Seç"}
          description={packageSurfaceSection?.body ?? undefined}
        />

        <div className="ega-filter-shell ega-filter-shell--directory">
          <div className="ega-filter-shell__mode ega-filter-shell__mode--directory">
            {catalogCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                className="ega-filter-mode"
                data-active={activeCategory?.id === category.id}
                onClick={() => {
                  setActiveCategoryId(category.id);
                  setActiveSubcategoryId(null);
                }}
              >
                {category.label}
              </button>
            ))}
          </div>

          {activeCategory ? (
            <div className="ega-filter-shell__subcategories">
              {activeCategory.subcategories.map((subcategory) => (
                <button
                  key={subcategory.id}
                  type="button"
                  className="ega-filter-option ega-filter-option--compact"
                  data-active={activeSubcategory?.id === subcategory.id}
                  onClick={() => setActiveSubcategoryId(subcategory.id)}
                >
                  <strong>{subcategory.label}</strong>
                  <span>{subcategory.description}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="ega-pack-grid">
          {visibleProducts.map((product) => (
            <CatalogPackageCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {successStories.length > 0 ? <SuccessShowcase stories={successStories} /> : null}

      <section className="ega-section ega-container" id="videolar">
        <SectionHeading title={videoShowcase.title} description={videoShowcase.description} />

        <div className="ega-video-grid">
          {videoShowcase.items.map((video) => (
            <VideoCard key={video.id} {...video} />
          ))}
        </div>
      </section>

      <section className="ega-section ega-container" id="neler-var">
        <SectionHeading title={featureSection.title} description={featureSection.description} />

        <div className="ega-feature-layout">
          <div className="ega-feature-band" aria-label="Bekleyen deneyim başlıkları">
            {featureSection.items.map((item) => (
              <button
                key={item.id}
                type="button"
                className="ega-feature-band__item"
                data-active={activeFeature?.id === item.id}
                onMouseEnter={() => setActiveFeatureId(item.id)}
                onFocus={() => setActiveFeatureId(item.id)}
                onClick={() => setActiveFeatureId(item.id)}
              >
                <span className="ega-feature-band__dot" />
                <strong>{item.label}</strong>
              </button>
            ))}
          </div>

          <article className="ega-experience-stage" data-tone={activeFeature?.tone}>
            <div className="ega-experience-stage__media">
              <div className="ega-experience-stage__media-shell">
                <div className="ega-experience-stage__placeholder">
                  <span className="ega-experience-stage__badge">{activeFeature?.mediaLabel}</span>
                  <strong>{activeFeature?.mediaTitle}</strong>
                  <span>{activeFeature?.mediaBody}</span>
                </div>
              </div>
            </div>

            <div className="ega-experience-stage__copy">
              <h3>{activeFeature?.title}</h3>
              <p>{activeFeature?.body}</p>
            </div>
          </article>
        </div>
      </section>

      <section className="ega-section ega-container ega-cta-section" id="iletisim">
        <div className="ega-cta-panel">
          <div className="ega-cta-panel__brand-logo">
            <img src={siteSettings.logoLightUrl} alt={siteSettings.logoAltText} />
          </div>
          <div className="ega-cta-panel__copy">
            <span className="ega-pill ega-pill--warm">{contactCta.eyebrow}</span>
            <h2>{contactCta.title}</h2>
            <p>{contactCta.body}</p>
          </div>

          <div className="ega-cta-panel__actions">
            {contactCta.actions.map((action) => (
              <ButtonLink
                key={action.id}
                href={resolveCtaHref(action.href, siteSettings)}
                label={action.label}
                variant={action.variant === "primary" ? undefined : "ghost"}
                target={action.openInNewTab ? "_blank" : undefined}
                rel={action.openInNewTab ? "noreferrer" : undefined}
              />
            ))}
          </div>
        </div>
      </section>

      <PublicFooter settings={siteSettings} />

      <a
        className="ega-contact-bookmark"
        href={siteSettings.whatsappHref}
        aria-label="WhatsApp ile iletişime geçin"
        title="WhatsApp ile iletişime geçin"
        target="_blank"
        rel="noreferrer"
      >
        <span>WhatsApp ile Yazın</span>
      </a>
    </main>
  );
}
