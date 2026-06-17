import Link from "next/link";
import { PublicPageLayout } from "../../../components/public-page-layout";
import { CheckoutFlow } from "../../../components/checkout-flow";
import { getPackageCatalogContent, getPackageProductBySlug } from "../../../lib/public-commerce-api";

export async function generateStaticParams() {
  const catalog = await getPackageCatalogContent();

  return catalog.products.map((product) => ({
    slug: product.slug
  }));
}

export default async function CheckoutPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getPackageProductBySlug(slug);

  if (!product) {
    return (
      <PublicPageLayout>
        <section className="ega-section ega-container">
          <div className="ega-auth-card">
            <div className="ega-pill">Paket</div>
            <h1>Paket bilgisi bulunamadı.</h1>
            <p>Seçtiğin paket şu anda görüntülenemiyor. Paket listesinden tekrar seçim yapabilirsin.</p>
            <div className="ega-actions">
              <Link className="ega-button" href="/paketlerimiz">
                Paketleri İncele
              </Link>
              <Link className="ega-button ega-button--ghost" href="/">
                Ana Sayfaya Dön
              </Link>
            </div>
          </div>
        </section>
      </PublicPageLayout>
    );
  }

  return (
    <PublicPageLayout>
      <CheckoutFlow product={product} />
    </PublicPageLayout>
  );
}
