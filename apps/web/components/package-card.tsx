import { ButtonLink } from "@ega/ui";
import type { PackageProduct } from "../lib/package-catalog";

type PackageCardProps = {
  product: PackageProduct;
};

export function PackageCard({ product }: PackageCardProps) {
  return (
    <article className="ega-pack-card" data-tone={product.tone}>
      <div className="ega-pack-card__top">
        <span className="ega-pack-card__badge">{product.badge}</span>
        <strong className="ega-pack-card__price">{product.price}</strong>
      </div>

      <h3 className="ega-pack-card__title">{product.title}</h3>
      <p className="ega-pack-card__subtitle">{product.subtitle}</p>

      <ul className="ega-pack-card__features">
        {product.features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>

      <div className="ega-pack-card__actions ega-pack-card__actions--split">
        <ButtonLink href={`/paketlerimiz/${product.slug}`} label="İncele" variant="ghost" />
        <ButtonLink href={`/checkout/${product.slug}`} label="Satın Al" />
      </div>
    </article>
  );
}
