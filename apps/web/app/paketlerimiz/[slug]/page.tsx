import { notFound } from "next/navigation";
import { ButtonLink, SectionHeading } from "@ega/ui";
import { PublicPageLayout } from "../../../components/public-page-layout";
import {
  buildPackagesPageHref,
  getPackageCategoryById,
  getPackageSubcategoryById
} from "../../../lib/package-catalog";
import {
  getPackageCatalogContent,
  getPackageProductBySlug
} from "../../../lib/public-commerce-api";

export default async function PackageDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const catalog = await getPackageCatalogContent();
  const product =
    catalog.products.find((entry) => entry.slug === slug) ?? (await getPackageProductBySlug(slug));

  if (!product) {
    notFound();
  }

  const category =
    catalog.categories.find((entry) => entry.id === product.categoryId) ??
    getPackageCategoryById(product.categoryId);
  const subcategory =
    catalog.categories
      .flatMap((entry) => entry.subcategories)
      .find((entry) => entry.id === product.subcategoryId) ??
    getPackageSubcategoryById(product.subcategoryId);

  return (
    <PublicPageLayout>
      <section className="ega-page-banner ega-page-banner--detail">
        <div className="ega-container ega-page-banner__inner">
          <div className="ega-page-banner__copy">
            <span className="ega-eyebrow">{category?.label ?? "Paket Detayı"}</span>
            <h1>{product.title}</h1>
            <p>{product.subtitle}</p>
          </div>

          <div className="ega-page-banner__panel">
            <span>{subcategory?.label ?? "Alt kategori"}</span>
            <strong>{product.price}</strong>
            <p>
              {product.provider === "redirect"
                ? "Koçluk yönlendirmeli ödeme"
                : "Yerel satın alma akışı"}
            </p>
          </div>
        </div>
      </section>

      <section className="ega-section ega-container">
        <div className="ega-detail-layout">
          <div className="ega-detail-main ega-highlight-card ega-highlight-card--primary">
            <span className="ega-pill ega-pill--dark">{product.badge}</span>
            <h3>Bu paket neyi çözüyor?</h3>
            <p>
              {product.provider === "redirect"
                ? "Koçluk ürünleri bu sitede açıklanır, sipariş kaydı yerel olarak tutulur ve ödeme dış sağlayıcıya yönlendirilir."
                : "Video, kamp veya kulüp ürünleri yerel akış içinde satılır ve öğrenci hesabına düzenli şekilde bağlanır."}
            </p>
          </div>

          <div className="ega-detail-side ega-auth-card">
            <SectionHeading
              eyebrow="İçerik Başlıkları"
              title="Kart içinde göreceğin temel kazanımlar"
              description="İnceleme sayfası sade tutuldu. İleride admin panelden yönetilecek ürün detay blokları burada genişletilebilir."
            />

            <ul className="ega-pack-card__features ega-pack-card__features--detail">
              {product.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>

            <div className="ega-pack-card__actions ega-pack-card__actions--split">
              <ButtonLink
                href={buildPackagesPageHref(product.categoryId, product.subcategoryId)}
                label="Listeye Dön"
                variant="ghost"
              />
              <ButtonLink href={`/checkout/${product.slug}`} label="Satın Al" />
            </div>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
}
