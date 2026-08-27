"use client";

import React, { useState, type MouseEvent } from "react";
import { ButtonLink } from "./components";
import { isDirectVideoUrl, normalizeVideoEmbedUrl } from "./package-media-url";

export type PackTone = "amber" | "teal" | "blue";
export type ProductIntroVideoSourceType = "DIRECT" | "EMBED";

export type PackageFeatureSpec = {
  title: string;
  description?: string;
  iconKey?: string | null;
};

export type PackageCardProduct = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  price: string;
  compareAtPrice?: string | null;
  hasInstallments?: boolean;
  installmentLabel?: string | null;
  badge: string;
  features: readonly string[];
  featureDetails?: readonly PackageFeatureSpec[];
  tone: PackTone;
  introVideoSourceType?: ProductIntroVideoSourceType | null;
  introVideoUrl?: string | null;
  introVideoPosterUrl?: string | null;
  introVideoTitle?: string | null;
};

type PackageCardProps = {
  product: PackageCardProduct;
  previewMode?: boolean;
};

type ProductIntroVideoProps = {
  product: Pick<
    PackageCardProduct,
    "title" | "introVideoSourceType" | "introVideoUrl" | "introVideoPosterUrl" | "introVideoTitle"
  >;
  variant?: "card" | "detail";
};

const MOBILE_FEATURE_LIMIT = 5;

export function ProductIntroVideo({ product, variant = "card" }: ProductIntroVideoProps) {
  const videoUrl = product.introVideoUrl?.trim();
  const normalizedVideoUrl = videoUrl ? normalizeVideoEmbedUrl(videoUrl) : "";
  const title = product.introVideoTitle?.trim() || `${product.title} tanıtım videosu`;
  const posterUrl = product.introVideoPosterUrl?.trim();
  const shellClassName =
    variant === "detail"
      ? "ega-product-video ega-product-video--detail"
      : "ega-product-video ega-product-video--card";

  if (!videoUrl) {
    return (
      <div className={shellClassName} data-has-video="false">
        <div className="ega-product-video__placeholder">
          <span className="ega-product-video__eyebrow">Video</span>
          <strong>{title}</strong>
        </div>
      </div>
    );
  }

  if (product.introVideoSourceType === "DIRECT" || isDirectVideoUrl(normalizedVideoUrl)) {
    return (
      <div className={shellClassName} data-has-video="true">
        <video
          className="ega-product-video__media"
          controls
          preload="metadata"
          playsInline
          poster={posterUrl || undefined}
          aria-label={title}
        >
          <source src={normalizedVideoUrl} />
          Tarayıcınız bu videoyu oynatamıyor.
        </video>
      </div>
    );
  }

  return (
    <div className={shellClassName} data-has-video="true">
      <iframe
        className="ega-product-video__media"
        src={normalizedVideoUrl}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}

export function PackageCard({ product, previewMode = false }: PackageCardProps) {
  const [showAllMobileFeatures, setShowAllMobileFeatures] = useState(false);
  const featureTitles = product.featureDetails?.length
    ? product.featureDetails.map((feature) => feature.title)
    : product.features;
  const hasMobileHiddenFeatures = featureTitles.length > MOBILE_FEATURE_LIMIT;
  const productHref = previewMode
    ? "#admin-card-preview"
    : product.slug
      ? `/paketlerimiz/${encodeURIComponent(product.slug)}`
      : "/paketlerimiz";
  const checkoutHref = previewMode
    ? "#admin-card-preview"
    : product.slug
      ? `/checkout/${encodeURIComponent(product.slug)}`
      : "/paketlerimiz";
  const preventPreviewNavigation = previewMode
    ? (event: MouseEvent<HTMLAnchorElement>) => event.preventDefault()
    : undefined;

  return (
    <article className="ega-pack-card" data-tone={product.tone}>
      <div className="ega-pack-card__top">
        <span className="ega-pack-card__price-group">
          {product.compareAtPrice ? (
            <span className="ega-pack-card__compare-price">{product.compareAtPrice}</span>
          ) : null}
          <strong className="ega-pack-card__price">{product.price}</strong>
          {product.installmentLabel ? (
            <span className="ega-pack-card__installment">{product.installmentLabel}</span>
          ) : null}
        </span>
      </div>

      <h3 className="ega-pack-card__title">{product.title}</h3>
      <p className="ega-pack-card__subtitle">{product.subtitle}</p>

      <ProductIntroVideo product={product} />

      <ul className="ega-pack-card__features" data-mobile-expanded={showAllMobileFeatures}>
        {featureTitles.map((feature, index) => (
          <li key={`${feature}-${index}`} data-mobile-extra={index >= MOBILE_FEATURE_LIMIT ? "true" : undefined}>
            <strong>{feature}</strong>
          </li>
        ))}
      </ul>

      {hasMobileHiddenFeatures ? (
        <button
          type="button"
          className="ega-pack-card__feature-toggle"
          aria-expanded={showAllMobileFeatures}
          onClick={() => setShowAllMobileFeatures((current) => !current)}
        >
          {showAllMobileFeatures ? "Daha az göster" : "Tüm özellikleri gör"}
        </button>
      ) : null}

      <div className="ega-pack-card__actions ega-pack-card__actions--split">
        <ButtonLink
          href={productHref}
          label="İncele"
          variant="ghost"
          className="ega-button--inspect"
          onClick={preventPreviewNavigation}
          ariaDisabled={previewMode}
        />
        <ButtonLink
          href={checkoutHref}
          label="Satın Al"
          onClick={preventPreviewNavigation}
          ariaDisabled={previewMode}
        />
      </div>
    </article>
  );
}
