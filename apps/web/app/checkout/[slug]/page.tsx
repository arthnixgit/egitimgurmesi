import { notFound } from "next/navigation";
import { PublicPageLayout } from "../../../components/public-page-layout";
import { CheckoutFlow } from "../../../components/checkout-flow";
import { getPackageProductBySlug } from "../../../lib/public-commerce-api";

export default async function CheckoutPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getPackageProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <PublicPageLayout>
      <section className="ega-page-banner ega-page-banner--detail">
        <div className="ega-container ega-page-banner__inner">
          <div className="ega-page-banner__copy">
            <span className="ega-eyebrow">Ödeme Hazırlığı</span>
            <h1>{product.title} için satın alma akışı</h1>
            <p>
              Sipariş kaydı burada oluşturulur. Ürün tipine göre yerel ödeme temeli veya
              Unikazan yönlendirmesi başlatılır.
            </p>
          </div>

          <div className="ega-page-banner__panel">
            <span>Seçilen ürün</span>
            <strong>{product.price}</strong>
            <p>{product.provider === "redirect" ? "Koçluk yönlendirme akışı" : "Yerel ödeme hazırlığı"}</p>
          </div>
        </div>
      </section>

      <CheckoutFlow product={product} />
    </PublicPageLayout>
  );
}
