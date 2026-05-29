import { notFound } from "next/navigation";
import { ButtonLink, SectionHeading } from "@ega/ui";
import { PublicPageLayout } from "../../../components/public-page-layout";
import { ProductIntroVideo } from "../../../components/product-intro-video";
import {
  buildPackagesPageHref,
  getPackageCategoryById,
  getPackageSubcategoryById
} from "../../../lib/package-catalog";
import {
  getPackageCatalogContent,
  getPackageProductBySlug
} from "../../../lib/public-commerce-api";

export async function generateStaticParams() {
  const catalog = await getPackageCatalogContent();

  return catalog.products.map((product) => ({
    slug: product.slug
  }));
}

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
  const featureEntries = product.featureDetails?.length
    ? product.featureDetails
    : product.features.map((feature) => ({ title: feature, description: undefined }));

  return (
    <PublicPageLayout>
      <section className="ega-section ega-container">
        <div className="ega-detail-layout">
          <div className="ega-detail-main ega-highlight-card ega-highlight-card--primary">
            <ProductIntroVideo product={product} variant="detail" />
            <div className="ega-detail-main__body">
              <h1>{product.title}</h1>
              <p>{product.subtitle}</p>
              <h2>{category?.label ?? "Paket"} programı kimler için uygun?</h2>
              <p>
                {product.description ??
                  "Bu paket; hedefini netleştirmek, haftalık çalışma düzenini görünür hale getirmek ve sınav hazırlığını daha kontrollü yürütmek isteyen öğrenciler için tasarlanmıştır."}
              </p>
            </div>
          </div>

          <div className="ega-detail-side ega-auth-card">
            <SectionHeading
              title={subcategory?.label ? `${subcategory.label} kazanımları` : "Paket kazanımları"}
              description="Paket içeriğini, görüşme düzenini, erişim detaylarını ve öğrencinin süreç içinde ne kazanacağını aşağıdan inceleyebilirsin."
            />
            <div className="ega-filter-summary">
              <strong>{product.price}</strong>
              <span>
                {product.provider === "redirect"
                  ? "Başvuru ve yönlendirmeli ödeme akışı"
                  : "Yerel satın alma ve öğrenci paneli erişimi"}
              </span>
            </div>

            <ul className="ega-pack-card__features ega-pack-card__features--detail">
              {featureEntries.map((feature) => (
                <li key={feature.title}>
                  <strong>{feature.title}</strong>
                  {feature.description ? <span>{feature.description}</span> : null}
                </li>
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
