"use client";

import { useState } from "react";
import { ButtonLink } from "@ega/ui";
import type { PackageProduct } from "../lib/package-catalog";
import { ProductIntroVideo } from "./product-intro-video";

type PackageCardProps = {
  product: PackageProduct;
};

const MOBILE_FEATURE_LIMIT = 5;

export function PackageCard({ product }: PackageCardProps) {
  const [showAllMobileFeatures, setShowAllMobileFeatures] = useState(false);
  const featureTitles = product.featureDetails?.length
    ? product.featureDetails.map((feature) => feature.title)
    : product.features;
  const hasMobileHiddenFeatures = featureTitles.length > MOBILE_FEATURE_LIMIT;

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
          <li key={feature} data-mobile-extra={index >= MOBILE_FEATURE_LIMIT ? "true" : undefined}>
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
          href={`/paketlerimiz/${product.slug}`}
          label="İncele"
          variant="ghost"
          className="ega-button--inspect"
        />
        <ButtonLink href={`/checkout/${product.slug}`} label="Satın Al" />
      </div>
    </article>
  );
}
